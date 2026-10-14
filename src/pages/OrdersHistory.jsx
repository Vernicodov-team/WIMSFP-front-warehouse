import { useMemo, useState } from "react";

const orders = [
  {
    id: 1042,
    date: "2026-10-14T12:40:00",
    status: "Completed",
    total: 1430,
    dishes: [
      {
        name: "Борщ с говядиной",
        quantity: 1,
        price: 490,
      },
      {
        name: "Паста с курицей",
        quantity: 1,
        price: 590,
      },
      {
        name: "Овощной салат",
        quantity: 1,
        price: 350,
      },
    ],
  },
  {
    id: 1041,
    date: "2026-10-14T11:25:00",
    status: "Completed",
    total: 980,
    dishes: [
      {
        name: "Пицца Маргарита",
        quantity: 1,
        price: 650,
      },
      {
        name: "Лимонад",
        quantity: 2,
        price: 165,
      },
    ],
  },
  {
    id: 1040,
    date: "2026-10-13T19:10:00",
    status: "Completed",
    total: 1890,
    dishes: [
      {
        name: "Стейк с картофелем",
        quantity: 1,
        price: 1290,
      },
      {
        name: "Овощи гриль",
        quantity: 1,
        price: 600,
      },
    ],
  },
  {
    id: 1039,
    date: "2026-10-13T16:45:00",
    status: "Completed",
    total: 1250,
    dishes: [
      {
        name: "Крем-суп с шампиньонами",
        quantity: 1,
        price: 420,
      },
      {
        name: "Овощной салат",
        quantity: 1,
        price: 350,
      },
      {
        name: "Чизкейк",
        quantity: 1,
        price: 480,
      },
    ],
  },
  {
    id: 1038,
    date: "2026-10-12T14:20:00",
    status: "Completed",
    total: 870,
    dishes: [
      {
        name: "Борщ с говядиной",
        quantity: 1,
        price: 490,
      },
      {
        name: "Морс",
        quantity: 2,
        price: 190,
      },
    ],
  },
];

const orderStatusConfig = {
  Completed: {
    label: "Выполнен",
    className: "bg-[#e8f3e1] text-[#59874c]",
  },
};

function formatDateTime(date) {
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value) {
  return `${value.toLocaleString("ru-RU")} ₽`;
}

function isDateInPeriod(date, period) {
  if (period === "all") {
    return true;
  }

  const orderDate = new Date(date);
  const today = new Date("2026-10-14T23:59:59");

  if (period === "today") {
    return orderDate.toDateString() === today.toDateString();
  }

  if (period === "week") {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    return orderDate >= weekStart && orderDate <= today;
  }

  if (period === "month") {
    return (
      orderDate.getFullYear() === today.getFullYear() &&
      orderDate.getMonth() === today.getMonth()
    );
  }

  return true;
}

function OrdersHistory() {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !normalizedSearch ||
        String(order.id).includes(normalizedSearch) ||
        order.dishes.some((dish) =>
          dish.name.toLowerCase().includes(normalizedSearch),
        );

      const matchesPeriod = isDateInPeriod(order.date, period);

      return matchesSearch && matchesPeriod;
    });
  }, [search, period]);

  function resetFilters() {
    setSearch("");
    setPeriod("all");
  }

  function toggleOrder(orderId) {
    setExpandedOrder((currentOrder) =>
      currentOrder === orderId ? null : orderId,
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8f1] px-8 py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8">
          <h2 className="text-[38px] font-extrabold tracking-[-0.06em] text-[#302a27]">
            История заказов
          </h2>

          <p className="mt-2 text-[14px] text-[#958278]">
            Все выполненные заказы ресторана
          </p>
        </header>

        <section className="mb-8 grid grid-cols-3 gap-4">
          <StatCard
            title="Заказов сегодня"
            value="2"
            description="выполненных заказа"
            icon="▣"
            color="bg-[#fff0df] text-[#d9671b]"
          />

          <StatCard
            title="Выполнено"
            value="2"
            description="за текущий день"
            icon="✓"
            color="bg-[#e8f3e1] text-[#659251]"
          />

          <StatCard
            title="Выручка"
            value="2 410 ₽"
            description="за текущий день"
            icon="₽"
            color="bg-[#fff4d8] text-[#c8881b]"
          />
        </section>

        <section className="mb-5 rounded-[20px] border border-[#f0e2d8] bg-white p-5">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по номеру заказа или блюду..."
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
            Найдено заказов: {filteredOrders.length}
          </div>
        </section>

        <section className="overflow-hidden rounded-[20px] border border-[#f0e2d8] bg-white shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
          <div className="grid grid-cols-[1fr_1.2fr_2fr_1fr_1fr_60px] gap-4 bg-[#fffaf7] px-6 py-4 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#aa9b91]">
            <div>Номер заказа</div>
            <div>Дата и время</div>
            <div>Состав заказа</div>
            <div>Количество</div>
            <div>Сумма</div>
            <div />
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-10 text-center text-[14px] text-[#958278]">
              Заказы не найдены.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isExpanded = expandedOrder === order.id;

              return (
                <div key={order.id}>
                  <button
                    type="button"
                    onClick={() => toggleOrder(order.id)}
                    className="grid w-full grid-cols-[1fr_1.2fr_2fr_1fr_1fr_60px] items-center gap-4 border-t border-[#f3e9e2] px-6 py-5 text-left text-[12px] transition hover:bg-[#fffaf7]"
                  >
                    <span className="font-extrabold text-[#493e38]">
                      Заказ #{order.id}
                    </span>

                    <span className="text-[#85766d]">
                      {formatDateTime(order.date)}
                    </span>

                    <span className="truncate text-[#665850]">
                      {order.dishes.map((dish) => dish.name).join(", ")}
                    </span>

                    <span className="text-[#85766d]">
                      {order.dishes.reduce(
                        (total, dish) => total + dish.quantity,
                        0,
                      )}
                    </span>

                    <span className="font-bold text-[#665850]">
                      {formatMoney(order.total)}
                    </span>

                    <span className="flex justify-end">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff0df] text-[#dc681c]">
                        <span
                          className={`transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          ↓
                        </span>
                      </span>
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[#f3e9e2] bg-[#fffaf6] px-6 py-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-[12px] font-extrabold text-[#594a42]">
                          Состав заказа #{order.id}
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold ${orderStatusConfig.Completed.className}`}
                        >
                          {orderStatusConfig.Completed.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#aa9b91]">
                        <div>Блюдо</div>
                        <div>Количество</div>
                        <div>Цена</div>
                        <div>Сумма</div>
                      </div>

                      {order.dishes.map((dish) => (
                        <div
                          key={dish.name}
                          className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-t border-[#f1e5dd] py-3 text-[12px] text-[#766960]"
                        >
                          <div className="font-bold text-[#493e38]">
                            {dish.name}
                          </div>

                          <div>{dish.quantity}</div>

                          <div>{formatMoney(dish.price)}</div>

                          <div>
                            {formatMoney(dish.price * dish.quantity)}
                          </div>
                        </div>
                      ))}

                      <div className="mt-3 flex justify-end border-t border-[#eaded5] pt-3 text-[14px] font-extrabold text-[#493e38]">
                        Итого: {formatMoney(order.total)}
                      </div>
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

export default OrdersHistory;