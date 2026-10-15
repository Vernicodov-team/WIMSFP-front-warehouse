import { useEffect, useState } from "react";

const API_URL = "http://localhost:5094/api/v1";

const MONTHS_SHORT = [
  "янв.",
  "фев.",
  "мар.",
  "апр.",
  "май",
  "июн.",
  "июл.",
  "авг.",
  "сент.",
  "окт.",
  "нояб.",
  "дек.",
];

const UNIT_LABELS = {
  Item: "шт.",
  item: "шт.",
  Kilogram: "кг",
  kilogram: "кг",
  Liter: "л",
  liter: "л",
};

const statusConfig = {
  Active: {
    label: "Активно",
    className: "bg-[#e6f1e1] text-[#5b8747]",
  },
  Expiring: {
    label: "Скоро истекает",
    className: "bg-[#fff0c9] text-[#b8791b]",
  },
  Expired: {
    label: "Просрочено",
    className: "bg-[#ffe1dd] text-[#c84d45]",
  },
};

const statistics = [
  {
    title: "Списано за месяц",
    decommis: true,
    icon: "↘",
    iconClass: "bg-[#ffe1dd] text-[#c84d45]",
  },
  {
    title: "Популярные блюда",
    topDishes: true,
    icon: "★",
    iconClass: "bg-[#fff4d8] text-[#c8881b]",
  },
  {
    title: "Финансы за месяц",
    finance: true,
    icon: "₽",
    iconClass: "bg-[#fff0df] text-[#d9671b]",
  },
];

const attentionItems = [
  {
    title: "Просроченные продукты",
    countKey: "expired",
    description: "требуют списания",
    icon: "!",
    iconClass: "bg-[#ffe1dd] text-[#c84d45]",
  },
  {
    title: "Заканчиваются скоро",
    countKey: "expiring",
    description: "срок истекает через 1–3 дня",
    icon: "◷",
    iconClass: "bg-[#fff0c9] text-[#b8791b]",
  },
];

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("ru-RU")} ₽`;
}

function formatAmount(value, unit) {
  const amount = Number(value) || 0;
  const unitLabel = UNIT_LABELS[unit] || unit || "";

  return unitLabel ? `${amount} ${unitLabel}` : `${amount}`;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("ru-RU");
}

function formatToday() {
  const today = new Date();

  const weekday = today.toLocaleDateString("ru-RU", {
    weekday: "long",
  });

  const dayMonth = today.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });

  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(
    1,
  )}, ${dayMonth} ${today.getFullYear()}`;
}

function formatDaysUntil(days) {
  const value = Number(days);

  if (!Number.isFinite(value)) {
    return "—";
  }

  if (value < 0) {
    return "Просрочено";
  }

  if (value === 0) {
    return "Сегодня";
  }

  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${value} день`;
  }

  if (
    mod10 >= 2 &&
    mod10 <= 4 &&
    (mod100 < 12 || mod100 > 14)
  ) {
    return `${value} дня`;
  }

  return `${value} дней`;
}

function pluralizePosition(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "позиция";
  }

  if (
    mod10 >= 2 &&
    mod10 <= 4 &&
    (mod100 < 12 || mod100 > 14)
  ) {
    return "позиции";
  }

  return "позиций";
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Ошибка API: ${response.status}`);
  }

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

