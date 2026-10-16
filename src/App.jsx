import { useCallback, useEffect, useState } from "react";
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
import useDashboardSignalR from "./hooks/useDashboardSignalR";
import { PAGE_ACCESS, ROLE_LABELS } from "./config/permissions";

const USERS_STORAGE_KEY = "warehouse.users";
const ACTIVE_USER_STORAGE_KEY = "warehouse.activeUserId";
const AUTH_TOKEN_KEY = "warehouse.authToken";
const AUTH_USER_KEY = "warehouse.authUser";

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
        ROLE_LABELS[user.role],
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

function readStoredAuthUser() {
  try {
    const savedUser = localStorage.getItem(AUTH_USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch {
    return null;
  }
}

function findRoleKey(role) {
  if (typeof role !== "string") {
    return null;
  }

  const normalizedRole = role.trim().toLowerCase();

  return (
    Object.keys(PAGE_ACCESS).find(
      (key) =>
        key.toLowerCase() === normalizedRole ||
        String(ROLE_LABELS[key] ?? "").trim().toLowerCase() === normalizedRole,
    ) ?? null
  );
}

function App() {
  const [users, setUsers] = useState(readUsers);
  const [activeUserId, setActiveUserId] = useState(() =>
    readActiveUserId(readUsers()),
  );
  const [activePage, setActivePage] = useState("Главная");
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [notification, setNotification] = useState("");
  const [authToken, setAuthToken] = useState(
    () => localStorage.getItem(AUTH_TOKEN_KEY) || "",
  );
  const [authenticatedUser, setAuthenticatedUser] =
    useState(readStoredAuthUser);

  const storedUser =
    users.find((user) => user.id === activeUserId) ??
    users[0] ??
    INITIAL_USERS[0];
  const currentUser = {
    ...storedUser,
    name: authenticatedUser?.name || storedUser.name,
    role: findRoleKey(authenticatedUser?.role) || storedUser.role,
  };

  const serverRoleKey = findRoleKey(authenticatedUser?.role);
  const hasServerRole = Boolean(authenticatedUser?.role);
  const effectiveRole = hasServerRole ? serverRoleKey : currentUser.role;
  const visiblePages = hasServerRole
    ? serverRoleKey
      ? PAGE_ACCESS[serverRoleKey] ?? []
      : []
    : PAGE_ACCESS[currentUser.role] ?? ["Главная"];
  const displayedPage = visiblePages.includes(activePage)
    ? activePage
    : (visiblePages[0] ?? "");

  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // Пользовательские настройки останутся доступны до обновления страницы.
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, currentUser.id);
    } catch {
      // Выбранный пользователь останется активным в текущей сессии.
    }
  }, [currentUser.id]);

  const handleDataChanged = useCallback(() => {
    setDataRefreshKey((currentKey) => currentKey + 1);
  }, []);

  const handleNotification = useCallback((message) => {
    setNotification(message || "Данные обновлены.");
    window.setTimeout(() => setNotification(""), 4000);
  }, []);

  useDashboardSignalR({
    onDataChanged: handleDataChanged,
    onNotification: handleNotification,
  });

  function handleLogin({ token, user }) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

    setAuthToken(token);
    setAuthenticatedUser(user);

    const roleKey = findRoleKey(user?.role);
    const allowedPages = PAGE_ACCESS[roleKey] ?? [];
    if (!allowedPages.includes(activePage)) {
      setActivePage(allowedPages[0] ?? "");
    }
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setAuthToken("");
    setAuthenticatedUser(null);
  }

  function handleDeliveryCreated() {
    setDataRefreshKey((currentKey) => currentKey + 1);
    setActivePage("История поставок");
  }

  function renderPage() {
    switch (displayedPage) {
      case "Главная":
        return null;
      case "История поставок":
        return <DeliveriesHistory refreshKey={dataRefreshKey} />;
      case "Списания":
        return <WriteOffs refreshKey={dataRefreshKey} />;
      case "Склад":
        return <Warehouse refreshKey={dataRefreshKey} />;
      case "История заказов":
        return <OrdersHistory refreshKey={dataRefreshKey} />;
      case "Редактор содержимого":
        return <ContentEditor refreshKey={dataRefreshKey} />;
      case "Ввод поставок":
        return <SupplyInput onAddDelivery={handleDeliveryCreated} />;
      case "Панель управления пользователями":
        if (effectiveRole !== "admin") {
          return (
            <div className="m-6 rounded-xl bg-white p-6 text-[#776960] sm:m-8">
              У вас нет доступа к панели управления пользователями.
            </div>
          );
        }

        return (
          <UsersManagement
            authToken={authToken}
            currentUserName={authenticatedUser?.name}
            refreshKey={dataRefreshKey}
          />
        );
      default:
        return (
          <section className="m-6 rounded-2xl border border-[#eee4dc] bg-white p-6 sm:m-8">
            <h1 className="text-2xl font-bold text-[#45372f]">
              {displayedPage
                ? "Раздел панели управления"
                : "Нет доступных разделов"}
            </h1>
            {displayedPage && (
              <p className="mt-2 text-[#776960]">{displayedPage}</p>
            )}
          </section>
        );
    }
  }

  if (!authToken) {
    return <Login onSuccess={handleLogin} />;
  }

  const userName = authenticatedUser?.name || currentUser.name;
  const userRole = authenticatedUser?.role
    ? ROLE_LABELS[serverRoleKey] ?? authenticatedUser.role
    : ROLE_LABELS[currentUser.role] ?? currentUser.role;

  return (
    <div className="min-h-screen bg-[#f8f5f2] text-[#45372f] md:flex">
      {notification && (
        <div className="fixed right-6 top-6 z-[100] max-w-[360px] rounded-2xl border border-[#b8dfb0] bg-[#e8f3e1] px-5 py-4 text-[13px] font-bold text-[#59874c] shadow-lg">
          {notification}
        </div>
      )}

      <Sidebar
        activePage={displayedPage}
        onPageChange={setActivePage}
        visiblePages={visiblePages}
        currentUser={currentUser}
        userName={userName}
        userRole={userRole}
        onLogout={handleLogout}
      />

      <div className="min-w-0 flex-1 md:ml-64">
        <main>
          <div className={displayedPage === "Главная" ? "" : "hidden"}>
            <Dashboard refreshKey={dataRefreshKey} />
          </div>
          {displayedPage !== "Главная" && renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
