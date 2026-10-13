const menuItems = [
  {
    label: "Дашборд",
    icon: "▦",
  },
  {
    label: "История поставок",
    icon: "↗",
  },
  {
    label: "Список продуктов",
    icon: "▤",
  },
  {
    label: "История заказов (Всех)",
    icon: "▣",
  },
  {
    label: "Редактор меню (блюд)",
    icon: "✎",
  },
  {
    label: "Ввод поставок",
    icon: "+",
  },
  {
    label: "Панель управления пользователями",
    icon: "♙",
  },
];

function Sidebar({ activePage, onPageChange }) {
  return (
    <aside className="fixed left-2 top-2 z-10 flex h-[calc(100vh-16px)] w-[250px] flex-col rounded-[16px] bg-[#fff1e4] px-3 py-5">
      <div className="px-3">
        <h1 className="text-[18px] font-extrabold tracking-[-0.04em] text-[#332d29]">
          Склад
        </h1>
      </div>

      <div className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#ae9483]">
        Разделы
      </div>

      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => {
          const isActive = activePage === item.label;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onPageChange(item.label)}
              className={`flex min-h-[40px] w-full items-center gap-3 rounded-[10px] px-3 text-left text-[13px] transition ${
                isActive
                  ? "bg-[#fbd9bd] font-bold text-[#c85d18]"
                  : "font-medium text-[#776960] hover:bg-[#fce5d3] hover:text-[#c85d18]"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[15px] ${
                  isActive
                    ? "bg-[#ef741d] font-bold text-white"
                    : "text-[#9d8678]"
                }`}
              >
                {item.icon}
              </span>

              <span className="leading-4">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;