function Dashboard({ refreshKey }) {
  const [financeData, setFinanceData] = useState([]);
  const [financesLoading, setFinancesLoading] = useState(true);
  const [financesError, setFinancesError] = useState("");

  const [decommisTotal, setDecommisTotal] = useState(null);
  const [decommisLoading, setDecommisLoading] = useState(true);

  const [topDishes, setTopDishes] = useState([]);
  const [topDishesLoading, setTopDishesLoading] = useState(true);

  const [expiredCount, setExpiredCount] = useState(null);
  const [expiringCount, setExpiringCount] = useState(null);
  const [countsLoading, setCountsLoading] = useState(true);

  const [recoItems, setRecoItems] = useState([]);
  const [recoLoading, setRecoLoading] = useState(true);
  const [recoError, setRecoError] = useState("");

  const [stoplistItems, setStoplistItems] = useState([]);
  const [stoplistLoading, setStoplistLoading] = useState(true);
  const [stoplistError, setStoplistError] = useState("");

  const [expiredSoon, setExpiredSoon] = useState([]);
  const [expiredSoonLoading, setExpiredSoonLoading] = useState(true);
  const [expiredSoonError, setExpiredSoonError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadFinances() {
      try {
        setFinancesLoading(true);

        const data = await apiRequest(
          "/dashboard/FinanceAnalitics",
        );

        if (isActive) {
          setFinanceData(getList(data));
          setFinancesError("");
        }
      } catch {
        if (isActive) {
          setFinanceData([]);
          setFinancesError(
            "Не удалось загрузить данные по финансам.",
          );
        }
      } finally {
        if (isActive) {
          setFinancesLoading(false);
        }
      }
    }

    loadFinances();

    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let isActive = true;

    async function loadDecommis() {
      try {
        setDecommisLoading(true);

        const data = await apiRequest(
          "/dashboard/DecommisStock",
        );

        if (isActive) {
          setDecommisTotal(Number(data?.totalAmount) || 0);
        }
      } catch {
        if (isActive) {
          setDecommisTotal(null);
        }
      } finally {
        if (isActive) {
          setDecommisLoading(false);
        }
      }
    }

    loadDecommis();

    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let isActive = true;

    async function loadTopDishes() {
      try {
        setTopDishesLoading(true);

        const data = await apiRequest(
          "/dashboard/TopDishes",
        );

        if (isActive) {
          setTopDishes(getList(data).slice(0, 3));
        }
      } catch {
        if (isActive) {
          setTopDishes([]);
        }
      } finally {
        if (isActive) {
          setTopDishesLoading(false);
        }
      }
    }

    loadTopDishes();

    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let isActive = true;

    async function loadAttentionCounts() {
      try {
        setCountsLoading(true);

        const [expired, expiring] = await Promise.all([
          apiRequest("/dashboard/GetExpiredCount"),
          apiRequest("/dashboard/GetExpiredSoonCount"),
        ]);

        if (isActive) {
          setExpiredCount(Number(expired) || 0);
          setExpiringCount(Number(expiring) || 0);
        }
      } catch {
        if (isActive) {
          setExpiredCount(null);
          setExpiringCount(null);
        }
      } finally {
        if (isActive) {
          setCountsLoading(false);
        }
      }
    }

    loadAttentionCounts();

    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let isActive = true;

    async function loadDeliveryRecommendations() {
      try {
        setRecoLoading(true);

        const data = await apiRequest(
          "/dashboard/forecast/deliveryRecomend",
        );

        if (isActive) {
          setRecoItems(getList(data));
          setRecoError("");
        }
      } catch {
        if (isActive) {
          setRecoItems([]);
          setRecoError(
            "Не удалось загрузить рекомендации по поставкам.",
          );
        }
      } finally {
        if (isActive) {
          setRecoLoading(false);
        }
      }
    }

    loadDeliveryRecommendations();

    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let isActive = true;

    async function loadStoplist() {
      try {
        setStoplistLoading(true);

        const data = await apiRequest(
          "/dashboard/forecast/stoplist",
        );

        if (isActive) {
          setStoplistItems(getList(data));
          setStoplistError("");
        }
      } catch {
        if (isActive) {
          setStoplistItems([]);
          setStoplistError(
            "Не удалось загрузить данные по стоп-листу.",
          );
        }
      } finally {
        if (isActive) {
          setStoplistLoading(false);
        }
      }
    }

    loadStoplist();

    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let isActive = true;

    async function loadExpiredSoon() {
      try {
        setExpiredSoonLoading(true);

        const data = await apiRequest(
          "/Stock/getExpiredSoon",
        );

        if (isActive) {
          setExpiredSoon(getList(data));
          setExpiredSoonError("");
        }
      } catch {
        if (isActive) {
          setExpiredSoon([]);
          setExpiredSoonError(
            "Не удалось загрузить данные по срокам годности.",
          );
        }
      } finally {
        if (isActive) {
          setExpiredSoonLoading(false);
        }
      }
    }

    loadExpiredSoon();

    return () => {
      isActive = false;
    };
  }, [refreshKey]);

  const financePoints = financeData.map((item) => ({
    key: `${item.year}-${item.month}`,
    label: `${MONTHS_SHORT[item.month - 1] ?? item.month} ${String(
      item.year ?? "",
    ).slice(-2)}`,
    revenue: Number(item.income) || 0,
    expenses: Number(item.expense) || 0,
  }));

  const financeMax = financePoints.reduce(
    (max, item) =>
      Math.max(max, item.revenue, item.expenses),
    0,
  );

  const latestFinance = financeData.reduce(
    (latest, item) => {
      if (!latest) {
        return item;
      }

      const currentOrder =
        (Number(item.year) || 0) * 12 +
        (Number(item.month) || 0);

      const latestOrder =
        (Number(latest.year) || 0) * 12 +
        (Number(latest.month) || 0);

      return currentOrder > latestOrder ? item : latest;
    },
    null,
  );

  const displayedStatistics = statistics.map((statistic) => {
    if (statistic.finance) {
      return {
        ...statistic,
        finance: [
          {
            title: "Общая выручка",
            value: latestFinance
              ? formatMoney(latestFinance.income)
              : "—",
            valueClass: "text-[#659251]",
          },
          {
            title: "Общие затраты",
            value: latestFinance
              ? formatMoney(latestFinance.expense)
              : "—",
            valueClass: "text-[#c84d45]",
          },
        ],
      };
    }

    if (statistic.decommis) {
      return {
        ...statistic,
        value: decommisLoading
          ? "…"
          : decommisTotal === null
            ? "—"
            : formatMoney(decommisTotal),
        description: "списано за месяц",
      };
    }

    if (statistic.topDishes) {
      return {
        ...statistic,
        values: topDishes.map((dish) => ({
          value: dish?.soldCount ?? 0,
          label: dish?.dishName ?? "—",
        })),
        emptyText: topDishesLoading
          ? "Загрузка..."
          : "Нет данных",
      };
    }

    return statistic;
  });

  const displayedAttentionItems = attentionItems.map((item) => {
    const count =
      item.countKey === "expired"
        ? expiredCount
        : expiringCount;

    return {
      ...item,
      value: countsLoading
        ? "…"
        : count === null
          ? "—"
          : `${count} ${pluralizePosition(count)}`,
    };
  });

  function getBarHeight(value) {
    if (!financeMax || value <= 0) {
      return 0;
    }

    return Math.max(4, Math.round((value / financeMax) * 100));
  }

  return (
    <main className="min-h-screen bg-[#fff8f1] px-8 py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-[38px] font-extrabold tracking-[-0.06em] text-[#302a27]">
              Ключевые показатели
            </h2>

            <p className="mt-2 text-[14px] text-[#958278]">
              Краткая сводка по остаткам, партиям и срокам годности
            </p>
          </div>

          <div className="pb-1 text-[13px] text-[#ad9b90]">
            {formatToday()}
          </div>
        </header>

        <section className="mb-8">
          <h3 className="mb-4 text-[23px] font-extrabold tracking-[-0.04em] text-[#332d29]">
            Общая статистика
          </h3>

          <div className="grid grid-cols-3 gap-4">
            {displayedStatistics.map((statistic) => (
              <article
                key={statistic.title}
                className="rounded-[20px] border border-[#f0e2d8] bg-white p-5 shadow-[0_5px_18px_rgba(120,75,40,0.04)]"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div className="max-w-[190px] text-[13px] font-bold leading-5 text-[#776961]">
                    {statistic.title}
                  </div>

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-[13px] text-[20px] font-extrabold ${statistic.iconClass}`}
                  >
                    {statistic.icon}
                  </div>
                </div>

                {statistic.finance ? (
                  <div className="divide-y divide-[#f1e8e1]">
                    {statistic.finance.map((item) => (
                      <div
                        key={item.title}
                        className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                      >
                        <div className="text-[11px] text-[#958278]">
                          {item.title}
                        </div>

                        <div
                          className={`text-[18px] font-extrabold tracking-[-0.04em] ${item.valueClass}`}
                        >
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : statistic.values ? (
                  <div className="divide-y divide-[#f1e8e1]">
                    {statistic.values.length === 0 ? (
                      <div className="py-2 text-[12px] text-[#a39389]">
                        {statistic.emptyText ?? "Нет данных"}
                      </div>
                    ) : (
                      statistic.values.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between gap-3 py-1 first:pt-0 last:pb-0"
                        >
                          <span className="truncate text-[11px] font-bold text-[#5d5049]">
                            {item.label}
                          </span>

                          <span className="shrink-0 whitespace-nowrap text-[13px] font-extrabold text-[#3a322d]">
                            {item.value}{" "}
                            <span className="font-bold text-[#a39389]">
                              продано ед.
                            </span>
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <>
                    <div className="text-[30px] font-extrabold tracking-[-0.06em] text-[#3a322d]">
                      {statistic.value}
                    </div>

                    <div className="mt-1 text-[12px] text-[#a39389]">
                      {statistic.description}
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-[20px] border border-[#f0e2d8] bg-white p-6 shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h3 className="text-[22px] font-extrabold tracking-[-0.04em] text-[#332d29]">
                Выручка и затраты
              </h3>

              <p className="mt-1 text-[13px] text-[#a09187]">
                Сравнение показателей по месяцам
              </p>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-[#81736a]">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#82b274]" />
                Общая выручка
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#e96d1b]" />
                Общие затраты
              </div>
            </div>
          </div>

          <div className="pt-5">
            <div className="flex h-[240px] items-end gap-5 border-b border-l border-[#eaded5] px-5">
              {financesLoading ? (
                <div className="w-full self-center pb-24 text-center text-[13px] text-[#a09187]">
                  Загрузка данных...
                </div>
              ) : financesError ? (
                <div className="w-full self-center pb-24 text-center text-[13px] text-[#c84d45]">
                  {financesError}
                </div>
              ) : financePoints.length === 0 ? (
                <div className="w-full self-center pb-24 text-center text-[13px] text-[#a09187]">
                  Нет данных за выбранный период.
                </div>
              ) : (
                financePoints.map((item) => (
                  <div
                    key={item.key}
                    className="flex h-full flex-1 items-end justify-center gap-2"
                  >
                    <div
                      className="w-6 rounded-t-md bg-[#82b274] transition hover:bg-[#6d9f60]"
                      style={{
                        height: `${getBarHeight(item.revenue)}%`,
                      }}
                      title={`Выручка: ${formatMoney(item.revenue)}`}
                    />

                    <div
                      className="w-6 rounded-t-md bg-[#e96d1b] transition hover:bg-[#d85e12]"
                      style={{
                        height: `${getBarHeight(item.expenses)}%`,
                      }}
                      title={`Затраты: ${formatMoney(item.expenses)}`}
                    />
                  </div>
                ))
              )}
            </div>

            {!financesLoading &&
              !financesError &&
              financePoints.length > 0 && (
                <div className="flex gap-5 px-5 pt-2">
                  {financePoints.map((item) => (
                    <span
                      key={item.key}
                      className="flex-1 text-center text-[10px] text-[#a09187]"
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              )}
          </div>
        </section>

        <section className="mb-8 overflow-hidden rounded-[20px] border border-[#f0e2d8] bg-white shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
          <div className="border-b border-[#f3e8e0] px-6 py-5">
            <h3 className="text-[22px] font-extrabold tracking-[-0.04em] text-[#332d29]">
              Рекомендации по поставкам
            </h3>

            <p className="mt-1 text-[13px] text-[#a09187]">
              Продукты, которые стоит закупить для пополнения запасов
            </p>
          </div>

          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] gap-3 bg-[#fffaf7] px-6 py-3 text-[10px] font-extrabold uppercase text-[#aa9b91]">
            <div>Продукт</div>
            <div>Требуется</div>
            <div>Доступно</div>
            <div>К закупке</div>
          </div>

          {recoLoading ? (
            <div className="px-6 py-6 text-center text-[13px] text-[#a09187]">
              Загрузка данных...
            </div>
          ) : recoError ? (
            <div className="px-6 py-6 text-center text-[13px] text-[#c84d45]">
              {recoError}
            </div>
          ) : recoItems.length === 0 ? (
            <div className="px-6 py-6 text-center text-[13px] text-[#a09187]">
              Нет данных по рекомендациям.
            </div>
          ) : (
            recoItems.map((item, index) => (
              <div
                key={`${item.productName}-${index}`}
                className="grid grid-cols-[1.6fr_1fr_1fr_1fr] items-center gap-3 border-t border-[#f4ebe5] px-6 py-4 text-[12px]"
              >
                <div className="font-bold text-[#493e38]">
                  {item.productName || "—"}
                </div>

                <div className="text-[#85766d]">
                  {formatAmount(item.requiredAmount, item.unit)}
                </div>

                <div className="text-[#85766d]">
                  {formatAmount(item.availableAmount, item.unit)}
                </div>

                <div className="font-extrabold text-[#d9671b]">
                  {formatAmount(item.toBuyAmount, item.unit)}
                </div>
              </div>
            ))
          )}
        </section>

        <section className="mb-8 overflow-hidden rounded-[20px] border border-[#f0e2d8] bg-white shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
          <div className="border-b border-[#f3e8e0] px-6 py-5">
            <h3 className="text-[22px] font-extrabold tracking-[-0.04em] text-[#332d29]">
              Блюда в стоп-листе
            </h3>

            <p className="mt-1 text-[13px] text-[#a09187]">
              Блюда, которые могут попасть в стоп-лист
            </p>
          </div>

          <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 bg-[#fffaf7] px-6 py-3 text-[10px] font-extrabold uppercase text-[#aa9b91]">
            <div>Блюдо</div>
            <div>Можно приготовить</div>
            <div>Статус</div>
          </div>

          {stoplistLoading ? (
            <div className="px-6 py-6 text-center text-[13px] text-[#a09187]">
              Загрузка данных...
            </div>
          ) : stoplistError ? (
            <div className="px-6 py-6 text-center text-[13px] text-[#c84d45]">
              {stoplistError}
            </div>
          ) : stoplistItems.length === 0 ? (
            <div className="px-6 py-6 text-center text-[13px] text-[#a09187]">
              Нет данных по стоп-листу.
            </div>
          ) : (
            stoplistItems.map((item, index) => {
              const canPrepare =
                Number(item.countCanPrepare) || 0;

              const inStoplist = canPrepare === 0;

              return (
                <div
                  key={`${item.dishName}-${index}`}
                  className="grid grid-cols-[2fr_1fr_1fr] items-center gap-3 border-t border-[#f4ebe5] px-6 py-4 text-[12px]"
                >
                  <div className="font-bold text-[#493e38]">
                    {item.dishName || "—"}
                  </div>

                  <div className="text-[#85766d]">
                    {canPrepare}
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        inStoplist
                          ? "bg-[#ffe1dd] text-[#c84d45]"
                          : "bg-[#fff0c9] text-[#b8791b]"
                      }`}
                    >
                      {inStoplist ? "В стоп-листе" : "Риск"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <section className="mb-8">
          <div className="mb-4">
            <h3 className="text-[23px] font-extrabold tracking-[-0.04em] text-[#332d29]">
              Требует внимания
            </h3>

            <p className="mt-1 text-[13px] text-[#988980]">
              Проверьте эти позиции, чтобы избежать потерь и остановки продаж
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {displayedAttentionItems.map((item) => (
              <article
                key={item.title}
                className="flex items-center justify-between rounded-[18px] border border-[#f0e2d8] bg-white p-5"
              >
                <div>
                  <div className="text-[13px] font-bold text-[#5d5049]">
                    {item.title}
                  </div>

                  <div className="mt-2 text-[21px] font-extrabold text-[#3d342f]">
                    {item.value}
                  </div>

                  <div className="mt-1 text-[11px] text-[#a39389]">
                    {item.description}
                  </div>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-[14px] text-xl font-extrabold ${item.iconClass}`}
                >
                  {item.icon}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[20px] border border-[#f0e2d8] bg-white shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
          <div className="border-b border-[#f3e8e0] px-6 py-5">
            <h3 className="text-[22px] font-extrabold tracking-[-0.04em] text-[#332d29]">
              Ближайшие сроки годности
            </h3>

            <p className="mt-1 text-[13px] text-[#a09187]">
              Продукты, которым нужно уделить внимание в первую очередь
            </p>
          </div>

          <div className="grid grid-cols-[1.5fr_0.8fr_1fr_0.8fr_0.9fr] gap-3 bg-[#fffaf7] px-6 py-3 text-[10px] font-extrabold uppercase text-[#aa9b91]">
            <div>Продукт</div>
            <div>Количество</div>
            <div>Срок годности</div>
            <div>Осталось</div>
            <div>Статус</div>
          </div>

          {expiredSoonLoading ? (
            <div className="px-6 py-6 text-center text-[13px] text-[#a09187]">
              Загрузка данных...
            </div>
          ) : expiredSoonError ? (
            <div className="px-6 py-6 text-center text-[13px] text-[#c84d45]">
              {expiredSoonError}
            </div>
          ) : expiredSoon.length === 0 ? (
            <div className="px-6 py-6 text-center text-[13px] text-[#a09187]">
              Нет данных.
            </div>
          ) : (
            expiredSoon.map((item, index) => {
              const status = statusConfig[item.status] || {
                label: item.status || "Неизвестный статус",
                className: "bg-[#eee9e5] text-[#81766e]",
              };

              return (
                <div
                  key={`${item.productType}-${index}`}
                  className="grid grid-cols-[1.5fr_0.8fr_1fr_0.8fr_0.9fr] items-center gap-3 border-t border-[#f4ebe5] px-6 py-4 text-[12px]"
                >
                  <div className="font-bold text-[#493e38]">
                    {item.productType || "—"}
                  </div>

                  <div className="text-[#85766d]">
                    {item.amount ?? 0}
                  </div>

                  <div className="text-[#85766d]">
                    {formatDate(item.dateExpired)}
                  </div>

                  <div className="font-bold text-[#665850]">
                    {formatDaysUntil(item.daysUntilExpiration)}
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}

export default Dashboard;