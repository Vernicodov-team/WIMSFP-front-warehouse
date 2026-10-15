import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5094/api/v1";

const statusConfig = {
  Active: {
    label: "В норме",
    className: "bg-[#e8f3e1] text-[#59874c]",
  },
  Expired: {
    label: "Просрочено",
    className: "bg-[#ffe1dd] text-[#c84d45]",
  },
  Decommissioned: {
    label: "Списано",
    className: "bg-[#eee9e5] text-[#81746e]",
  },
  Spent: {
    label: "Израсходовано",
    className: "bg-[#fff0c9] text-[#b8791b]",
  },
};

const unitLabels = {
  Item: "шт.",
  item: "шт.",
  Kilogram: "кг",
  kilogram: "кг",
  Liter: "л",
  liter: "л",
};

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function formatDate(date) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("ru-RU");
}

function normalizeUnit(unit) {
  return unitLabels[unit] || unit || "—";
}

function getDaysUntilExpiration(date) {
  if (!date) {
    return null;
  }

  const today = new Date();
  const expirationDate = new Date(date);
  const difference =
    expirationDate.getTime() - today.getTime();

  return Math.ceil(
    difference / (1000 * 60 * 60 * 24),
  );
}

function getDaysClass(days) {
  if (days === null) {
    return "text-[#85766d]";
  }

  if (days < 0) {
    return "text-[#c84d45]";
  }

  if (days <= 3) {
    return "text-[#b8791b]";
  }

  return "text-[#59874c]";
}

function getExpirationClass(date) {
  const days = getDaysUntilExpiration(date);

  if (days === null) {
    return "text-[#85766d]";
  }

  if (days < 0) {
    return "text-[#c84d45]";
  }

  if (days <= 3) {
    return "text-[#b8791b]";
  }

  return "text-[#665850]";
}

function getStatusConfig(status) {
  return (
    statusConfig[status] || {
      label: status || "Неизвестно",
      className: "bg-[#eee9e5] text-[#81746e]",
    }
  );
}

function Warehouse() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProducts() {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/Stock/Sum`);

      if (!response.ok) {
        throw new Error(
          `Ошибка загрузки склада: ${response.status}`,
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "Бэкенд вернул некорректный список остатков.",
        );
      }

      setProducts(data);
    } catch (requestError) {
      setProducts([]);

      setError(
        requestError.message ||
          "Не удалось загрузить данные склада.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) =>
      String(product.name || "")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [products, search]);

  function toggleProduct(productName) {
    setExpandedProduct((currentProduct) =>
      currentProduct === productName ? null : productName,
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8f1] px-8 py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-[38px] font-extrabold tracking-[-0.06em] text-[#302a27]">
              Склад
            </h2>

            <p className="mt-2 text-[14px] text-[#958278]">
              Текущие остатки продуктов и сроки годности
            </p>
          </div>

          <button
            type="button"
            onClick={loadProducts}
            className="rounded-xl bg-[#fff0df] px-4 py-2.5 text-[12px] font-bold text-[#d9671b] transition hover:bg-[#ffe2cb]"
          >
            Обновить данные
          </button>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-[#f2b8b2] bg-[#ffe1dd] px-4 py-3 text-[13px] font-bold text-[#c84d45]">
            {error}
          </div>
        )}

        <section className="mb-5 rounded-[20px] border border-[#f0e2d8] bg-white p-5">
          <div className="relative">
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#aa9d94]">
              <SearchIcon />
            </div>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по названию продукта..."
              className="h-11 w-full rounded-xl border border-[#eaded5] bg-[#fffdfb] px-11 pr-11 text-[13px] placeholder:text-[#aa9d94] focus:border-[#eb701c] focus:outline-none"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Очистить поиск"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#a39389] transition hover:bg-[#fff0df] hover:text-[#d9671b]"
              >
                <ClearIcon />
              </button>
            )}
          </div>

          <div className="mt-3 text-[12px] text-[#a09187]">
            {isLoading
              ? "Загрузка остатков..."
              : `Найдено продуктов: ${filteredProducts.length}`}
          </div>
        </section>

        <section className="overflow-hidden rounded-[20px] border border-[#f0e2d8] bg-white shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
          <div className="grid grid-cols-[2fr_1fr_1fr_1.2fr_1.2fr_60px] gap-4 bg-[#fffaf7] px-6 py-4 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#aa9b91]">
            <div>Наименование продукта</div>
            <div>Количество</div>
            <div>Единица измерения</div>
            <div>Ближайший срок</div>
            <div>Последняя поставка</div>
            <div />
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-[14px] text-[#958278]">
              Загружаем данные склада...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-10 text-center text-[14px] text-[#958278]">
              Продукты не найдены.
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isExpanded =
                expandedProduct === product.name;

              const unit = normalizeUnit(product.unit);

              return (
                <div key={product.name}>
                  <button
                    type="button"
                    onClick={() => toggleProduct(product.name)}
                    className="grid w-full grid-cols-[2fr_1fr_1fr_1.2fr_1.2fr_60px] items-center gap-4 border-t border-[#f3e9e2] px-6 py-5 text-left text-[13px] transition hover:bg-[#fffaf7]"
                  >
                    <span className="font-extrabold text-[#493e38]">
                      {product.name}
                    </span>

                    <span className="font-bold text-[#665850]">
                      {product.sumAmount ?? 0}
                    </span>

                    <span className="text-[#85766d]">
                      {unit}
                    </span>

                    <span
                      className={`font-bold ${getExpirationClass(
                        product.firstExpired,
                      )}`}
                    >
                      {formatDate(product.firstExpired)}
                    </span>

                    <span className="text-[#85766d]">
                      {formatDate(product.lastDelivery)}
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
                      <div className="mb-3 text-[12px] font-extrabold text-[#594a42]">
                        Поставки продукта: {product.name}
                      </div>

                      <div className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_0.9fr_1fr] gap-3 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#aa9b91]">
                        <div>Продукт</div>
                        <div>Количество</div>
                        <div>Получен</div>
                        <div>Годен до</div>
                        <div>Дней до истечения</div>
                        <div>Статус</div>
                      </div>

                      {Array.isArray(product.stocks) &&
                        product.stocks.map((stock, index) => {
                          const status = getStatusConfig(
                            stock.status,
                          );

                          const daysUntilExpiration =
                            stock.daysUntilExpiration ??
                            getDaysUntilExpiration(
                              stock.dateExpired,
                            );

                          return (
                            <div
                              key={`${product.name}-${index}`}
                              className="grid grid-cols-[1.4fr_0.8fr_1fr_1fr_0.9fr_1fr] items-center gap-3 border-t border-[#f1e5dd] py-3 text-[12px] text-[#766960]"
                            >
                              <div className="font-bold text-[#493e38]">
                                {stock.productType ||
                                  product.name}
                              </div>

                              <div>
                                {stock.amount ?? 0} {unit}
                              </div>

                              <div>
                                {formatDate(stock.dateReceived)}
                              </div>

                              <div
                                className={getExpirationClass(
                                  stock.dateExpired,
                                )}
                              >
                                {formatDate(stock.dateExpired)}
                              </div>

                              <div
                                className={`font-bold ${getDaysClass(
                                  daysUntilExpiration,
                                )}`}
                              >
                                {daysUntilExpiration === null
                                  ? "—"
                                  : daysUntilExpiration < 0
                                    ? "Просрочено"
                                    : `${daysUntilExpiration} дн.`}
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
                        })}
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

export default Warehouse;