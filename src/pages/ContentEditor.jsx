import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api/client";

const unitTranslations = {
  Item: "шт.",
  Kilogram: "кг",
  Liter: "л",
  item: "шт.",
  kilogram: "кг",
  liter: "л",
};

function getValue(object, ...names) {
  for (const name of names) {
    if (object?.[name] !== undefined && object?.[name] !== null) {
      return object[name];
    }
  }

  return undefined;
}

function getList(value) {
  if (Array.isArray(value)) {
    return value;
  }

  const nested = getValue(value, "items", "Items", "data", "Data");
  return Array.isArray(nested) ? nested : [];
}

function normalizeProduct(product) {
  const name = getValue(product, "name", "Name") ?? "";

  return {
    // Product API не возвращает id; имя используется как ключ.
    id: name,
    name,
    unit: getValue(product, "measureUnit", "MeasureUnit") ?? "",
  };
}

function normalizeSupplier(supplier, index) {
  const name = getValue(supplier, "name", "Name") ?? "";
  const email = getValue(supplier, "email", "Email") ?? "";

  return {
    id: email || name || index,
    name,
    email,
    // API поставщиков не предоставляет эти поля.
    deliveries: "—",
    lastDelivery: "—",
  };
}

function normalizeIngredient(ingredient, products) {
  const productValue = getValue(ingredient, "product", "Product");
  const productName =
      typeof productValue === "string"
          ? productValue
          : getValue(productValue, "name", "Name") ?? "";

  const product = products.find((item) => item.name === productName);
  const productUnit = product?.unit ?? "";
  const backendAmount = Number(
      getValue(ingredient, "count", "Count") ?? 0,
  );

  const isWeightOrVolume =
      productUnit === "Kilogram" ||
      productUnit === "kilogram" ||
      productUnit === "Liter" ||
      productUnit === "liter";

  return {
    id: productName,
    name: productName,
    amount: String(isWeightOrVolume ? backendAmount * 1000 : backendAmount),
    unit:
        productUnit === "Kilogram" || productUnit === "kilogram"
            ? "г"
            : productUnit === "Liter" || productUnit === "liter"
                ? "мл"
                : unitTranslations[productUnit] || productUnit,
    backendAmount,
    backendUnit: productUnit,
  };
}

function normalizeDish(dish, products) {
  const name = getValue(dish, "name", "Name") ?? "";
  const price = getValue(dish, "price", "Price") ?? "";
  const rawIngredients = getValue(dish, "ingredients", "Ingredients");

  return {
    id: name,
    name,
    description: getValue(dish, "description", "Description") ?? "",
    imageUrl: getValue(dish, "imageUrl", "ImageUrl") ?? "",
    category: getValue(dish, "category", "Category") ?? "",
    price: typeof price === "number" ? `${price} ₽` : String(price),
    active: Boolean(getValue(dish, "available", "Available")),
    ingredients: Array.isArray(rawIngredients)
        ? rawIngredients.map((ingredient) =>
            normalizeIngredient(ingredient, products),
        )
        : [],
    ingredientsLoaded: Array.isArray(rawIngredients),
  };
}

function parsePrice(value) {
  const price = Number(
      String(value).replace(/[^\d.,-]/g, "").replace(",", "."),
  );

  return Number.isFinite(price) ? price : 0;
}

function ingredientAmountForBackend(ingredient) {
  if (ingredient.backendAmount !== undefined) {
    return Number(ingredient.backendAmount);
  }

  const amount = Number(ingredient.amount);

  if (
      ingredient.backendUnit === "Kilogram" ||
      ingredient.backendUnit === "kilogram" ||
      ingredient.backendUnit === "Liter" ||
      ingredient.backendUnit === "liter"
  ) {
    return amount / 1000;
  }

  return amount;
}

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

