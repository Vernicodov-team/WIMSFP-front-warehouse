const statistics = [
  {
    title: "Всего продуктов",
    value: "124",
    description: "позиций в ассортименте",
    icon: "▤",
    iconClass: "bg-[#fff0df] text-[#d9671b]",
  },
  {
    title: "Активных партий",
    value: "48",
    description: "партий на складе",
    icon: "▣",
    iconClass: "bg-[#fff4d8] text-[#c8881b]",
  },
  {
    title: "Скоро истекает",
    value: "12",
    description: "в ближайшие 3 дня",
    icon: "◷",
    iconClass: "bg-[#fff0c9] text-[#b8791b]",
  },
  {
    title: "Критический остаток",
    value: "7",
    description: "требуют пополнения",
    icon: "!",
    iconClass: "bg-[#ffe1dd] text-[#c84d45]",
  },
  {
    title: "Списано за месяц",
    value: "36 кг",
    description: "на 8% меньше прошлого месяца",
    icon: "↘",
    iconClass: "bg-[#e9f3e4] text-[#659251]",
  },
];

const attentionItems = [
  {
    title: "Просроченные продукты",
    value: "3 позиции",
    description: "требуют списания",
    icon: "!",
    iconClass: "bg-[#ffe1dd] text-[#c84d45]",
  },
  {
    title: "Заканчиваются скоро",
    value: "12 позиций",
    description: "срок истекает через 1–3 дня",
    icon: "◷",
    iconClass: "bg-[#fff0c9] text-[#b8791b]",
  },
  {
    title: "Нет в наличии",
    value: "7 позиций",
    description: "влияют на доступность блюд",
    icon: "—",
    iconClass: "bg-[#eee9e5] text-[#81746c]",
  },
];

const expirationProducts = [
  {
    product: "Куриное филе",
    batch: "П-1038",
    expiration: "14.10.2026",
    remaining: "1 день",
    status: "Критично",
    statusClass: "bg-[#ffe1dd] text-[#c84d45]",
  },
  {
    product: "Томаты",
    batch: "П-1039",
    expiration: "15.10.2026",
    remaining: "2 дня",
    status: "Скоро",
    statusClass: "bg-[#fff0c9] text-[#b8791b]",
  },
  {
    product: "Сливки 20%",
    batch: "П-1037",
    expiration: "16.10.2026",
    remaining: "3 дня",
    status: "Скоро",
    statusClass: "bg-[#fff0c9] text-[#b8791b]",
  },
  {
    product: "Моцарелла",
    batch: "П-1031",
    expiration: "12.10.2026",
    remaining: "Просрочено",
    status: "Просрочено",
    statusClass: "bg-[#ffe1dd] text-[#c84d45]",
  },
];

function Dashboard({ onNavigate }) {
  return (
    <main className="min-h-screen bg-[#fff8f1] px-8 py-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-[38px] font-extrabold tracking-[-0.06em] text-[#302a27]">
              Склад сегодня
            </h2>

            <p className="mt-2 text-[14px] text-[#958278]">
              Краткая сводка по остаткам, партиям и срокам годности
            </p>
          </div>

          <div className="pb-1 text-[13px] text-[#ad9b90]">
            Вторник, 13 октября 2026
          </div>
        </header>

        <section className="mb-8">
          <h3 className="mb-4 text-[23px] font-extrabold tracking-[-0.04em] text-[#332d29]">
            Общая статистика
          </h3>

          <div className="grid grid-cols-3 gap-4">
            {statistics.map((statistic) => (
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

                <div className="text-[30px] font-extrabold tracking-[-0.06em] text-[#3a322d]">
                  {statistic.value}
                </div>

                <div className="mt-1 text-[12px] text-[#a39389]">
                  {statistic.description}
                </div>
              </article>
            ))}
          </div>
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

          <div className="grid grid-cols-3 gap-4">
            {attentionItems.map((item) => (
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
          <div className="flex items-center justify-between border-b border-[#f3e8e0] px-6 py-5">
            <div>
              <h3 className="text-[22px] font-extrabold tracking-[-0.04em] text-[#332d29]">
                Ближайшие сроки годности
              </h3>

              <p className="mt-1 text-[13px] text-[#a09187]">
                Продукты, которым нужно уделить внимание в первую очередь
              </p>
            </div>

            <button
                type="button"
                onClick={() => onNavigate("Список продуктов")}
                className="rounded-full bg-[#fff0df] px-4 py-2 text-[11px] font-bold text-[#d9671b] transition hover:bg-[#ffe2cb]"
                >
                Все продукты
            </button>
          </div>

          <div className="grid grid-cols-[1.5fr_0.8fr_1fr_0.8fr_0.9fr] gap-3 bg-[#fffaf7] px-6 py-3 text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#aa9b91]">
            <div>Продукт</div>
            <div>Партия</div>
            <div>Срок годности</div>
            <div>Осталось</div>
            <div>Статус</div>
          </div>

          {expirationProducts.map((product) => (
            <div
              key={product.product}
              className="grid grid-cols-[1.5fr_0.8fr_1fr_0.8fr_0.9fr] items-center gap-3 border-t border-[#f4ebe5] px-6 py-4 text-[12px]"
            >
              <div className="font-bold text-[#493e38]">
                {product.product}
              </div>

              <div className="text-[#85766d]">{product.batch}</div>

              <div className="text-[#85766d]">{product.expiration}</div>

              <div className="font-bold text-[#665850]">
                {product.remaining}
              </div>

              <div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${product.statusClass}`}
                >
                  {product.status}
                </span>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

export default Dashboard;