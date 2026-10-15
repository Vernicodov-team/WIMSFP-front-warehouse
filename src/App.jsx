import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import DeliveriesHistory from "./pages/DeliveriesHistory";
import Warehouse from "./pages/Warehouse";
import ContentEditor from "./pages/ContentEditor";
import OrdersHistory from "./pages/OrdersHistory";
import UsersManagement from "./pages/UsersManagement";
import { PAGE_ACCESS, ROLE_LABELS } from "./config/permissions";
import Login from "./pages/Login";

const USERS_STORAGE_KEY = "warehouse.users";
const ACTIVE_USER_STORAGE_KEY = "warehouse.activeUserId";

const INITIAL_USERS = [
  {
    id: "USR-0001",
    name: "Администратор",
    role: "admin",
  },
];

function readRoleFromToken(token) {
  if (!token) return null;

  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;

    const base64 = payloadPart
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");

    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));

    const roleClaim =
        payload.role ??
        payload.roles ??
        payload[
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
            ] ??
        payload[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"
            ];

    return Array.isArray(roleClaim) ? roleClaim[0] : roleClaim;
  } catch {
    return null;
  }
}

function resolveRoleKey(role) {
  if (typeof role !== "string") return null;

  const normalizedRole = role.trim().toLowerCase();

  return (
      Object.keys(PAGE_ACCESS).find(
          (key) =>
              key.toLowerCase() === normalizedRole ||
              String(ROLE_LABELS[key] ?? "").trim().toLowerCase() === normalizedRole
      ) ?? null
  );
}

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
  const [authToken, setAuthToken] = useState(() =>
      localStorage.getItem("warehouse.authToken")
  );

  function handleLogin(token) {
    localStorage.setItem("warehouse.authToken", token);
    setAuthToken(token);
  }

  function handleLogout() {
    localStorage.removeItem("warehouse.authToken");
    setAuthToken(null);
  }

  const currentUser =
      users.find((user) => user.id === activeUserId) ??
      users[0] ??
      INITIAL_USERS[0];

  const backendRole = readRoleFromToken(authToken);
  const accessRole = resolveRoleKey(backendRole);
  const visiblePages = accessRole ? PAGE_ACCESS[accessRole] ?? [] : [];
  const pageIsAllowed = visiblePages.includes(activePage);
  const displayedPage = pageIsAllowed
      ? activePage
      : visiblePages[0] ?? "Главная";

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
        if (accessRole !== "admin") {
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
              <h1 className="text-2xl font-bold text-[#45372f]">
                Ввод поставок
              </h1>
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

  if (!authToken) {
    return <Login onSuccess={handleLogin} />;
  }

  return (
      <div className="min-h-screen bg-[#f8f5f2] text-[#45372f] md:flex">
        <Sidebar
            activePage={displayedPage}
            onPageChange={setActivePage}
            visiblePages={visiblePages}
            onLogout={handleLogout}
            userName={currentUser.name}
            userRole={ROLE_LABELS[currentUser.role]}
        />

        <div className="min-w-0 flex-1 md:ml-64">
          <main>{renderPage()}</main>
        </div>
      </div>
  );
}

export default App;