function ContentEditor({ refreshKey }) {
  const [activeSection, setActiveSection] = useState("products");
  const [products, setProducts] = useState([]);
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [selectedDish, setSelectedDish] = useState(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const [productsResult, suppliersResult, dishesResult, unitsResult] =
        await Promise.allSettled([
          apiRequest("/api/v1/Products"),
          apiRequest("/api/v1/Suppliers"),
          apiRequest("/api/v1/dish"),
          apiRequest("/api/v1/Products/Units"),
        ]);

    const errors = [];
    let loadedProducts = [];

    if (productsResult.status === "fulfilled") {
      loadedProducts = getList(productsResult.value).map(normalizeProduct);
      setProducts(loadedProducts);
    } else {
      setProducts([]);
      errors.push(`Продукты: ${productsResult.reason.message}`);
    }

    if (suppliersResult.status === "fulfilled") {
      setSuppliers(getList(suppliersResult.value).map(normalizeSupplier));
    } else {
      setSuppliers([]);
      errors.push(`Поставщики: ${suppliersResult.reason.message}`);
    }

    if (dishesResult.status === "fulfilled") {
      setDishes(
          getList(dishesResult.value).map((dish) =>
              normalizeDish(dish, loadedProducts),
          ),
      );
    } else {
      setDishes([]);
      errors.push(`Блюда: ${dishesResult.reason.message}`);
    }

    if (unitsResult.status === "fulfilled") {
      setUnits(getList(unitsResult.value));
    } else {
      setUnits([]);
      errors.push(`Единицы измерения: ${unitsResult.reason.message}`);
    }

    setError(errors.join(" "));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  async function addProduct(product) {
    setSaving(true);
    setError("");

    try {
      await apiRequest("/api/v1/Products/AddProduct", {
        method: "POST",
        body: JSON.stringify({
          name: product.name,
          measureUnit: product.measureUnit,
        }),
      });

      setIsAddProductOpen(false);
      await loadData();
    } catch (requestError) {
      setError(`Не удалось добавить продукт: ${requestError.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function addSupplier(supplier) {
    setSaving(true);
    setError("");

    try {
      await apiRequest("/api/v1/Suppliers/AddSupplier", {
        method: "POST",
        body: JSON.stringify({
          name: supplier.name,
          email: supplier.email,
        }),
      });

      setIsAddSupplierOpen(false);
      await loadData();
    } catch (requestError) {
      setError(`Не удалось добавить поставщика: ${requestError.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function toggleDish(dish) {
    setSaving(true);
    setError("");

    try {
      await apiRequest("/api/v1/dish/ToggleAvailability", {
        method: "POST",
        body: JSON.stringify(dish.name),
      });

      await loadData();
    } catch (requestError) {
      setError(
          `Не удалось изменить доступность блюда: ${requestError.message}`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveDish(updatedDish) {
    if (!updatedDish.ingredientsLoaded) {
      setError(
          "Сервер не вернул состав блюда. Сохранение отменено, чтобы не отправлять пустой рецепт.",
      );
      return;
    }

    const payload = {
      name: updatedDish.name,
      description: updatedDish.description,
      imageUrl: updatedDish.imageUrl,
      category: updatedDish.category,
      price: parsePrice(updatedDish.price),
      available: updatedDish.active,
      ingredients: updatedDish.ingredients.map((ingredient) => ({
        product: ingredient.name,
        count: ingredientAmountForBackend(ingredient),
      })),
    };

    setSaving(true);
    setError("");

    try {
      await apiRequest("/api/v1/dish/UpdateDish", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSelectedDish(null);
      await loadData();
    } catch (requestError) {
      setError(`Не удалось сохранить блюдо: ${requestError.message}`);
    } finally {
      setSaving(false);
    }
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

          {error && (
              <div
                  role="alert"
                  className="mb-5 rounded-xl border border-[#f0c9bc] bg-white px-4 py-3 text-[13px] text-[#a74334]"
              >
                {error}
              </div>
          )}

          {loading ? (
              <div className="text-[13px] text-[#958278]">Загрузка данных…</div>
          ) : (
              <>
                {activeSection === "products" && (
                    <ProductsSection
                        products={products}
                        onAddClick={() => setIsAddProductOpen(true)}
                    />
                )}

                {activeSection === "suppliers" && (
                    <SuppliersSection
                        suppliers={suppliers}
                        onAddClick={() => setIsAddSupplierOpen(true)}
                    />
                )}

                {activeSection === "menu" && (
                    <MenuSection
                        dishes={dishes}
                        onToggleDish={toggleDish}
                        onEditDish={setSelectedDish}
                        onAddClick={() => setIsAddDishOpen(true)}
                        disabled={saving}
                    />
                )}
              </>
          )}
        </div>

        {selectedDish && (
            <DishModal
                key={selectedDish.name}
                dish={selectedDish}
                products={products}
                saving={saving}
                onClose={() => setSelectedDish(null)}
                onSave={saveDish}
            />
        )}

        {isAddProductOpen && (
            <CreateProductModal
                units={units}
                saving={saving}
                onClose={() => setIsAddProductOpen(false)}
                onAdd={addProduct}
            />
        )}

        {isAddSupplierOpen && (
            <CreateSupplierModal
                saving={saving}
                onClose={() => setIsAddSupplierOpen(false)}
                onAdd={addSupplier}
            />
        )}

        {isAddDishOpen && (
            <CreateDishModal
                products={products}
                saving={saving}
                onClose={() => setIsAddDishOpen(false)}
                onAdd={async (dish) => {
                  setSaving(true);
                  setError("");

                  try {
                    await apiRequest("/api/v1/dish/AddDish", {
                      method: "POST",
                      body: JSON.stringify(dish),
                    });

                    setIsAddDishOpen(false);
                    await loadData();
                  } catch (requestError) {
                    setError(`Не удалось добавить блюдо: ${requestError.message}`);
                  } finally {
                    setSaving(false);
                  }
                }}
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

function ProductsSection({ products, onAddClick }) {
  return (
      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-[24px] font-extrabold tracking-[-0.04em] text-[#332d29]">
              Продукты
            </h3>

            <p className="mt-1 text-[13px] text-[#988980]">
              Все продукты, которые могут быть на складе
            </p>
          </div>

          <button
              type="button"
              onClick={onAddClick}
              className="shrink-0 rounded-full bg-[#e96d1b] px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#d95e12]"
          >
            + Добавить продукт
          </button>
        </div>

        {products.length === 0 ? (
            <p className="text-[13px] text-[#958278]">Продуктов пока нет.</p>
        ) : (
            <div className="grid grid-cols-3 gap-3">
              {products.map((product) => (
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
                  {unitTranslations[product.unit] || product.unit || "—"}
                </span>
                    </div>
                  </article>
              ))}
            </div>
        )}
      </section>
  );
}

function SuppliersSection({ suppliers, onAddClick }) {
  return (
      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-[24px] font-extrabold tracking-[-0.04em] text-[#332d29]">
              Поставщики
            </h3>

            <p className="mt-1 text-[13px] text-[#988980]">
              Поставщики продуктов и история взаимодействия с ними
            </p>
          </div>

          <button
              type="button"
              onClick={onAddClick}
              className="shrink-0 rounded-full bg-[#e96d1b] px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#d95e12]"
          >
            + Добавить поставщика
          </button>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-[#f0e2d8] bg-white shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
          <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr] gap-4 bg-[#fffaf7] px-6 py-4 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#aa9b91]">
            <div>Имя поставщика</div>
            <div>Почта</div>
            <div>Количество поставок</div>
            <div>Дата последней поставки</div>
          </div>

          {suppliers.length === 0 ? (
              <div className="border-t border-[#f3e9e2] px-6 py-5 text-[13px] text-[#85766d]">
                Поставщиков пока нет.
              </div>
          ) : (
              suppliers.map((supplier) => (
                  <div
                      key={supplier.id}
                      className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr] gap-4 border-t border-[#f3e9e2] px-6 py-5 text-[13px]"
                  >
                    <div className="font-extrabold text-[#493e38]">
                      {supplier.name}
                    </div>

                    <div className="text-[#85766d]">
                      {supplier.email || "—"}
                    </div>

                    <div className="font-bold text-[#665850]">
                      {supplier.deliveries}
                    </div>

                    <div className="text-[#85766d]">
                      {supplier.lastDelivery}
                    </div>
                  </div>
              ))
          )}
        </div>
      </section>
  );
}

function MenuSection({ dishes, onToggleDish, onEditDish, onAddClick, disabled }) {
  return (
      <section>
        <div className="mb-5">
          <h3 className="text-[24px] font-extrabold tracking-[-0.04em] text-[#332d29]">
            Меню
          </h3>

          <p className="mt-1 text-[13px] text-[#988980]">
            Управление блюдами и их составом
          </p>

          <div className="mb-5 flex justify-end">
            <button
                type="button"
                onClick={onAddClick}
                className="rounded-full bg-[#e96d1b] px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#d95e12]"
            >
              + Добавить блюдо
            </button>
          </div>

        </div>

        {dishes.length === 0 ? (
            <p className="text-[13px] text-[#958278]">Блюд в меню пока нет.</p>
        ) : (
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
                              disabled={disabled}
                              onChange={() => onToggleDish(dish)}
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
        )}
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

function DishModal({ dish, products, saving, onClose, onSave }) {
  const [ingredients, setIngredients] = useState(dish.ingredients);
  const [imageUrl, setImageUrl] = useState(dish.imageUrl);
  const [dishName, setDishName] = useState(dish.name);
  const [dishPrice, setDishPrice] = useState(dish.price);
  const [category, setCategory] = useState(dish.category);
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);

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
      name: dishName.trim(),
      price: dishPrice,
      imageUrl,
      category,
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

              <label className="mt-3 block">
              <span className="mb-2 block text-[11px] font-bold text-[#85766d]">
                Категория
              </span>

                <input
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="h-10 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] focus:border-[#eb701c] focus:outline-none"
                />
              </label>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-[20px] font-extrabold text-[#403731]">
                  Состав
                </h4>

                <button
                    type="button"
                    onClick={() => setIsAddIngredientOpen(true)}
                    className="rounded-xl bg-[#fff0df] px-3 py-2 text-[11px] font-bold text-[#d9671b] transition hover:bg-[#ffe2cb]"
                >
                  + Добавить продукт
                </button>
              </div>

              {!dish.ingredientsLoaded ? (
                  <div className="rounded-xl border border-dashed border-[#e8cdbb] bg-white p-4 text-center text-[12px] text-[#958278]">
                    Сервер не вернул состав блюда. Сохранение будет отключено.
                  </div>
              ) : ingredients.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#e8cdbb] bg-white p-4 text-center text-[12px] text-[#958278]">
                    Состав блюда пуст.
                  </div>
              ) : (
                  <div className="space-y-3">
                    {ingredients.map((ingredient, index) => (
                        <div
                            key={`${ingredient.name}-${index}`}
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
                    ))}
                  </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#f0e2d8] px-7 py-5">
            <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-[#eaded5] px-5 py-2.5 text-[13px] font-bold text-[#85766d] transition hover:bg-white disabled:opacity-50"
            >
              Отмена
            </button>

            <button
                type="button"
                onClick={saveChanges}
                disabled={saving || !dish.ingredientsLoaded || !dishName.trim()}
                className="rounded-xl bg-[#e96d1b] px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#d95e12] disabled:opacity-50"
            >
              {saving ? "Сохранение…" : "Сохранить"}
            </button>
          </div>

          {isAddIngredientOpen && (
              <AddIngredientModal
                  products={products}
                  ingredients={ingredients}
                  onClose={() => setIsAddIngredientOpen(false)}
                  onAdd={(ingredient) => {
                    setIngredients((currentIngredients) => [
                      ...currentIngredients,
                      ingredient,
                    ]);
                    setIsAddIngredientOpen(false);
                  }}
              />
          )}
        </div>
      </div>
  );
}

function AddIngredientModal({ products, ingredients, onClose, onAdd }) {
  const [selectedProductName, setSelectedProductName] = useState("");
  const [amount, setAmount] = useState("");

  const selectedProduct = products.find(
      (product) => product.name === selectedProductName,
  );

  const inputUnit =
      selectedProduct?.unit === "Kilogram" ||
      selectedProduct?.unit === "kilogram"
          ? "г"
          : selectedProduct?.unit === "Liter" ||
          selectedProduct?.unit === "liter"
              ? "мл"
              : unitTranslations[selectedProduct?.unit] || "шт.";

  function submitProduct(event) {
    event.preventDefault();

    if (!selectedProduct) {
      window.alert("Выберите продукт.");
      return;
    }

    const enteredAmount = Number(amount);

    if (!Number.isFinite(enteredAmount) || enteredAmount <= 0) {
      window.alert("Введите корректное количество.");
      return;
    }

    if (
        ingredients.some(
            (ingredient) => ingredient.name === selectedProduct.name,
        )
    ) {
      window.alert("Этот продукт уже добавлен в состав.");
      return;
    }

    const usesBaseUnit =
        selectedProduct.unit === "Kilogram" ||
        selectedProduct.unit === "kilogram" ||
        selectedProduct.unit === "Liter" ||
        selectedProduct.unit === "liter";

    onAdd({
      id: `${selectedProduct.name}-${Date.now()}`,
      name: selectedProduct.name,
      amount: String(enteredAmount),
      unit: inputUnit,
      backendAmount: usesBaseUnit ? enteredAmount / 1000 : enteredAmount,
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
                value={selectedProductName}
                onChange={(event) => setSelectedProductName(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] text-[#665850] focus:border-[#eb701c] focus:outline-none"
            >
              <option value="">Выберите продукт</option>

              {products.map((product) => (
                  <option
                      key={product.id}
                      value={product.name}
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
                step="any"
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
                disabled={!selectedProduct || !amount}
                className="rounded-xl bg-[#e96d1b] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#d95e12] disabled:opacity-50"
            >
              Добавить
            </button>
          </div>
        </form>
      </div>
  );
}

function CreateProductModal({ units, saving, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [measureUnit, setMeasureUnit] = useState(units[0] ?? "");

  useEffect(() => {
    if (!measureUnit && units.length > 0) {
      setMeasureUnit(units[0]);
    }
  }, [measureUnit, units]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim() || !measureUnit) {
      return;
    }

    await onAdd({
      name: name.trim(),
      measureUnit,
    });
  }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#332d29]/35 p-8 backdrop-blur-sm">
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-[430px] rounded-[22px] bg-[#fffaf6] p-6 shadow-[0_15px_45px_rgba(62,37,20,0.2)]"
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
            Название продукта
          </span>

            <input
                autoFocus
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] text-[#665850] focus:border-[#eb701c] focus:outline-none"
            />
          </label>

          <label className="mt-4 block">
          <span className="mb-2 block text-[12px] font-bold text-[#85766d]">
            Единица измерения
          </span>

            <select
                required
                value={measureUnit}
                onChange={(event) => setMeasureUnit(event.target.value)}
                disabled={saving || units.length === 0}
                className="h-11 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] text-[#665850] focus:border-[#eb701c] focus:outline-none disabled:bg-[#f8f3ef]"
            >
              {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unitTranslations[unit] || unit}
                  </option>
              ))}
            </select>
          </label>

          {units.length === 0 && (
              <p className="mt-2 text-[11px] text-[#a74334]">
                Список единиц измерения не получен с сервера.
              </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-[#eaded5] px-4 py-2.5 text-[12px] font-bold text-[#85766d] transition hover:bg-white disabled:opacity-50"
            >
              Отмена
            </button>

            <button
                type="submit"
                disabled={saving || !name.trim() || !measureUnit}
                className="rounded-xl bg-[#e96d1b] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#d95e12] disabled:opacity-50"
            >
              {saving ? "Сохранение…" : "Добавить"}
            </button>
          </div>
        </form>
      </div>
  );
}

function CreateSupplierModal({ saving, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim() || !email.trim()) {
      return;
    }

    await onAdd({
      name: name.trim(),
      email: email.trim(),
    });
  }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#332d29]/35 p-8 backdrop-blur-sm">
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-[430px] rounded-[22px] bg-[#fffaf6] p-6 shadow-[0_15px_45px_rgba(62,37,20,0.2)]"
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-[20px] font-extrabold text-[#332d29]">
              Добавить поставщика
            </h3>

            <button
                type="button"
                onClick={onClose}
                disabled={saving}
                aria-label="Закрыть окно"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#a39389] transition hover:bg-[#fff0df] hover:text-[#d9671b]"
            >
              <CloseIcon />
            </button>
          </div>

          <label className="block">
          <span className="mb-2 block text-[12px] font-bold text-[#85766d]">
            Имя поставщика
          </span>

            <input
                autoFocus
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] text-[#665850] focus:border-[#eb701c] focus:outline-none"
            />
          </label>

          <label className="mt-4 block">
          <span className="mb-2 block text-[12px] font-bold text-[#85766d]">
            Почта
          </span>

            <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] text-[#665850] focus:border-[#eb701c] focus:outline-none"
            />
          </label>

          <div className="mt-6 flex justify-end gap-3">
            <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-[#eaded5] px-4 py-2.5 text-[12px] font-bold text-[#85766d] transition hover:bg-white disabled:opacity-50"
            >
              Отмена
            </button>

            <button
                type="submit"
                disabled={saving || !name.trim() || !email.trim()}
                className="rounded-xl bg-[#e96d1b] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#d95e12] disabled:opacity-50"
            >
              {saving ? "Сохранение…" : "Добавить"}
            </button>
          </div>
        </form>
      </div>
  );
}

function CreateDishModal({ products, saving, onClose, onAdd }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [available, setAvailable] = useState(true);
  const [ingredients, setIngredients] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [count, setCount] = useState("");

  function addIngredient() {
    const amount = Number(count);

    if (!selectedProduct || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    setIngredients((current) => [
      ...current,
      { product: selectedProduct, count: amount },
    ]);
    setSelectedProduct("");
    setCount("");
  }

  function removeIngredient(indexToRemove) {
    setIngredients((current) =>
        current.filter((_, index) => index !== indexToRemove),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const numericPrice = Number(price);

    if (
        !name.trim() ||
        !Number.isFinite(numericPrice) ||
        numericPrice < 0
    ) {
      return;
    }

    await onAdd({
      name: name.trim(),
      description,
      imageUrl,
      category,
      price: numericPrice,
      available,
      ingredients,
    });
  }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#332d29]/35 p-8 backdrop-blur-sm">
        <form
            onSubmit={handleSubmit}
            className="max-h-[90vh] w-full max-w-[650px] overflow-y-auto rounded-[24px] bg-[#fffaf6] p-7 shadow-[0_20px_60px_rgba(62,37,20,0.2)]"
        >
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-[25px] font-extrabold tracking-[-0.04em] text-[#332d29]">
              Добавить блюдо
            </h3>

            <button
                type="button"
                onClick={onClose}
                disabled={saving}
                aria-label="Закрыть окно"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#a39389] transition hover:bg-[#ffe8d6] hover:text-[#d9671b]"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
            <span className="mb-2 block text-[11px] font-bold text-[#85766d]">
              Название
            </span>
              <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] focus:border-[#eb701c] focus:outline-none"
              />
            </label>

            <label className="block">
            <span className="mb-2 block text-[11px] font-bold text-[#85766d]">
              Цена
            </span>
              <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] focus:border-[#eb701c] focus:outline-none"
              />
            </label>

            <label className="block">
            <span className="mb-2 block text-[11px] font-bold text-[#85766d]">
              Категория
            </span>
              <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] focus:border-[#eb701c] focus:outline-none"
              />
            </label>

            <label className="block">
            <span className="mb-2 block text-[11px] font-bold text-[#85766d]">
              URL изображения
            </span>
              <input
                  type="url"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#eaded5] bg-white px-3 text-[13px] focus:border-[#eb701c] focus:outline-none"
              />
            </label>

            <label className="col-span-2 block">
            <span className="mb-2 block text-[11px] font-bold text-[#85766d]">
              Описание
            </span>
              <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-[#eaded5] bg-white px-3 py-2 text-[13px] focus:border-[#eb701c] focus:outline-none"
              />
            </label>
          </div>

          <label className="mt-4 flex items-center gap-2 text-[12px] font-bold text-[#766960]">
            <input
                type="checkbox"
                checked={available}
                onChange={(event) => setAvailable(event.target.checked)}
                className="h-4 w-4 accent-[#e96d1b]"
            />
            Блюдо доступно
          </label>

          <div className="mt-5">
            <h4 className="mb-3 text-[16px] font-extrabold text-[#403731]">
              Состав
            </h4>

            {ingredients.length > 0 && (
                <div className="mb-3 space-y-2">
                  {ingredients.map((ingredient, index) => (
                      <div
                          key={`${ingredient.product}-${index}`}
                          className="flex items-center justify-between rounded-xl border border-[#f0e2d8] bg-white px-4 py-3 text-[13px]"
                      >
                  <span className="font-bold text-[#554941]">
                    {ingredient.product}
                  </span>
                        <span className="text-[#85766d]">
                    Количество: {ingredient.count}
                  </span>
                        <button
                            type="button"
                            onClick={() => removeIngredient(index)}
                            className="text-[#d9671b]"
                        >
                          Удалить
                        </button>
                      </div>
                  ))}
                </div>
            )}

            <div className="flex gap-2">
              <select
                  value={selectedProduct}
                  onChange={(event) => setSelectedProduct(event.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-xl border border-[#eaded5] bg-white px-3 text-[13px]"
              >
                <option value="">Выберите продукт</option>
                {products.map((product) => (
                    <option key={product.id} value={product.name}>
                      {product.name}
                    </option>
                ))}
              </select>

              <input
                  type="number"
                  min="0.001"
                  step="any"
                  value={count}
                  onChange={(event) => setCount(event.target.value)}
                  placeholder="Количество"
                  className="h-10 w-32 rounded-xl border border-[#eaded5] bg-white px-3 text-[13px]"
              />

              <button
                  type="button"
                  onClick={addIngredient}
                  disabled={!selectedProduct || !count}
                  className="rounded-xl bg-[#fff0df] px-3 text-[12px] font-bold text-[#d9671b] disabled:opacity-50"
              >
                Добавить
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-[#eaded5] px-5 py-2.5 text-[13px] font-bold text-[#85766d] transition hover:bg-white"
            >
              Отмена
            </button>

            <button
                type="submit"
                disabled={saving || !name.trim() || price === ""}
                className="rounded-xl bg-[#e96d1b] px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#d95e12] disabled:opacity-50"
            >
              {saving ? "Сохранение…" : "Добавить блюдо"}
            </button>
          </div>
        </form>
      </div>
  );
}

export default ContentEditor;