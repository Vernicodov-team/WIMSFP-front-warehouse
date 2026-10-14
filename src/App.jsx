import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import DeliveriesHistory from "./pages/DeliveriesHistory";
import Warehouse from "./pages/Warehouse";
import ContentEditor from "./pages/ContentEditor";
import OrdersHistory from "./pages/OrdersHistory";

function App() {
  const [activePage, setActivePage] = useState("Главная");

  function renderPage() {
    if (activePage === "Главная") {
      return <Dashboard />;
    }

    if (activePage === "История поставок") {
      return <DeliveriesHistory />;
    }

    if (activePage === "Склад") {
      return <Warehouse />;
    }

    if (activePage === "Редактор содержимого") {
      return <ContentEditor />;
    }

    if (activePage === "История заказов") {
      return <OrdersHistory />;
    }

    return (
      <main className="min-h-screen bg-[#fff8f1] px-8 py-8">
        <div className="rounded-[24px] bg-white p-8 shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
          <div className="mb-2 text-[12px] text-[#ad8e7a]">
            Раздел панели управления
          </div>

          <h2 className="text-[32px] font-extrabold tracking-[-0.05em] text-[#332d29]">
            {activePage}
          </h2>

          <p className="mt-3 text-[14px] text-[#958278]">
            Страница будет добавлена следующим этапом.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f1]">
      <Sidebar
        activePage={activePage}
        onPageChange={setActivePage}
      />

      <div className="ml-[266px]">{renderPage()}</div>
    </div>
  );
}

export default App;