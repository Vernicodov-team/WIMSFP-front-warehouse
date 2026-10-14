import { useState } from "react";

const products = [
  {
    id: 1,
    name: "Яйца",
    unit: "Item",
  },
  {
    id: 2,
    name: "Мясо",
    unit: "Kilogram",
  },
  {
    id: 3,
    name: "Молоко",
    unit: "Liter",
  },
  {
    id: 4,
    name: "Рис",
    unit: "Kilogram",
  },
  {
    id: 5,
    name: "Томаты",
    unit: "Kilogram",
  },
  {
    id: 6,
    name: "Оливковое масло",
    unit: "Liter",
  },
];

const suppliers = [
  "ООО «ФудПоставка»",
  "ООО «Свежий продукт»",
  "ИП «Овощной мир»",
  "ООО «Молочный край»",
];

const unitLabels = {
  Item: "шт.",
  Kilogram: "кг",
  Liter: "л",
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

function SupplyInput() {
  const [deliveryNumber, setDeliveryNumber] = useState("П-1043");
  const [deliveryDate, setDeliveryDate] = useState("2026-10-14");
  const [supplier, setSupplier] = useState("");
  const [message, setMessage] = useState("");

  const [deliveryProducts, setDeliveryProducts] = useState([
    {
      id: 1,
      productId: "",
      amount: "",
      price: "",
    },
  ]);

  function addProductRow() {
    setDeliveryProducts((currentProducts) => [
      ...currentProducts,
      {
        id: Date.now() + Math.random(),
        productId: "",
        amount: "",
        price: "",
      },
    ]);
  }

  function removeProductRow(rowId) {
    if (deliveryProducts.length === 1) {
      return;
    }

    setDeliveryProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== rowId),
    );
  }

  function updateProductRow(rowId, field, value) {
    setDeliveryProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === rowId
          ? { ...product, [field]: value }
          : product,
      ),
    );
  }

  function calculateProductCost(product) {
    const amount = Number(product.amount) || 0;
    const price = Number(product.price) || 0;

    return amount * price;
  }

  function resetForm() {
    setDeliveryNumber("П-1043");
    setDeliveryDate("2026-10-14");
    setSupplier("");
    setMessage("");

    setDeliveryProducts([
      {
        id: Date.now(),
        productId: "",
        amount: "",
        price: "",
      },
    ]);
  }

  function submitSupply(event) {
    event.preventDefault();
    setMessage("");

    if (!deliveryNumber.trim()) {
      setMessage("Введите номер поставки.");
      return;
    }

    if (!deliveryDate) {
      setMessage("Выберите дату поставки.");
      return;
    }

    if (!supplier) {
      setMessage("Выберите поставщика.");
      return;
    }

    const invalidProduct = deliveryProducts.some(
      (deliveryProduct) =>
        !deliveryProduct.productId ||
        Number(deliveryProduct.amount) <= 0 ||
        Number(deliveryProduct.price) < 0 ||
        deliveryProduct.price === "",
    );

    if (invalidProduct) {
      setMessage(
        "Заполните продукт, количество и цену во всех строках.",
      );
      return;
    }

    const preparedProducts = deliveryProducts.map((deliveryProduct) => {
      const selectedProduct = products.find(
        (product) => product.id === Number(deliveryProduct.productId),
      );

      const amount = Number(deliveryProduct.amount);
      const price = Number(deliveryProduct.price);

      return {
        productType: selectedProduct.name,
        amount,
        unit: selectedProduct.unit,
        price,
        cost: amount * price,
      };
    });

    const totalCost = preparedProducts.reduce(
      (total, product) => total + product.cost,
      0,
    );

    console.log("Данные поставки для будущего API:", {
      number: deliveryNumber.trim(),
      date: deliveryDate,
      supplier,
      products: preparedProducts,
      totalCost,
    });

    setMessage(
      `Поставка ${deliveryNumber} проверена. Общая стоимость: ${formatMoney(totalCost)}.`,
    );
  }

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
            <h3 className="mb-5 text-[21px] font-extrabold tracking-[-0.04em] text-[#332d29]">
              Данные поставки
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <label className="block">
                <span className="mb-2 block text-[12px] font-bold text-[#85766d]">
                  Номер поставки
                </span>

                <input
                  value={deliveryNumber}
                  onChange={(event) =>
                    setDeliveryNumber(event.target.value)
                  }
                  placeholder="Например, П-1043"
                  className="h-11 w-full rounded-xl border border-[#eaded5] bg-[#fffdfb] px-3 text-[13px] placeholder:text-[#b5a69d] focus:border-[#eb701c] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[12px] font-bold text-[#85766d]">
                  Дата поставки
                </span>

                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(event) => setDeliveryDate(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#eaded5] bg-[#fffdfb] px-3 text-[13px] focus:border-[#eb701c] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[12px] font-bold text-[#85766d]">
                  Поставщик
                </span>

                <select
                  value={supplier}
                  onChange={(event) => setSupplier(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] text-[#665850] focus:border-[#eb701c] focus:outline-none"
                >
                  <option value="">Выберите поставщика</option>

                  {suppliers.map((supplierName) => (
                    <option key={supplierName} value={supplierName}>
                      {supplierName}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="mb-6 rounded-[20px] border border-[#f0e2d8] bg-white p-6 shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[21px] font-extrabold tracking-[-0.04em] text-[#332d29]">
                  Состав поставки
                </h3>

                <p className="mt-1 text-[12px] text-[#988980]">
                  Введите количество в кг, л или шт.
                </p>
              </div>

              <button
                type="button"
                onClick={addProductRow}
                className="rounded-xl bg-[#fff0df] px-4 py-2.5 text-[12px] font-bold text-[#d9671b] transition hover:bg-[#ffe2cb]"
              >
                + Добавить продукт
              </button>
            </div>

            <div className="mb-3 grid grid-cols-[1.4fr_0.8fr_0.8fr_1fr_44px] gap-3 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#aa9b91]">
              <div>Продукт</div>
              <div>Количество</div>
              <div>Единица</div>
              <div>Цена за единицу</div>
              <div />
            </div>

            <div className="space-y-3">
              {deliveryProducts.map((deliveryProduct) => {
                const selectedProduct = products.find(
                  (product) =>
                    product.id === Number(deliveryProduct.productId),
                );

                const unit = selectedProduct
                  ? unitLabels[selectedProduct.unit]
                  : "—";

                const productCost =
                  calculateProductCost(deliveryProduct);

                return (
                  <div
                    key={deliveryProduct.id}
                    className="grid grid-cols-[1.4fr_0.8fr_0.8fr_1fr_44px] items-start gap-3"
                  >
                    <select
                      value={deliveryProduct.productId}
                      onChange={(event) =>
                        updateProductRow(
                          deliveryProduct.id,
                          "productId",
                          event.target.value,
                        )
                      }
                      className="h-11 rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] text-[#665850] focus:border-[#eb701c] focus:outline-none"
                    >
                      <option value="">Выберите продукт</option>

                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="0"
                      step={
                        selectedProduct?.unit === "Item"
                          ? "1"
                          : "0.01"
                      }
                      value={deliveryProduct.amount}
                      onChange={(event) =>
                        updateProductRow(
                          deliveryProduct.id,
                          "amount",
                          event.target.value,
                        )
                      }
                      placeholder="Количество"
                      className="h-11 rounded-xl border border-[#eaded5] bg-[#fffdfb] px-3 text-[13px] placeholder:text-[#b5a69d] focus:border-[#eb701c] focus:outline-none"
                    />

                    <div className="flex h-11 items-center rounded-xl border border-[#eaded5] bg-[#fdf8f4] px-3 text-[13px] text-[#665850]">
                      {unit}
                    </div>

                    <div>
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
                        className="h-11 w-full rounded-xl border border-[#eaded5] bg-[#fffdfb] px-3 text-[13px] placeholder:text-[#b5a69d] focus:border-[#eb701c] focus:outline-none"
                      />

                      {productCost > 0 && (
                        <div className="mt-1 text-[10px] text-[#a09187]">
                          Сумма: {formatMoney(productCost)}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeProductRow(deliveryProduct.id)
                      }
                      aria-label="Удалить продукт из поставки"
                      className="flex h-11 items-center justify-center rounded-xl bg-[#fff0df] text-[#d9671b] transition hover:bg-[#ffe0c2] hover:text-[#c84d45]"
                    >
                      <MinusIcon />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end border-t border-[#f3e8e0] pt-4">
              <div className="text-[15px] font-extrabold text-[#493e38]">
                Общая стоимость:{" "}
                {formatMoney(
                  deliveryProducts.reduce(
                    (total, product) =>
                      total + calculateProductCost(product),
                    0,
                  ),
                )}
              </div>
            </div>
          </section>

          {message && (
            <div className="mb-6 rounded-xl bg-[#e8f3e1] px-4 py-3 text-[13px] font-bold text-[#59874c]">
              {message}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-[#eaded5] px-5 py-3 text-[13px] font-bold text-[#85766d] transition hover:bg-white"
            >
              Очистить
            </button>

            <button
              type="submit"
              className="rounded-xl bg-[#e96d1b] px-5 py-3 text-[13px] font-bold text-white shadow-[0_5px_12px_rgba(232,109,27,0.18)] transition hover:bg-[#d95e12]"
            >
              Проверить поставку
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default SupplyInput;