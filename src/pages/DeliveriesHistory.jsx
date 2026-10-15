import { useMemo, useState } from "react";

function formatDate(date) {
  if (!date) {
    return "—";
  }

  const normalizedDate =
    date.length === 10 ? `${date}T00:00:00` : date;

  return new Date(normalizedDate).toLocaleDateString("ru-RU");
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("ru-RU")} ₽`;
}

function isDateInPeriod(date, period) {
  if (period === "all") {
    return true;
  }

  if (!date) {
    return false;
  }

  const deliveryDate = new Date(`${date}T00:00:00`);
  const today = new Date("2026-10-14T00:00:00");

  if (period === "today") {
    return date === "2026-10-14";
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

function DeliveriesHistory({ deliveries = [] }) {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [expandedDelivery, setExpandedDelivery] = useState(null);

  const filteredDeliveries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return deliveries.filter((delivery) => {
      const products = Array.isArray(delivery.products)
        ? delivery.products
        : [];

      const matchesSearch =
        !normalizedSearch ||
        String(delivery.number || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(delivery.supplier || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        products.some((product) =>
          String(product.name || "")
            .toLowerCase()
            .includes(normalizedSearch),
        );

      const matchesPeriod = isDateInPeriod(delivery.date, period);

      return matchesSearch && matchesPeriod;
    });
  }, [deliveries, search, period]);

  function resetFilters() {
    setSearch("");
    setPeriod("all");
  }

  function toggleDelivery(deliveryId) {
    setExpandedDelivery((currentId) =>
      currentId === deliveryId ? null : deliveryId,
    );
  }

  const totalCost = deliveries.reduce(
    (total, delivery) => total + Number(delivery.cost || 0),
    0,
  );

  const deliveriesThisMonth = deliveries.filter((delivery) =>
    isDateInPeriod(delivery.date, "month"),
  ).length;

  return (
    <main className="min-h-screen bg-[#fff8f1] px-8 py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8">
          <h2 className="text-[38px] font-extrabold tracking-[-0.06em] text-[#302a27]">
            История поставок
          </h2>

          <p className="mt-2 text-[14px] text-[#958278]">
            Все поступления продуктов на склад
          </p>
        </header>

        <section className="mb-8 grid grid-cols-3 gap-4">
          <StatCard
            title="Всего поставок"
            value={deliveries.length}
            description="за всё время"
            icon="▣"
            color="bg-[#fff0df] text-[#d9671b]"
          />

          <StatCard
            title="Поставок за месяц"
            value={deliveriesThisMonth}
            description="за текущий месяц"
            icon="↗"
            color="bg-[#fff4d8] text-[#c8881b]"
          />

          <StatCard
            title="Общая стоимость"
            value={formatMoney(totalCost)}
            description="по всем поставкам"
            icon="₽"
            color="bg-[#ffe5c9] text-[#d9671b]"
          />
        </section>

        <section className="mb-5 rounded-[20px] border border-[#f0e2d8] bg-white p-5">
          <div className="flex items-center gap-3">
            <input
              type="text"
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
            <div>Количество</div>
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
              const products = Array.isArray(delivery.products)
                ? delivery.products
                : [];

              return (
                <div key={delivery.id}>
                  <div className="grid grid-cols-[1fr_1fr_1.5fr_0.7fr_0.9fr_1fr_60px] items-center gap-3 border-t border-[#f3e9e2] px-6 py-4 text-[12px]">
                    <div className="font-extrabold text-[#493e38]">
                      {delivery.number || "Без номера"}
                    </div>

                    <div className="text-[#85766d]">
                      {formatDate(delivery.date)}
                    </div>

                    <div className="text-[#665850]">
                      {delivery.supplier || "—"}
                    </div>

                    <div className="text-[#85766d]">
                      {products.length}
                    </div>

                    <div className="text-[#85766d]">
                      {delivery.totalWeight || 0}
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
                        Состав поставки {delivery.number || ""}
                      </div>

                      <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_1fr_1fr_1fr_1fr] gap-3 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#aa9b91]">
                        <div>Продукт</div>
                        <div>Количество</div>
                        <div>Единица</div>
                        <div>Получен</div>
                        <div>Годен до</div>
                        <div>Цена</div>
                        <div>Стоимость</div>
                      </div>

                      {products.map((product, index) => (
                        <div
                          key={`${product.name}-${index}`}
                          className="grid grid-cols-[1.4fr_0.8fr_0.8fr_1fr_1fr_1fr_1fr] gap-3 border-t border-[#f1e5dd] py-3 text-[12px] text-[#766960]"
                        >
                          <div className="font-bold text-[#493e38]">
                            {product.name}
                          </div>

                          <div>{product.quantity || 0}</div>
                          <div>{product.unit || "—"}</div>
                          <div>
                            {formatDate(product.productionDate)}
                          </div>
                          <div>
                            {formatDate(product.expirationDate)}
                          </div>
                          <div>{formatMoney(product.price)}</div>
                          <div>{formatMoney(product.cost)}</div>
                        </div>
                      ))}

                      <div className="mt-3 flex justify-end border-t border-[#eaded5] pt-3 text-[14px] font-extrabold text-[#493e38]">
                        Итого: {formatMoney(delivery.cost)}
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

export default DeliveriesHistory;