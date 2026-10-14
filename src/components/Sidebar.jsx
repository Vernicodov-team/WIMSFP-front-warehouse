const menuItems = [
  { label: "Главная", icon: "◈" },
  { label: "История поставок", icon: "↗" },
  { label: "Склад", icon: "▤" },
  { label: "История заказов", icon: "▣" },
  { label: "Редактор содержимого", icon: "✎" },
  { label: "Ввод поставок", icon: "+" },
  { label: "Панель управления пользователями", icon: "♙" },
];

function Sidebar({ activePage, onPageChange, visiblePages = [] }) {
  const visibleItems = menuItems.filter((item) =>
      visiblePages.includes(item.label)
  );

  return (
      <aside className="flex min-h-screen w-full flex-col border-r border-[#eee4dc] bg-[#fffaf6] p-4 sm:w-64">
        <div className="mb-8 px-3 pt-2">
          <div className="text-lg font-bold text-[#45372f]">Админ-панель</div>
          <div className="mt-1 text-xs text-[#97877c]">Управление складом</div>
        </div>

        <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-[#a09288]">
          Разделы
        </div>

        <nav className="flex flex-col gap-1">
          {visibleItems.map((item) => {
            const isActive = activePage === item.label;

            return (
                <button
                    key={item.label}
                    type="button"
                    onClick={() => onPageChange(item.label)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex min-h-[42px] w-full items-center gap-3 rounded-[10px] px-3 text-left text-[13px] transition ${
                        isActive
                            ? "bg-[#fbd9bd] font-bold text-[#c85d18]"
                            : "font-medium text-[#776960] hover:bg-[#fce5d3] hover:text-[#c85d18]"
                    }`}
                >
              <span className="w-5 text-center" aria-hidden="true">
                {item.icon}
              </span>
                  <span>{item.label}</span>
                </button>
            );
          })}
        </nav>
      </aside>
  );
}

export default Sidebar;