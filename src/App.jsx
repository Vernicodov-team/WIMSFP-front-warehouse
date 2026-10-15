import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import DeliveriesHistory from "./pages/DeliveriesHistory";
import Warehouse from "./pages/Warehouse";
import ContentEditor from "./pages/ContentEditor";
import OrdersHistory from "./pages/OrdersHistory";
import UsersManagement from "./pages/UsersManagement";
import SupplyInput from "./pages/SupplyInput";
import WriteOffs from "./pages/WriteOffs";
import Login from "./pages/Login";
import { PAGE_ACCESS, ROLE_LABELS } from "./config/permissions";

const USERS_STORAGE_KEY = "warehouse.users";
const ACTIVE_USER_STORAGE_KEY = "warehouse.activeUserId";
const AUTH_STORAGE_KEY = "warehouse.authenticated";
const AUTH_USER_NAME_KEY = "warehouse.authUserName";

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
    // Используем первого пользователя.
  }

  return users[0]?.id ?? INITIAL_USERS[0].id;
}

function App() {
  const [users, setUsers] = useState(readUsers);

  const [activeUserId, setActiveUserId] = useState(() =>
      readActiveUserId(readUsers())
  );

  const [activePage, setActivePage] = useState("Главная");
  const [deliveriesRefreshKey, setDeliveriesRefreshKey] = useState(0);

  const [isAuthenticated, setIsAuthenticated] = useState(
      () => localStorage.getItem(AUTH_STORAGE_KEY) === "true"
  );

  const [authenticatedUserName, setAuthenticatedUserName] = useState(
      () => localStorage.getItem(AUTH_USER_NAME_KEY) || ""
  );

  const currentUser =
      users.find((user) => user.id === activeUserId) ??
      users[0] ??
      INITIAL_USERS[0];

  const visiblePages = PAGE_ACCESS[currentUser.role] ?? ["Главная"];

  const displayedPage = visiblePages.includes(activePage)
      ? activePage
      : visiblePages[0] ?? "Главная";

  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // Работа продолжается до обновления страницы.
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, currentUser.id);
    } catch {
      // Выбранный пользователь сохранится только в текущей сессии.
    }
  }, [currentUser.id]);

  function handleLogin(userName) {
    localStorage.setItem(AUTH_STORAGE_KEY, "true");
    localStorage.setItem(AUTH_USER_NAME_KEY, userName);

    setAuthenticatedUserName(userName);
    setIsAuthenticated(true);
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_NAME_KEY);

    setAuthenticatedUserName("");
    setIsAuthenticated(false);
  }

  function handleDeliveryCreated() {
    setDeliveriesRefreshKey((currentKey) => currentKey + 1);
    setActivePage("История поставок");
  }

  function renderPage() {
    switch (displayedPage) {
      case "Главная":
        return <Dashboard />;

      case "История поставок":
        return <DeliveriesHistory refreshKey={deliveriesRefreshKey} />;

      case "Списания":
        return <WriteOffs />;

      case "Склад":
        return <Warehouse />;

      case "История заказов":
        return <OrdersHistory />;

      case "Редактор содержимого":
        return <ContentEditor />;

      case "Ввод поставок":
        return <SupplyInput onAddDelivery={handleDeliveryCreated} />;

      case "Панель управления пользователями":
        if (currentUser.role !== "admin") {
          return (
              <div className="m-6 rounded-xl bg-white p-6 text-[#776960] sm:m-8">
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

      default:
        return (
            <section className="m-6 rounded-2xl border border-[#eee4dc] bg-white p-6 sm:m-8">
              <h1 className="text-2xl font-bold text-[#45372f]">
                Раздел панели управления
              </h1>
              <p className="mt-2 text-[#776960]">{displayedPage}</p>
            </section>
        );
    }
  }

  if (!isAuthenticated) {
    return <Login onSuccess={handleLogin} />;
  }

  return (
      <div className="min-h-screen bg-[#f8f5f2] text-[#45372f] md:flex">
        <Sidebar
            activePage={displayedPage}
            onPageChange={setActivePage}
            visiblePages={visiblePages}
            currentUser={currentUser}
            userName={authenticatedUserName || currentUser.name}
            userRole={ROLE_LABELS[currentUser.role] ?? currentUser.role}
            onLogout={handleLogout}
        />

        <div className="min-w-0 flex-1 md:ml-64">
          <main>{renderPage()}</main>
        </div>
      </div>
  );
}

export default App;