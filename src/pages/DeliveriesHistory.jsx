import { useMemo, useState } from "react";

const deliveries = [
  {
    id: 1,
    number: "П-1042",
    date: "2026-10-13",
    supplier: "ООО «ФудПоставка»",
    totalWeight: 240,
    cost: 64500,
    products: [
      {
        name: "Куриное филе",
        quantity: 25,
        unit: "кг",
        productionDate: "2026-10-07",
        expirationDate: "2026-10-14",
        price: 420,
      },
      {
        name: "Томаты",
        quantity: 40,
        unit: "кг",
        productionDate: "2026-10-10",
        expirationDate: "2026-10-17",
        price: 180,
      },
    ],
  },
  {
    id: 2,
    number: "П-1041",
    date: "2026-10-11",
    supplier: "ООО «Свежий продукт»",
    totalWeight: 180,
    cost: 48200,
    products: [
      {
        name: "Сливки 20%",
        quantity: 30,
        unit: "л",
        productionDate: "2026-10-09",
        expirationDate: "2026-10-16",
        price: 260,
      },
      {
        name: "Моцарелла",
        quantity: 18,
        unit: "кг",
        productionDate: "2026-10-08",
        expirationDate: "2026-10-18",
        price: 540,
      },
    ],
  },
  {
    id: 3,
    number: "П-1040",
    date: "2026-10-08",
    supplier: "ИП «Овощной мир»",
    totalWeight: 320,
    cost: 37600,
    products: [
      {
        name: "Картофель",
        quantity: 120,
        unit: "кг",
        productionDate: "2026-10-01",
        expirationDate: "2026-12-01",
        price: 70,
      },
      {
        name: "Морковь",
        quantity: 80,
        unit: "кг",
        productionDate: "2026-10-01",
        expirationDate: "2026-12-01",
        price: 65,
      },
    ],
  },
  {
    id: 4,
    number: "П-1039",
    date: "2026-10-03",
    supplier: "ООО «ФудПоставка»",
    totalWeight: 95,
    cost: 21900,
    products: [
      {
        name: "Базилик",
        quantity: 5,
        unit: "кг",
        productionDate: "2026-10-02",
        expirationDate: "2026-10-08",
        price: 900,
      },
      {
        name: "Зелёный лук",
        quantity: 10,
        unit: "кг",
        productionDate: "2026-10-02",
        expirationDate: "2026-10-08",
        price: 420,
      },
    ],
  },
  {
    id: 5,
    number: "П-1038",
    date: "2026-09-27",
    supplier: "ООО «Свежий продукт»",
    totalWeight: 210,
    cost: 55800,
    products: [
      {
        name: "Пшеничная мука",
        quantity: 100,
        unit: "кг",
        productionDate: "2026-09-20",
        expirationDate: "2027-02-20",
        price: 95,
      },
      {
        name: "Оливковое масло",
        quantity: 30,
        unit: "л",
        productionDate: "2026-09-01",
        expirationDate: "2027-01-12",
        price: 780,
      },
    ],
  },
];

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("ru-RU");
}

function formatMoney(value) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function isDateInPeriod(date, period) {
  if (period === "all") {
    return true;
  }

  const deliveryDate = new Date(`${date}T00:00:00`);
  const today = new Date("2026-10-13T00:00:00");

  if (period === "today") {
    return date === "2026-10-13";
  }

  if (period === "week") {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    return deliveryDate >= weekStart && deliveryDate <= today;
  }

  if (period === "month") {
    return (
      deliveryDate.getFullYear() === today.getFullYear() &&
      deliveryDate.getMonth() === today.getMonth()
    );
  }

  return true;
}

