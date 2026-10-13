import { useState } from "react";
import Sidebar from "./components/Sidebar";

function App() {
  const [activePage, setActivePage] = useState("Дашборд");

  return (
    <div className="min-h-screen bg-[#fff8f1]">
      <Sidebar
        activePage={activePage}
        onPageChange={setActivePage}
      />

      <main className="ml-[266px] min-h-screen p-8">
        <div className="rounded-[24px] bg-white p-8 shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
          <div className="mb-2 text-[12px] text-[#ad8e7a]">
            Раздел склада
          </div>

          <h2 className="text-[32px] font-extrabold tracking-[-0.05em] text-[#332d29]">
            {activePage}
          </h2>

          <p className="mt-3 text-[14px] text-[#958278]">
            Страница будет добавлена следующим этапом.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;