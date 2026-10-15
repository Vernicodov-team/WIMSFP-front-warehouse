import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5094/api/v1";

const orderStatusConfig = {
  Completed: {
    label: "Выполнен",
    className: "bg-[#e8f3e1] text-[#59874c]",
  },
  Active: {
    label: "Активен",
    className: "bg-[#fff0c9] text-[#b8791b]",
  },
  Cancelled: {
    label: "Отменён",
    className: "bg-[#ffe1dd] text-[#c84d45]",
  },
};

const orderFormatConfig = {
  0: "В ресторане",
  1: "Самовывоз",
};

function formatDateTime(date) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(date) {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toISOString().slice(0, 10);
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("ru-RU")} ₽`;
}

function getOrderFormat(format) {
  return (
    orderFormatConfig[format] ||
    orderFormatConfig[String(format)] ||
    "Неизвестный формат"
  );
}

function getStatusConfig(status) {
  return orderStatusConfig[status] || null;
}

function isDateInPeriod(date, period) {
  if (period === "all") {
    return true;
  }

  if (!date) {
    return false;
  }

  const orderDate = new Date(date);
  const today = new Date();

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

function normalizeOrder(order, index) {
  const dishes = Array.isArray(order.dishes)
    ? order.dishes.map((dish, dishIndex) => {
        const price = Number(dish.dishPrice || 0);
        const quantity = Number(dish.count || 0);

        return {
          id: `${index}-${dishIndex}`,
          name: dish.dishName || "Без названия",
          price,
          quantity,
          total: price * quantity,
        };
      })
    : [];

  const calculatedTotal = dishes.reduce(
    (total, dish) => total + dish.total,
    0,
  );

  return {
    id: order.id || `${order.created}-${index}`,
    number: formatDateOnly(order.created),
    created: order.created,
    payment: Number(order.payment ?? calculatedTotal),
    status: order.status,
    customerName: order.customerName || "—",
    contactPhone: order.contactPhone || "—",
    format: getOrderFormat(order.format),
    comment: order.comment || "",
    dishes,
  };
}

function OrdersHistory({ refreshKey }) {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [financeData, setFinanceData] = useState([]);
  const [financeLoading, setFinanceLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/order/getOrderList`,
        );

        if (!response.ok) {
          throw new Error(
            `Ошибка загрузки заказов: ${response.status}`,
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "Бэкенд вернул некорректный список заказов.",
          );
        }

        const normalizedOrders = data
          .map(normalizeOrder)
          .sort(
            (firstOrder, secondOrder) =>
              new Date(secondOrder.created).getTime() -
              new Date(firstOrder.created).getTime(),
          );

        if (isMounted) {
          setOrders(normalizedOrders);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError.message ||
              "Не удалось загрузить историю заказов.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    const intervalId = setInterval(loadOrders, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [refreshKey]);

  useEffect(() => {
    let isMounted = true;

    async function loadFinance() {
      try {
        const response = await fetch(
          `${API_URL}/dashboard/FinanceAnalitics`,
        );

        if (!response.ok) {
          throw new Error(`Ошибка загрузки финансов: ${response.status}`);
        }

        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.items)
              ? data.items
              : [];

        if (isMounted) {
          setFinanceData(list);
        }
      } catch {
        if (isMounted) {
          setFinanceData([]);
        }
      } finally {
        if (isMounted) {
          setFinanceLoading(false);
        }
      }
    }

    loadFinance();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !normalizedSearch ||
        order.number.toLowerCase().includes(normalizedSearch) ||
        order.customerName.toLowerCase().includes(normalizedSearch) ||
        order.contactPhone.toLowerCase().includes(normalizedSearch) ||
        order.dishes.some((dish) =>
          dish.name.toLowerCase().includes(normalizedSearch),
        );

      const matchesPeriod = isDateInPeriod(order.created, period);

      return matchesSearch && matchesPeriod;
    });
  }, [orders, search, period]);

  function resetFilters() {
    setSearch("");
    setPeriod("all");
  }

  function toggleOrder(orderId) {
    setExpandedOrder((currentId) =>
      currentId === orderId ? null : orderId,
    );
  }

  const latestFinance = financeData.reduce((latest, item) => {
    if (!latest) {
      return item;
    }

    const itemOrder = (Number(item.year) || 0) * 12 + (Number(item.month) || 0);
    const latestOrder =
      (Number(latest.year) || 0) * 12 + (Number(latest.month) || 0);

    return itemOrder > latestOrder ? item : latest;
  }, null);

  const monthlyRevenue = financeLoading
    ? "…"
    : latestFinance
      ? formatMoney(latestFinance.income)
      : "—";

  const ordersThisMonth = orders.filter((order) =>
    isDateInPeriod(order.created, "month"),
  ).length;

  return (
    <main className="min-h-screen bg-[#fff8f1] px-8 py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8">
          <h2 className="text-[38px] font-extrabold tracking-[-0.06em] text-[#302a27]">
            История заказов
          </h2>

          <p className="mt-2 text-[14px] text-[#958278]">
            Все заказы ресторана и их состав
          </p>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-[#f2b8b2] bg-[#ffe1dd] px-4 py-3 text-[13px] font-bold text-[#c84d45]">
            {error}
          </div>
        )}

        <section className="mb-8 grid grid-cols-3 gap-4">
          <StatCard
            title="Всего заказов"
            value={orders.length}
            description="по данным сервера"
            icon="▣"
            color="bg-[#fff0df] text-[#d9671b]"
          />

          <StatCard
            title="Заказов за месяц"
            value={ordersThisMonth}
            description="за текущий месяц"
            icon="↗"
            color="bg-[#fff4d8] text-[#c8881b]"
          />

          <StatCard
            title="Общая выручка"
            value={monthlyRevenue}
            description="за последний месяц"
            icon="₽"
            color="bg-[#e8f3e1] text-[#659251]"
          />
        </section>

        <section className="mb-5 rounded-[20px] border border-[#f0e2d8] bg-white p-5">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по номеру, клиенту, телефону или блюду..."
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
            {isLoading
              ? "Загрузка заказов..."
              : `Найдено заказов: ${filteredOrders.length}`}
          </div>
        </section>

        <section className="overflow-hidden rounded-[20px] border border-[#f0e2d8] bg-white shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
          <div className="grid grid-cols-[1fr_1.3fr_1.4fr_1.3fr_1fr_60px] gap-4 bg-[#fffaf7] px-6 py-4 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#aa9b91]">
            <div>Заказ</div>
            <div>Дата и время</div>
            <div>Клиент</div>
            <div>Телефон</div>
            <div>Сумма</div>
            <div />
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-10 text-center text-[14px] text-[#958278]">
              {isLoading
                ? "Загрузка заказов..."
                : "Заказы не найдены."}
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const status = getStatusConfig(order.status);

              return (
                <div key={order.id}>
                  <div className="grid grid-cols-[1fr_1.3fr_1.4fr_1.3fr_1fr_60px] items-center gap-4 border-t border-[#f3e9e2] px-6 py-4 text-[12px]">
                    <div className="font-extrabold text-[#493e38]">
                      {order.number}
                    </div>

                    <div className="text-[#85766d]">
                      {formatDateTime(order.created)}
                    </div>

                    <div className="text-[#665850]">
                      {order.customerName}
                    </div>

                    <div className="text-[#85766d]">
                      {order.contactPhone}
                    </div>

                    <div className="font-bold text-[#665850]">
                      {formatMoney(order.payment)}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleOrder(order.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff0df] text-[#dc681c] transition hover:bg-[#ffe0c2]"
                      title="Показать состав заказа"
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
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <div className="text-[12px] font-extrabold text-[#594a42]">
                            Состав заказа {order.number}
                          </div>

                          <div className="mt-1 text-[11px] text-[#958278]">
                            Формат: {order.format}
                          </div>
                        </div>

                    {status && (
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold ${status.className}`}
                    >
                      {status.label}
                    </span>
                      )}
                      </div>

                      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#aa9b91]">
                        <div>Блюдо</div>
                        <div>Количество</div>
                        <div>Цена</div>
                        <div>Стоимость (С учетом акций)</div>
                      </div>

                      {order.dishes.map((dish) => (
                        <div
                          key={dish.id}
                          className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-t border-[#f1e5dd] py-3 text-[12px] text-[#766960]"
                        >
                          <div className="font-bold text-[#493e38]">
                            {dish.name}
                          </div>

                          <div>{dish.quantity}</div>
                          <div>{formatMoney(dish.price)}</div>
                          <div>{formatMoney(dish.total)}</div>
                        </div>
                      ))}

                      {order.comment && (
                        <div className="mt-3 border-t border-[#eaded5] pt-3 text-[12px] text-[#766960]">
                          Комментарий: {order.comment}
                        </div>
                      )}

                      <div className="mt-3 flex justify-end border-t border-[#eaded5] pt-3 text-[14px] font-extrabold text-[#493e38]">
                        Итого: {formatMoney(order.payment)}
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