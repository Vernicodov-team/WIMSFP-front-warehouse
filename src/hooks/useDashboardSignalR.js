import { useEffect } from "react";
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

const HUB_URL = "http://localhost:5094/hubs/dashboard";

function useDashboardSignalR({ onDataChanged, onNotification }) {
  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    function handleDataChanged(message) {
      onNotification?.(message);
      onDataChanged?.();
    }

    connection.on("dataChanged", handleDataChanged);

    async function startConnection() {
      try {
        if (connection.state === HubConnectionState.Disconnected) {
          await connection.start();
          console.log("SignalR подключён");
        }
      } catch (error) {
        console.error("Ошибка подключения SignalR:", error);
      }
    }

    startConnection();

    return () => {
      connection.off("dataChanged", handleDataChanged);
      connection.stop();
    };
  }, [onDataChanged, onNotification]);
}

export default useDashboardSignalR;