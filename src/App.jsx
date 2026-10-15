import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import DeliveriesHistory from "./pages/DeliveriesHistory";
import Warehouse from "./pages/Warehouse";
import ContentEditor from "./pages/ContentEditor";
import OrdersHistory from "./pages/OrdersHistory";
import UsersManagement from "./pages/UsersManagement";
import { PAGE_ACCESS, ROLE_LABELS } from "./config/permissions";

const USERS_STORAGE_KEY = "warehouse.users";
const ACTIVE_USER_STORAGE_KEY = "warehouse.activeUserId";

const INITIAL_USERS = [
  {
    id: "USR-0001",
    name: "Администратор",
    role: "admin",
  },
];

function readUsers() {
  try {
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);

    if (!savedUsers) {
      return INITIAL_USERS;
    }

    const parsedUsers = JSON.parse(savedUsers);

    if (!Array.isArray(parsedUsers)) {
      return INITIAL_USERS;
    }

    const validUsers = parsedUsers.filter(
        (user) =>
            user &&
            typeof user.id === "string" &&
            typeof user.name === "string" &&
            ROLE_LABELS[user.role]
    );

    return validUsers.length > 0 ? validUsers : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
}

function readActiveUserId(users) {
  try {
    const savedId = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);

    if (users.some((user) => user.id === savedId)) {
      return savedId;
    }
  } catch {
    // Если localStorage недоступен, используем первого пользователя.
  }

  return users[0]?.id ?? INITIAL_USERS[0].id;
}

function App() {
  const [users, setUsers] = useState(readUsers);
  const [activeUserId, setActiveUserId] = useState(() =>
      readActiveUserId(readUsers())
  );
  const [activePage, setActivePage] = useState("Главная");

  const currentUser =
      users.find((user) => user.id === activeUserId) ?? users[0] ?? INITIAL_USERS[0];

  const visiblePages = PAGE_ACCESS[currentUser.role] ?? ["Главная"];
  const pageIsAllowed = visiblePages.includes(activePage);
  const displayedPage = pageIsAllowed ? activePage : visiblePages[0] ?? "Главная";

  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // Приложение продолжит работать до перезагрузки страницы.
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, currentUser.id);
    } catch {
      // Переключение пользователя продолжит работать в текущей сессии.
    }
  }, [currentUser.id]);

  function renderPage() {
    if (!visiblePages.includes(displayedPage)) {
      return (
          <div className="m-6 rounded-xl bg-white p-6 text-[#776960]">
            У вас нет доступа к этому разделу.
          </div>
      );
    }

    switch (displayedPage) {
      case "Главная":
        return <Dashboard />;

      case "История поставок":
        return <DeliveriesHistory />;

      case "Склад":
        return <Warehouse />;

      case "История заказов":
        return <OrdersHistory />;

      case "Редактор содержимого":
        return <ContentEditor />;

      case "Панель управления пользователями":
        if (currentUser.role !== "admin") {
          return (
              <div className="m-6 rounded-xl bg-white p-6 text-[#776960]">
                У вас нет доступа к панели управления пользователями.
              </div>
          );
        }

        return (
            <UsersManagement
                users={users}
                onUsersChange={setUsers}
                currentUserId={currentUser.id}
            />
        );

      case "Ввод поставок":
        return (
            <section className="m-4 rounded-2xl border border-[#eee4dc] bg-white p-6 sm:m-8">
              <h1 className="text-2xl font-bold text-[#45372f]">Ввод поставок</h1>
              <p className="mt-2 text-sm text-[#88796f]">
                Страница будет добавлена следующим этапом.
              </p>
            </section>
        );

      default:
        return (
            <section className="m-4 rounded-2xl border border-[#eee4dc] bg-white p-6 sm:m-8">
              <h1 className="text-2xl font-bold text-[#45372f]">
                Раздел панели управления
              </h1>
              <p className="mt-2 text-[#776960]">{displayedPage}</p>
            </section>
        );
    }
  }

  function handleActiveUserChange(event) {
    const nextUserId = event.target.value;
    const nextUser = users.find((user) => user.id === nextUserId);

    if (!nextUser) {
      return;
    }

    setActiveUserId(nextUserId);

    const nextPages = PAGE_ACCESS[nextUser.role] ?? ["Главная"];

    if (!nextPages.includes(activePage)) {
      setActivePage(nextPages[0] ?? "Главная");
    }
  }

  return (
      <div className="min-h-screen bg-[#f8f5f2] text-[#45372f] md:flex">
        <Sidebar
            activePage={displayedPage}
            onPageChange={setActivePage}
            visiblePages={visiblePages}
        />

        <div className="min-w-0 flex-1">

          <main>{renderPage()}</main>
        </div>
      </div>
  );
}

export default App;