function DeliveriesHistory() {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [expandedDelivery, setExpandedDelivery] = useState(null);

  const filteredDeliveries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return deliveries.filter((delivery) => {
      const matchesSearch =
        !normalizedSearch ||
        delivery.number.toLowerCase().includes(normalizedSearch) ||
        delivery.supplier.toLowerCase().includes(normalizedSearch) ||
        delivery.products.some((product) =>
          product.name.toLowerCase().includes(normalizedSearch),
        );

      const matchesPeriod = isDateInPeriod(delivery.date, period);

      return matchesSearch && matchesPeriod;
    });
  }, [search, period]);

  function resetFilters() {
    setSearch("");
    setPeriod("all");
  }

  function toggleDelivery(deliveryId) {
    setExpandedDelivery((currentId) =>
      currentId === deliveryId ? null : deliveryId,
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8f1] px-8 py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8">
          <h2 className="text-[38px] font-extrabold tracking-[-0.06em] text-[#302a27]">
            История поставок
          </h2>
        </header>

        <section className="mb-8 grid grid-cols-3 gap-4">
          <StatCard
            title="Всего поставок"
            value="48"
            description="за всё время"
            icon="▣"
            color="bg-[#fff0df] text-[#d9671b]"
          />

          <StatCard
            title="Поставок за месяц"
            value="12"
            description="за октябрь"
            icon="↗"
            color="bg-[#fff4d8] text-[#c8881b]"
          />

          <StatCard
            title="Общий расход поставок"
            value="84 500 ₽"
            description="за текущий месяц"
            icon="₽"
            color="bg-[#ffe5c9] text-[#d9671b]"
          />
        </section>

        <section className="mb-5 rounded-[20px] border border-[#f0e2d8] bg-white p-5">
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по номеру, продукту или поставщику..."
              className="h-11 min-w-0 flex-1 rounded-xl border border-[#eaded5] bg-[#fffdfb] px-4 text-[13px] placeholder:text-[#aa9d94] focus:border-[#eb701c] focus:outline-none"
            />

            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="h-11 rounded-xl border border-[#eaded5] bg-white px-4 text-[13px] text-[#665950] focus:border-[#eb701c] focus:outline-none"
            >
              <option value="all">Весь период</option>
              <option value="today">Сегодня</option>
              <option value="week">Последние 7 дней</option>
              <option value="month">Этот месяц</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="h-11 rounded-xl border border-[#eaded5] px-4 text-[13px] font-bold text-[#8b796e] transition hover:bg-[#fff5ed]"
            >
              Сбросить
            </button>
          </div>

          <div className="mt-3 text-[12px] text-[#a09187]">
            Найдено поставок: {filteredDeliveries.length}
          </div>
        </section>

        <section className="overflow-hidden rounded-[20px] border border-[#f0e2d8] bg-white shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
          <div className="grid grid-cols-[1fr_1fr_1.5fr_0.7fr_0.9fr_1fr_60px] gap-3 bg-[#fffaf7] px-6 py-4 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#aa9b91]">
            <div>Поставка</div>
            <div>Дата</div>
            <div>Поставщик</div>
            <div>Позиций</div>
            <div>Вес</div>
            <div>Стоимость</div>
            <div />
          </div>

          {filteredDeliveries.length === 0 ? (
            <div className="p-10 text-center text-[14px] text-[#958278]">
              По выбранным параметрам поставки не найдены.
            </div>
          ) : (
            filteredDeliveries.map((delivery) => {
              const isExpanded = expandedDelivery === delivery.id;

              return (
                <div key={delivery.id}>
                  <div className="grid grid-cols-[1fr_1fr_1.5fr_0.7fr_0.9fr_1fr_60px] items-center gap-3 border-t border-[#f3e9e2] px-6 py-4 text-[12px]">
                    <div className="font-extrabold text-[#493e38]">
                      {delivery.number}
                    </div>

                    <div className="text-[#85766d]">
                      {formatDate(delivery.date)}
                    </div>

                    <div className="text-[#665850]">
                      {delivery.supplier}
                    </div>

                    <div className="text-[#85766d]">
                      {delivery.products.length}
                    </div>

                    <div className="text-[#85766d]">
                      {delivery.totalWeight} кг
                    </div>

                    <div className="font-bold text-[#665850]">
                      {formatMoney(delivery.cost)}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleDelivery(delivery.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff0df] text-[#dc681c] transition hover:bg-[#ffe0c2]"
                      title="Показать продукты"
                    >
                      <span
                        className={`transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      >
                        ↓
                      </span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[#f3e9e2] bg-[#fffaf6] px-6 py-4">
                      <div className="mb-3 text-[12px] font-extrabold text-[#594a42]">
                        Состав поставки {delivery.number}
                      </div>

                      <div className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_0.8fr] gap-3 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#aa9b91]">
                        <div>Продукт</div>
                        <div>Количество</div>
                        <div>Произведён</div>
                        <div>Годен до</div>
                        <div>Цена</div>
                      </div>

                      {delivery.products.map((product) => (
                        <div
                          key={`${delivery.id}-${product.name}`}
                          className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_0.8fr] gap-3 border-t border-[#f1e5dd] py-3 text-[12px] text-[#766960]"
                        >
                          <div className="font-bold text-[#493e38]">
                            {product.name}
                          </div>

                          <div>
                            {product.quantity} {product.unit}
                          </div>

                          <div>{formatDate(product.productionDate)}</div>

                          <div>{formatDate(product.expirationDate)}</div>

                          <div>{formatMoney(product.price)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value, description, icon, color }) {
  return (
    <article className="rounded-[20px] border border-[#f0e2d8] bg-white p-5 shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
      <div className="mb-5 flex items-start justify-between">
        <div className="text-[13px] font-bold text-[#776961]">
          {title}
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-[13px] text-[19px] font-extrabold ${color}`}
        >
          {icon}
        </div>
      </div>

      <div className="text-[27px] font-extrabold tracking-[-0.05em] text-[#3a322d]">
        {value}
      </div>

      <div className="mt-1 text-[12px] text-[#a39389]">
        {description}
      </div>
    </article>
  );
}

export default DeliveriesHistory;