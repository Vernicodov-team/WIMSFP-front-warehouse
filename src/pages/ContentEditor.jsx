import { useState } from "react";

const products = [
  { id: 1, name: "Яйца", unit: "Item" },
  { id: 2, name: "Мясо", unit: "Kilogram" },
  { id: 3, name: "Молоко", unit: "Liter" },
  { id: 4, name: "Рис", unit: "Kilogram" },
  { id: 5, name: "Томаты", unit: "Kilogram" },
  { id: 6, name: "Оливковое масло", unit: "Liter" },
];

const suppliers = [
  {
    name: "ООО «ФудПоставка»",
    email: "food@example.ru",
    deliveries: 24,
    lastDelivery: "14.10.2026",
  },
  {
    name: "ООО «Свежий продукт»",
    email: "fresh@example.ru",
    deliveries: 18,
    lastDelivery: "13.10.2026",
  },
  {
    name: "ИП «Овощной мир»",
    email: "vegetables@example.ru",
    deliveries: 12,
    lastDelivery: "12.10.2026",
  },
  {
    name: "ООО «Молочный край»",
    email: "milk@example.ru",
    deliveries: 9,
    lastDelivery: "10.10.2026",
  },
];

const initialDishes = [
  {
    id: 1,
    name: "Борщ с говядиной",
    description: "Традиционный борщ со сметаной и зеленью",
    price: "490 ₽",
    active: true,
    imageUrl: "",
    ingredients: [
      { name: "Мясо", amount: "250", unit: "г" },
      { name: "Томаты", amount: "100", unit: "г" },
      { name: "Картофель", amount: "150", unit: "г" },
    ],
  },
  {
    id: 2,
    name: "Паста с курицей",
    description: "Паста с куриным филе в сливочном соусе",
    price: "590 ₽",
    active: true,
    imageUrl: "",
    ingredients: [
      { name: "Мясо", amount: "200", unit: "г" },
      { name: "Молоко", amount: "100", unit: "мл" },
      { name: "Рис", amount: "150", unit: "г" },
    ],
  },
  {
    id: 3,
    name: "Овощной салат",
    description: "Свежие овощи с оливковым маслом",
    price: "350 ₽",
    active: false,
    imageUrl: "",
    ingredients: [
      { name: "Томаты", amount: "150", unit: "г" },
      { name: "Оливковое масло", amount: "20", unit: "мл" },
    ],
  },
];

const unitTranslations = {
  Item: "шт.",
  Kilogram: "кг",
  Liter: "л",
};

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
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

function ContentEditor() {
  const [activeSection, setActiveSection] = useState("products");
  const [dishes, setDishes] = useState(initialDishes);
  const [selectedDish, setSelectedDish] = useState(null);

  function toggleDish(dishId) {
    setDishes((currentDishes) =>
      currentDishes.map((dish) =>
        dish.id === dishId ? { ...dish, active: !dish.active } : dish,
      ),
    );
  }

  function saveDish(updatedDish) {
    setDishes((currentDishes) =>
      currentDishes.map((dish) =>
        dish.id === updatedDish.id ? updatedDish : dish,
      ),
    );

    setSelectedDish(null);
  }

  return (
    <main className="min-h-screen bg-[#fff8f1] px-8 py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8">
          <h2 className="text-[38px] font-extrabold tracking-[-0.06em] text-[#302a27]">
            Редактор содержимого
          </h2>

          <p className="mt-2 text-[14px] text-[#958278]">
            Управление продуктами, поставщиками и блюдами ресторана
          </p>
        </header>

        <nav className="mb-6 flex gap-2">
          <SectionButton
            active={activeSection === "products"}
            onClick={() => setActiveSection("products")}
          >
            Продукты
          </SectionButton>

          <SectionButton
            active={activeSection === "suppliers"}
            onClick={() => setActiveSection("suppliers")}
          >
            Поставщики
          </SectionButton>

          <SectionButton
            active={activeSection === "menu"}
            onClick={() => setActiveSection("menu")}
          >
            Меню
          </SectionButton>
        </nav>

        {activeSection === "products" && (
          <ProductsSection products={products} />
        )}

        {activeSection === "suppliers" && (
          <SuppliersSection suppliers={suppliers} />
        )}

        {activeSection === "menu" && (
          <MenuSection
            dishes={dishes}
            onToggleDish={toggleDish}
            onEditDish={setSelectedDish}
          />
        )}
      </div>

      {selectedDish && (
        <DishModal
          dish={selectedDish}
          products={products}
          onClose={() => setSelectedDish(null)}
          onSave={saveDish}
        />
      )}
    </main>
  );
}

function SectionButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-2.5 text-[13px] font-bold transition ${
        active
          ? "bg-[#e96d1b] text-white"
          : "border border-[#eaded5] bg-white text-[#806f65] hover:bg-[#fff0df] hover:text-[#d9671b]"
      }`}
    >
      {children}
    </button>
  );
}

function ProductsSection({ products: productList }) {
  return (
    <section>
      <div className="mb-5">
        <h3 className="text-[24px] font-extrabold tracking-[-0.04em] text-[#332d29]">
          Продукты
        </h3>

        <p className="mt-1 text-[13px] text-[#988980]">
          Все продукты, которые могут быть на складе
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {productList.map((product) => (
          <article
            key={product.id}
            className="rounded-2xl border border-[#f0e2d8] bg-white px-4 py-3 shadow-[0_5px_18px_rgba(120,75,40,0.04)]"
          >
            <h4 className="text-[14px] font-extrabold text-[#403731]">
              {product.name}
            </h4>

            <div className="mt-1 text-[11px] text-[#9d8d83]">
              Единица измерения:{" "}
              <span className="font-bold text-[#665850]">
                {unitTranslations[product.unit] || product.unit}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SuppliersSection({ suppliers: supplierList }) {
  return (
    <section>
      <div className="mb-5">
        <h3 className="text-[24px] font-extrabold tracking-[-0.04em] text-[#332d29]">
          Поставщики
        </h3>

        <p className="mt-1 text-[13px] text-[#988980]">
          Поставщики продуктов и история взаимодействия с ними
        </p>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-[#f0e2d8] bg-white shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
        <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr] gap-4 bg-[#fffaf7] px-6 py-4 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#aa9b91]">
          <div>Имя поставщика</div>
          <div>Почта</div>
          <div>Количество поставок</div>
          <div>Дата последней поставки</div>
        </div>

        {supplierList.map((supplier) => (
          <div
            key={supplier.email}
            className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr] gap-4 border-t border-[#f3e9e2] px-6 py-5 text-[13px]"
          >
            <div className="font-extrabold text-[#493e38]">
              {supplier.name}
            </div>

            <div className="text-[#85766d]">{supplier.email}</div>

            <div className="font-bold text-[#665850]">
              {supplier.deliveries}
            </div>

            <div className="text-[#85766d]">
              {supplier.lastDelivery}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MenuSection({ dishes, onToggleDish, onEditDish }) {
  return (
    <section>
      <div className="mb-5">
        <h3 className="text-[24px] font-extrabold tracking-[-0.04em] text-[#332d29]">
          Меню
        </h3>

        <p className="mt-1 text-[13px] text-[#988980]">
          Управление блюдами и их составом
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {dishes.map((dish) => (
          <article
            key={dish.id}
            className="overflow-hidden rounded-[20px] border border-[#f0e2d8] bg-white shadow-[0_5px_18px_rgba(120,75,40,0.04)]"
          >
            <DishImage src={dish.imageUrl} alt={dish.name} />

            <div className="p-5">
              <h4 className="text-[17px] font-extrabold text-[#403731]">
                {dish.name}
              </h4>

              <p className="mt-2 min-h-[38px] text-[12px] leading-5 text-[#958278]">
                {dish.description}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[18px] font-extrabold text-[#d9671b]">
                  {dish.price}
                </span>

                <label className="flex cursor-pointer items-center gap-2 text-[11px] font-bold text-[#766960]">
                  <span>{dish.active ? "Активно" : "Скрыто"}</span>

                  <input
                    type="checkbox"
                    checked={dish.active}
                    onChange={() => onToggleDish(dish.id)}
                    className="h-4 w-4 accent-[#e96d1b]"
                  />
                </label>
              </div>
            </div>

            <div className="border-t border-[#f3e8e0] p-4">
              <button
                type="button"
                onClick={() => onEditDish(dish)}
                className="w-full rounded-xl bg-[#fff0df] py-2.5 text-[13px] font-bold text-[#d9671b] transition hover:bg-[#ffe2cb]"
              >
                Редактировать
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DishImage({ src, alt }) {
  if (!src) {
    return (
      <div className="flex h-[180px] w-full items-center justify-center bg-[#f5e7dc] text-[13px] text-[#a18d80]">
        Изображение блюда
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-[180px] w-full object-cover"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
}

function DishModal({ dish, products, onClose, onSave }) {
  const [ingredients, setIngredients] = useState(dish.ingredients);
  const [imageUrl, setImageUrl] = useState(dish.imageUrl || "");
  const [dishName, setDishName] = useState(dish.name);
  const [dishPrice, setDishPrice] = useState(dish.price);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  function removeIngredient(ingredientName) {
    setIngredients((currentIngredients) =>
      currentIngredients.filter(
        (ingredient) => ingredient.name !== ingredientName,
      ),
    );
  }

  function saveChanges() {
    onSave({
      ...dish,
      name: dishName,
      price: dishPrice,
      imageUrl,
      ingredients,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#332d29]/35 p-8 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-[900px] overflow-y-auto rounded-[24px] bg-[#fffaf6] shadow-[0_20px_60px_rgba(62,37,20,0.2)]">
        <div className="flex items-center justify-between border-b border-[#f0e2d8] px-7 py-5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#b18e7c]">
              Редактирование блюда
            </div>

            <h3 className="mt-1 text-[25px] font-extrabold tracking-[-0.04em] text-[#332d29]">
              {dish.name}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#a39389] transition hover:bg-[#ffe8d6] hover:text-[#d9671b]"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-7 p-7">
          <div>
            <DishImage src={imageUrl} alt={dishName} />

            <label className="mt-4 block">
              <span className="mb-2 block text-[11px] font-bold text-[#85766d]">
                URL изображения
              </span>

              <input
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://example.com/image.jpg"
                className="h-10 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[12px] text-[#665850] placeholder:text-[#b5a69d] focus:border-[#eb701c] focus:outline-none"
              />
            </label>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold text-[#85766d]">
                  Название
                </span>

                <input
                  value={dishName}
                  onChange={(event) => setDishName(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] focus:border-[#eb701c] focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-bold text-[#85766d]">
                  Цена
                </span>

                <input
                  value={dishPrice}
                  onChange={(event) => setDishPrice(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] focus:border-[#eb701c] focus:outline-none"
                />
              </label>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-[20px] font-extrabold text-[#403731]">
                Состав
              </h4>

              <button
                type="button"
                onClick={() => setIsAddProductOpen(true)}
                className="rounded-xl bg-[#fff0df] px-3 py-2 text-[11px] font-bold text-[#d9671b] transition hover:bg-[#ffe2cb]"
              >
                + Добавить продукт
              </button>
            </div>

            <div className="space-y-3">
              {ingredients.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#e8cdbb] bg-white p-4 text-center text-[12px] text-[#958278]">
                  Состав блюда пуст.
                </div>
              ) : (
                ingredients.map((ingredient) => (
                  <div
                    key={ingredient.id || ingredient.name}
                    className="flex items-center justify-between rounded-xl border border-[#f0e2d8] bg-white px-4 py-3"
                  >
                    <div>
                      <div className="text-[13px] font-bold text-[#554941]">
                        {ingredient.name}
                      </div>

                      <div className="mt-1 text-[11px] text-[#958278]">
                        {ingredient.amount} {ingredient.unit || ""}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeIngredient(ingredient.name)}
                      aria-label={`Убрать ${ingredient.name} из состава`}
                      title="Убрать продукт"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff0df] text-[#d9671b] transition hover:bg-[#ffe0c2] hover:text-[#c84d45]"
                    >
                      <MinusIcon />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#f0e2d8] px-7 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#eaded5] px-5 py-2.5 text-[13px] font-bold text-[#85766d] transition hover:bg-white"
          >
            Отмена
          </button>

          <button
            type="button"
            onClick={saveChanges}
            className="rounded-xl bg-[#e96d1b] px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#d95e12]"
          >
            Сохранить
          </button>
        </div>

        {isAddProductOpen && (
          <AddProductModal
            products={products}
            ingredients={ingredients}
            onClose={() => setIsAddProductOpen(false)}
            onAdd={(ingredient) => {
              setIngredients((currentIngredients) => [
                ...currentIngredients,
                ingredient,
              ]);
              setIsAddProductOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

function AddProductModal({
  products,
  ingredients,
  onClose,
  onAdd,
}) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [amount, setAmount] = useState("");

  const selectedProduct = products.find(
    (product) => product.id === Number(selectedProductId),
  );

  const inputUnit =
    selectedProduct?.unit === "Kilogram"
      ? "г"
      : selectedProduct?.unit === "Liter"
        ? "мл"
        : "шт.";

  function convertAmount() {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return null;
    }

    if (
      selectedProduct.unit === "Kilogram" ||
      selectedProduct.unit === "Liter"
    ) {
      return numericAmount / 1000;
    }

    return numericAmount;
  }

  function submitProduct(event) {
    event.preventDefault();

    if (!selectedProduct) {
      alert("Выберите продукт.");
      return;
    }

    const convertedAmount = convertAmount();

    if (convertedAmount === null) {
      alert("Введите корректное количество.");
      return;
    }

    const alreadyAdded = ingredients.some(
      (ingredient) => ingredient.name === selectedProduct.name,
    );

    if (alreadyAdded) {
      alert("Этот продукт уже добавлен в состав.");
      return;
    }

    onAdd({
      id: `${selectedProduct.id}-${Date.now()}`,
      name: selectedProduct.name,
      amount: convertedAmount,
      unit: unitTranslations[selectedProduct.unit],
      backendAmount: convertedAmount,
      backendUnit: selectedProduct.unit,
    });
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[24px] bg-[#332d29]/30 p-6 backdrop-blur-sm">
      <form
        onSubmit={submitProduct}
        className="w-full max-w-[430px] rounded-[22px] bg-white p-6 shadow-[0_15px_45px_rgba(62,37,20,0.2)]"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[20px] font-extrabold text-[#332d29]">
            Добавить продукт
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#a39389] transition hover:bg-[#fff0df] hover:text-[#d9671b]"
          >
            <CloseIcon />
          </button>
        </div>

        <label className="block">
          <span className="mb-2 block text-[12px] font-bold text-[#85766d]">
            Продукт
          </span>

          <select
            value={selectedProductId}
            onChange={(event) => setSelectedProductId(event.target.value)}
            className="h-11 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] text-[#665850] focus:border-[#eb701c] focus:outline-none"
          >
            <option value="">Выберите продукт</option>

            {products.map((product) => (
              <option
                key={product.id}
                value={product.id}
                disabled={ingredients.some(
                  (ingredient) => ingredient.name === product.name,
                )}
              >
                {product.name} —{" "}
                {unitTranslations[product.unit] || product.unit}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="mb-2 block text-[12px] font-bold text-[#85766d]">
            Количество {selectedProduct ? `(${inputUnit})` : ""}
          </span>

          <input
            type="number"
            min="0"
            step={selectedProduct?.unit === "Item" ? "1" : "0.01"}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={
              selectedProduct
                ? `Введите количество в ${inputUnit}`
                : "Сначала выберите продукт"
            }
            disabled={!selectedProduct}
            className="h-11 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] placeholder:text-[#b5a69d] focus:border-[#eb701c] focus:outline-none disabled:bg-[#f8f3ef]"
          />
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#eaded5] px-4 py-2.5 text-[12px] font-bold text-[#85766d] transition hover:bg-[#fff8f1]"
          >
            Отмена
          </button>

          <button
            type="submit"
            className="rounded-xl bg-[#e96d1b] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#d95e12]"
          >
            Добавить
          </button>
        </div>
      </form>
    </div>
  );
}

export default ContentEditor;