import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client";

function formatDate(date) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("ru-RU");
}

function WriteOffs({ refreshKey }) {
  const [writeOffs, setWriteOffs] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadExpiredStocks() {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const response = await apiFetch(
        "/api/v1/Stock/GetExpiredStoks",
      );

      if (!response.ok) {
        throw new Error(
          `Ошибка загрузки списаний: ${response.status}`,
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "Бэкенд вернул некорректный список списаний.",
        );
      }

      setWriteOffs(data);
    } catch (requestError) {
      setWriteOffs([]);
      setError(
        requestError.message ||
          "Не удалось загрузить просроченные продукты.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadExpiredStocks();
  }, [refreshKey]);

  const filteredWriteOffs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return writeOffs;
    }

    return writeOffs.filter((writeOff) =>
      String(writeOff.productType || "")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [writeOffs, search]);

  async function confirmWriteOff(writeOff) {
    const stockId = writeOff.id;

    if (stockId === undefined || stockId === null) {
      setError(
        "У этой записи отсутствует id. Списание невозможно.",
      );
      return;
    }

    try {
      setDeletingId(stockId);
      setError("");
      setSuccess("");

      const response = await apiFetch(
        `/api/v1/Stock/WriteOffStock/${stockId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "*/*",
          },
        },
      );

      if (!response.ok) {
        const responseText = await response.text();

        throw new Error(
          responseText ||
            `Ошибка подтверждения списания: ${response.status}`,
        );
      }

      setWriteOffs((currentWriteOffs) =>
        currentWriteOffs.filter(
          (currentWriteOff) => currentWriteOff.id !== stockId,
        ),
      );

      setSuccess("Списание подтверждено.");
    } catch (requestError) {
      setError(
        requestError.message ||
          "Не удалось подтвердить списание.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#fff8f1] px-8 py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-[38px] font-extrabold tracking-[-0.06em] text-[#302a27]">
              Списания
            </h2>

            <p className="mt-2 text-[14px] text-[#958278]">
              Просроченные продукты, ожидающие списания
            </p>
          </div>

          <button
            type="button"
            onClick={loadExpiredStocks}
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

        {success && (
          <div className="mb-5 rounded-xl border border-[#b8dfb0] bg-[#e8f3e1] px-4 py-3 text-[13px] font-bold text-[#59874c]">
            {success}
          </div>
        )}

        <section className="mb-5 rounded-[20px] border border-[#f0e2d8] bg-white p-5">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по названию продукта..."
            className="h-11 w-full rounded-xl border border-[#eaded5] bg-[#fffdfb] px-4 text-[13px] placeholder:text-[#aa9d94] focus:border-[#eb701c] focus:outline-none"
          />

          <div className="mt-3 text-[12px] text-[#a09187]">
            {isLoading
              ? "Загрузка просроченных продуктов..."
              : `Найдено продуктов: ${filteredWriteOffs.length}`}
          </div>
        </section>

        <section className="overflow-hidden rounded-[20px] border border-[#f0e2d8] bg-white shadow-[0_5px_18px_rgba(120,75,40,0.04)]">
          <div className="grid grid-cols-[2fr_1fr_1.3fr_1.3fr_1.5fr] gap-4 bg-[#fffaf7] px-6 py-4 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#aa9b91]">
            <div>Продукт</div>
            <div>Количество</div>
            <div>Срок годности</div>
            <div>Статус</div>
            <div />
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-[14px] text-[#958278]">
              Загружаем данные...
            </div>
          ) : filteredWriteOffs.length === 0 ? (
            <div className="p-10 text-center text-[14px] text-[#958278]">
              Просроченные продукты не найдены.
            </div>
          ) : (
            filteredWriteOffs.map((writeOff) => {
              const isDeleting = deletingId === writeOff.id;

              return (
                <div
                  key={writeOff.id}
                  className="grid grid-cols-[2fr_1fr_1.3fr_1.3fr_1.5fr] items-center gap-4 border-t border-[#f3e9e2] px-6 py-5 text-[12px]"
                >
                  <div className="font-extrabold text-[#493e38]">
                    {writeOff.productType || "Без названия"}
                  </div>

                  <div className="text-[#665850]">
                    {writeOff.amount ?? 0}
                  </div>

                  <div className="text-[#c84d45]">
                    {formatDate(writeOff.dateExpired)}
                  </div>

                  <div>
                    <span className="inline-flex rounded-full bg-[#ffe1dd] px-3 py-1 text-[10px] font-bold text-[#c84d45]">
                      Просрочено
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => confirmWriteOff(writeOff)}
                      disabled={isDeleting}
                      className="rounded-xl bg-[#e96d1b] px-4 py-2 text-[11px] font-bold text-white transition hover:bg-[#d95e12] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting
                        ? "Списание..."
                        : "Подтвердить списание"}
                    </button>
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

export default WriteOffs;