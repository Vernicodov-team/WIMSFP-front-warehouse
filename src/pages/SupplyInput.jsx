import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

const unitLabels = {
  item: "шт.",
  kilogram: "кг",
  liter: "л",
};

function MinusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("ru-RU")} ₽`;
}

function normalizeUnit(unit) {
  return String(unit || "").trim().toLowerCase();
}

function getUnitLabel(unit) {
  return unitLabels[normalizeUnit(unit)] || unit || "—";
}

function toIsoDate(date) {
  return new Date(`${date}T00:00:00`).toISOString();
}

function SupplyInput({ onAddDelivery }) {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);

  const [productsError, setProductsError] = useState("");
  const [suppliersError, setSuppliersError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [supplierName, setSupplierName] = useState("");

  const [deliveryProducts, setDeliveryProducts] = useState([
    {
      id: 1,
      productName: "",
      amount: "",
      price: "",
      expirationDate: "",
    },
  ]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await apiFetch("/api/v1/Products");

        if (!response.ok) {
          throw new Error(`Ошибка загрузки продуктов: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Некорректный ответ со списком продуктов.");
        }

        setProducts(data);
      } catch (requestError) {
        setProductsError(
          requestError.message || "Не удалось загрузить продукты.",
        );
      } finally {
        setIsLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const response = await apiFetch("/api/v1/Suppliers");

        if (!response.ok) {
          throw new Error(`Ошибка загрузки поставщиков: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Некорректный ответ со списком поставщиков.");
        }

        setSuppliers(data);
      } catch (requestError) {
        setSuppliersError(
          requestError.message || "Не удалось загрузить поставщиков.",
        );
      } finally {
        setIsLoadingSuppliers(false);
      }
    }

    loadSuppliers();
  }, []);

  function addProductRow() {
    setError("");

    setDeliveryProducts((currentProducts) => [
      ...currentProducts,
      {
        id: Date.now() + Math.random(),
        productName: "",
        amount: "",
        price: "",
        expirationDate: "",
      },
    ]);
  }

  function removeProductRow(rowId) {
    setError("");

    if (deliveryProducts.length === 1) {
      return;
    }

    setDeliveryProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== rowId),
    );
  }

  function updateProductRow(rowId, field, value) {
    setError("");

    setDeliveryProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === rowId
          ? { ...product, [field]: value }
          : product,
      ),
    );
  }

  function calculateProductCost(product) {
    return (Number(product.amount) || 0) * (Number(product.price) || 0);
  }

  function resetForm() {
    setDeliveryNumber("");
    setDeliveryDate("");
    setSupplierName("");
    setError("");
    setSuccess("");

    setDeliveryProducts([
      {
        id: 1,
        productName: "",
        amount: "",
        price: "",
        expirationDate: "",
      },
    ]);
  }

  async function submitSupply(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!deliveryNumber.trim()) {
      setError("Введите номер поставки.");
      return;
    }

    if (!deliveryDate) {
      setError("Выберите дату поставки.");
      return;
    }

    if (!supplierName) {
      setError("Выберите поставщика.");
      return;
    }

    if (deliveryProducts.some((product) => !product.productName)) {
      setError("Выберите продукт в каждой строке.");
      return;
    }

    if (
      deliveryProducts.some(
        (product) => !product.amount || Number(product.amount) <= 0,
      )
    ) {
      setError("Количество должно быть больше нуля.");
      return;
    }

    if (
      deliveryProducts.some(
        (product) => product.price === "" || Number(product.price) < 0,
      )
    ) {
      setError("Введите корректную цену для каждого продукта.");
      return;
    }

    if (deliveryProducts.some((product) => !product.expirationDate)) {
      setError("Укажите срок годности для каждого продукта.");
      return;
    }

    const totalPrice = deliveryProducts.reduce(
      (total, product) => total + calculateProductCost(product),
      0,
    );

    const payload = {
      number: deliveryNumber.trim(),
      dateReceived: toIsoDate(deliveryDate),
      price: totalPrice,
      supplierName,
      receivedProducts: deliveryProducts.map((product) => ({
        productName: product.productName,
        expirationDate: toIsoDate(product.expirationDate),
        count: Number(product.amount),
        itemPrice: Number(product.price),
      })),
    };

    try {
      const response = await apiFetch("/api/v1/supply/AddDelivery", {
        method: "POST",
        headers: {
          Accept: "*/*",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const responseText = await response.text();

        throw new Error(
          responseText ||
            `Ошибка создания поставки: ${response.status}`,
        );
      }

      const newDelivery = {
        id: Date.now(),
        number: payload.number,
        date: deliveryDate,
        supplier: payload.supplierName,
        totalWeight: deliveryProducts.reduce(
          (total, product) => total + Number(product.amount),
          0,
        ),
        cost: totalPrice,
        products: deliveryProducts.map((product) => ({
          name: product.productName,
          quantity: Number(product.amount),
          unit:
            getUnitLabel(
              products.find(
                (item) => item.name === product.productName,
              )?.measureUnit,
            ),
          price: Number(product.price),
          cost: calculateProductCost(product),
          productionDate: null,
          expirationDate: product.expirationDate,
        })),
      };

      if (onAddDelivery) {
        onAddDelivery(newDelivery);
      } else {
        setSuccess("Поставка успешно создана.");
        resetForm();
      }
    } catch (requestError) {
      setError(
        requestError.message || "Не удалось создать поставку.",
      );
    }
  }

  const totalPrice = deliveryProducts.reduce(
    (total, product) => total + calculateProductCost(product),
    0,
  );

  return (
    <main className="min-h-screen bg-[#fff8f1] px-8 py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8">
          <h2 className="text-[38px] font-extrabold tracking-[-0.06em] text-[#302a27]">
            Ввод поставки
          </h2>

          <p className="mt-2 text-[14px] text-[#958278]">
            Добавьте продукты, поступившие на склад
          </p>
        </header>

        <form onSubmit={submitSupply}>
          <section className="mb-6 rounded-[20px] border border-[#f0e2d8] bg-white p-6 shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
            <h3 className="mb-5 text-[21px] font-extrabold text-[#332d29]">
              Данные поставки
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <label>
                <span className="mb-2 block text-[12px] font-bold text-[#85766d]">
                  Номер поставки
                </span>

                <input
                  value={deliveryNumber}
                  onChange={(event) =>
                    setDeliveryNumber(event.target.value)
                  }
                  placeholder="Например, П-1043"
                  className="h-11 w-full rounded-xl border border-[#eaded5] px-3 text-[13px] focus:border-[#eb701c] focus:outline-none"
                />
              </label>

              <label>
                <span className="mb-2 block text-[12px] font-bold text-[#85766d]">
                  Дата получения
                </span>

                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(event) => setDeliveryDate(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#eaded5] px-3 text-[13px] focus:border-[#eb701c] focus:outline-none"
                />
              </label>

              <label>
                <span className="mb-2 block text-[12px] font-bold text-[#85766d]">
                  Поставщик
                </span>

                <select
                  value={supplierName}
                  onChange={(event) => setSupplierName(event.target.value)}
                  disabled={isLoadingSuppliers || suppliers.length === 0}
                  className="h-11 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] focus:border-[#eb701c] focus:outline-none disabled:bg-[#f8f3ef]"
                >
                  <option value="">
                    {isLoadingSuppliers
                      ? "Загрузка поставщиков..."
                      : "Выберите поставщика"}
                  </option>

                  {suppliers.map((supplier) => (
                    <option
                      key={supplier.email}
                      value={supplier.name}
                    >
                      {supplier.name} — {supplier.email}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {suppliersError && (
              <div className="mt-4 rounded-xl border border-[#f2b8b2] bg-[#ffe1dd] px-4 py-3 text-[13px] font-bold text-[#c84d45]">
                {suppliersError}
              </div>
            )}
          </section>

          <section className="mb-6 rounded-[20px] border border-[#f0e2d8] bg-white p-6 shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[21px] font-extrabold text-[#332d29]">
                  Состав поставки
                </h3>

                <p className="mt-1 text-[12px] text-[#988980]">
                  Введите количество и цену за единицу
                </p>
              </div>

              <button
                type="button"
                onClick={addProductRow}
                className="rounded-xl bg-[#fff0df] px-4 py-2.5 text-[12px] font-bold text-[#d9671b]"
              >
                + Добавить продукт
              </button>
            </div>

            {productsError && (
              <div className="mb-4 rounded-xl border border-[#f2b8b2] bg-[#ffe1dd] px-4 py-3 text-[13px] font-bold text-[#c84d45]">
                {productsError}
              </div>
            )}

            <div className="mb-3 grid grid-cols-[1.25fr_0.8fr_0.7fr_0.9fr_1fr_44px] gap-3 text-[10px] font-extrabold uppercase text-[#aa9b91]">
              <div>Продукт</div>
              <div>Количество</div>
              <div>Единица</div>
              <div>Цена</div>
              <div>Годен до</div>
              <div />
            </div>

            <div className="space-y-3">
              {deliveryProducts.map((deliveryProduct) => {
                const selectedProduct = products.find(
                  (product) =>
                    product.name === deliveryProduct.productName,
                );

                const productCost =
                  calculateProductCost(deliveryProduct);

                return (
                  <div
                    key={deliveryProduct.id}
                    className="grid grid-cols-[1.25fr_0.8fr_0.7fr_0.9fr_1fr_44px] items-start gap-3"
                  >
                    <select
                      value={deliveryProduct.productName}
                      onChange={(event) =>
                        updateProductRow(
                          deliveryProduct.id,
                          "productName",
                          event.target.value,
                        )
                      }
                      disabled={
                        isLoadingProducts || products.length === 0
                      }
                      className="h-11 rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] focus:border-[#eb701c] focus:outline-none disabled:bg-[#f8f3ef]"
                    >
                      <option value="">
                        {isLoadingProducts
                          ? "Загрузка..."
                          : "Выберите продукт"}
                      </option>

                      {products.map((product) => (
                        <option key={product.name} value={product.name}>
                          {product.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryProduct.amount}
                      onChange={(event) =>
                        updateProductRow(
                          deliveryProduct.id,
                          "amount",
                          event.target.value,
                        )
                      }
                      placeholder="Количество"
                      className="h-11 rounded-xl border border-[#eaded5] px-3 text-[13px] focus:border-[#eb701c] focus:outline-none"
                    />

                    <div className="flex h-11 items-center rounded-xl border border-[#eaded5] bg-[#fdf8f4] px-3 text-[13px]">
                      {selectedProduct
                        ? getUnitLabel(selectedProduct.measureUnit)
                        : "—"}
                    </div>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={deliveryProduct.price}
                      onChange={(event) =>
                        updateProductRow(
                          deliveryProduct.id,
                          "price",
                          event.target.value,
                        )
                      }
                      placeholder="Цена"
                      className="h-11 rounded-xl border border-[#eaded5] px-3 text-[13px] focus:border-[#eb701c] focus:outline-none"
                    />

                    <input
                      type="date"
                      value={deliveryProduct.expirationDate}
                      onChange={(event) =>
                        updateProductRow(
                          deliveryProduct.id,
                          "expirationDate",
                          event.target.value,
                        )
                      }
                      className="h-11 rounded-xl border border-[#eaded5] px-3 text-[13px] focus:border-[#eb701c] focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => removeProductRow(deliveryProduct.id)}
                      className="flex h-11 items-center justify-center rounded-xl bg-[#fff0df] text-[#d9671b]"
                    >
                      <MinusIcon />
                    </button>

                    {productCost > 0 && (
                      <div className="col-span-full text-right text-[11px] text-[#958278]">
                        Стоимость позиции: {formatMoney(productCost)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end border-t border-[#f3e8e0] pt-4 text-[15px] font-extrabold text-[#493e38]">
              Общая стоимость: {formatMoney(totalPrice)}
            </div>
          </section>

          {error && (
            <div className="mb-6 rounded-xl border border-[#f2b8b2] bg-[#ffe1dd] px-4 py-3 text-[13px] font-bold text-[#c84d45]">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-[#b8dfb0] bg-[#e8f3e1] px-4 py-3 text-[13px] font-bold text-[#59874c]">
              {success}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-[#eaded5] px-5 py-3 text-[13px] font-bold text-[#85766d]"
            >
              Очистить
            </button>

            <button
              type="submit"
              disabled={
                isLoadingProducts ||
                isLoadingSuppliers ||
                products.length === 0 ||
                suppliers.length === 0
              }
              className="rounded-xl bg-[#e96d1b] px-5 py-3 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Создать поставку
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default SupplyInput;