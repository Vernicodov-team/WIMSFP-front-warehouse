import { useEffect, useRef } from "react";
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

const HUB_URL = "http://localhost:5094/hubs/dashboard";

// Задержка повторной попытки первичного подключения.
const RETRY_DELAY_MS = 5000;

function useDashboardSignalR({ onDataChanged, onNotification }) {
  // Обработчики храним в ref, чтобы соединение не пересоздавалось
  // при каждом ре-рендере и не зависело от нестабильных колбэков.
  const handlersRef = useRef({ onDataChanged, onNotification });

  useEffect(() => {
    handlersRef.current = { onDataChanged, onNotification };
  }, [onDataChanged, onNotification]);

  useEffect(() => {
    let isActive = true;
    let retryTimer = null;

    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    // Обновляем данные при ЛЮБОМ сигнале от бэкенда,
    // не разбирая текст сообщения. Сообщение используется только
    // для всплывающего уведомления.
    function handleDataChanged(message) {
      handlersRef.current.onNotification?.(message);
      handlersRef.current.onDataChanged?.();
    }

    connection.on("dataChanged", handleDataChanged);

    async function startConnection() {
      if (
        !isActive ||
        connection.state !== HubConnectionState.Disconnected
      ) {
        return;
      }

      try {
        await connection.start();
        console.log("SignalR подключён");
      } catch (error) {
        console.error("Ошибка подключения SignalR:", error);

        // Автоповтор действует только после успешного старта,
        // поэтому первичную неудачу (бэкенд поднялся позже страницы)
        // повторяем вручную.
        if (isActive) {
          retryTimer = window.setTimeout(
            startConnection,
            RETRY_DELAY_MS,
          );
        }
      }
    }

    startConnection();

    return () => {
      isActive = false;

      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }

      connection.off("dataChanged", handleDataChanged);
      connection.stop();
    };
  }, []);
}

export default useDashboardSignalR;
