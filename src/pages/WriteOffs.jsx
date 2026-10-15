import { useMemo, useState } from "react";

const initialWriteOffs = [
  {
    id: 1,
    product: "Моцарелла",
    quantity: 8,
    unit: "кг",
    expirationDate: "2026-10-12T00:00:00",
    status: "Expired",
  },
  {
    id: 2,
    product: "Базилик",
    quantity: 5,
    unit: "кг",
    expirationDate: "2026-10-08T00:00:00",
    status: "Expired",
  },
  {
    id: 3,
    product: "Сливки 20%",
    quantity: 3,
    unit: "л",
    expirationDate: "2026-10-10T00:00:00",
    status: "Expired",
  },
];

const expiredStatus = {
  label: "Просрочено",
  className: "bg-[#ffe1dd] text-[#c84d45]",
};

function formatDate(date) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("ru-RU");
}

function WriteOffs() {
  const [writeOffs, setWriteOffs] = useState(initialWriteOffs);
  const [search, setSearch] = useState("");

  const filteredWriteOffs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return writeOffs;
    }

    return writeOffs.filter((writeOff) =>
      writeOff.product.toLowerCase().includes(normalizedSearch),
    );
  }, [writeOffs, search]);

  function confirmWriteOff(writeOffId) {
    setWriteOffs((currentWriteOffs) =>
      currentWriteOffs.filter(
        (writeOff) => writeOff.id !== writeOffId,
      ),
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8f1] px-8 py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8">
          <h2 className="text-[38px] font-extrabold tracking-[-0.06em] text-[#302a27]">
            Списания
          </h2>

          <p className="mt-2 text-[14px] text-[#958278]">
            Просроченные продукты, ожидающие списания
          </p>
        </header>

        <section className="mb-5 rounded-[20px] border border-[#f0e2d8] bg-white p-5">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по названию продукта..."
            className="h-11 w-full rounded-xl border border-[#eaded5] bg-[#fffdfb] px-4 text-[13px] placeholder:text-[#aa9d94] focus:border-[#eb701c] focus:outline-none"
          />

          <div className="mt-3 text-[12px] text-[#a09187]">
            Найдено продуктов: {filteredWriteOffs.length}
          </div>
        </section>

        <section className="overflow-hidden rounded-[20px] border border-[#f0e2d8] bg-white shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
          <div className="grid grid-cols-[2fr_1fr_1.2fr_1.2fr_1.5fr] gap-4 bg-[#fffaf7] px-6 py-4 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#aa9b91]">
            <div>Продукт</div>
            <div>Количество</div>
            <div>Срок годности</div>
            <div>Статус</div>
            <div />
          </div>

          {filteredWriteOffs.length === 0 ? (
            <div className="p-10 text-center text-[14px] text-[#958278]">
              Просроченные продукты не найдены.
            </div>
          ) : (
            filteredWriteOffs.map((writeOff) => (
              <div
                key={writeOff.id}
                className="grid grid-cols-[2fr_1fr_1.2fr_1.2fr_1.5fr] items-center gap-4 border-t border-[#f3e9e2] px-6 py-5 text-[12px]"
              >
                <div className="font-extrabold text-[#493e38]">
                  {writeOff.product}
                </div>

                <div className="text-[#665850]">
                  {writeOff.quantity} {writeOff.unit}
                </div>

                <div className="text-[#c84d45]">
                  {formatDate(writeOff.expirationDate)}
                </div>

                <div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${expiredStatus.className}`}
                  >
                    {expiredStatus.label}
                  </span>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => confirmWriteOff(writeOff.id)}
                    className="rounded-xl bg-[#e96d1b] px-4 py-2 text-[11px] font-bold text-white transition hover:bg-[#d95e12]"
                  >
                    Подтвердить списание
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

export default WriteOffs;