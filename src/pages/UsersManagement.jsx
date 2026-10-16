import { useCallback, useEffect, useState } from "react";
import { ROLE_LABELS } from "../config/permissions";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5094")
    .replace(/\/+$/, "");

function getArrayFromResponse(result, keys = []) {
    if (Array.isArray(result)) return result;
    if (!result || typeof result !== "object") return [];

    for (const key of keys) {
        if (Array.isArray(result[key])) return result[key];
    }

    if (result.data && typeof result.data === "object") {
        for (const key of keys) {
            if (Array.isArray(result.data[key])) return result.data[key];
        }
    }

    return [];
}

function normalizeRole(role) {
    const value = Array.isArray(role) ? role[0] : role;
    return typeof value === "string" ? value.trim() : "";
}

function roleLabel(role) {
    if (!role) return "Не указана";

    const normalizedRole = role.toLowerCase();

    const key = Object.keys(ROLE_LABELS).find(
        (roleKey) =>
            roleKey.toLowerCase() === normalizedRole ||
            String(ROLE_LABELS[roleKey]).trim().toLowerCase() === normalizedRole
    );

    return key ? ROLE_LABELS[key] : role;
}

async function readResponse(response) {
    const text = await response.text();

    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function getErrorMessage(result, fallback) {
    if (typeof result === "string" && result.trim()) return result;
    return result?.message || result?.title || fallback;
}

function normalizeUser(user, index) {
    return {
        id: String(
            user.id ??
            user.userId ??
            user.userID ??
            user._id ??
            `user-${index + 1}`
        ),
        name: String(user.name ?? user.username ?? "Без имени"),
        role: normalizeRole(user.role ?? user.roles),
    };
}

function normalizeRoleOption(role) {
    if (typeof role === "string") {
        return role.trim();
    }

    if (role && typeof role === "object") {
        return String(role.name ?? role.role ?? role.value ?? "").trim();
    }

    return "";
}

function UsersManagement({ authToken, currentUserName, refreshKey }) {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingUserName, setDeletingUserName] = useState("");

    const authHeaders = authToken
        ? { Authorization: `Bearer ${authToken}` }
        : {};

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/api/v1/user/getUsers`, {
                headers: authToken
                    ? { Authorization: `Bearer ${authToken}` }
                    : {},
            });

            const result = await readResponse(response);

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(result, "Не удалось загрузить пользователей.")
                );
            }

            const serverUsers = getArrayFromResponse(result, [
                "users",
                "items",
                "data",
            ]).map(normalizeUser);

            setUsers(serverUsers);
        } catch (err) {
            setError(
                err.message ||
                "Не удалось загрузить пользователей. Проверь адрес API и настройки CORS."
            );
        } finally {
            setIsLoading(false);
        }
    }, [authToken]);

    const loadRoles = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/v1/user/getRoles`, {
                headers: authToken
                    ? { Authorization: `Bearer ${authToken}` }
                    : {},
            });

            const result = await readResponse(response);

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(result, "Не удалось загрузить роли.")
                );
            }

            const serverRoles = getArrayFromResponse(result, [
                "roles",
                "items",
                "data",
            ])
                .map(normalizeRoleOption)
                .filter(Boolean);

            if (serverRoles.length > 0) {
                setRoles(serverRoles);

                setRole((currentRole) =>
                    serverRoles.includes(currentRole)
                        ? currentRole
                        : serverRoles.find((item) => item.toLowerCase() === "waiter") ??
                        serverRoles[0]
                );
            } else {
                setRoles([]);
            }
        } catch (err) {
            setError((currentError) =>
                currentError || err.message || "Не удалось загрузить роли."
            );
        }
    }, [authToken]);

    useEffect(() => {
        loadUsers();
        loadRoles();
    }, [loadUsers, loadRoles, refreshKey]);

    async function addUser(event) {
        event.preventDefault();
        setError("");

        const trimmedName = name.trim();

        if (!trimmedName) {
            setError("Введите имя пользователя.");
            return;
        }

        if (!password) {
            setError("Введите пароль для нового пользователя.");
            return;
        }

        if (!role) {
            setError("Не удалось получить список ролей.");
            return;
        }

        setIsSaving(true);

        try {
            const response = await fetch(`${API_URL}/api/v1/user/createUser`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders,
                },
                body: JSON.stringify({
                    name: trimmedName,
                    password,
                    role,
                }),
            });

            const result = await readResponse(response);

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(result, "Не удалось создать пользователя.")
                );
            }

            setName("");
            setPassword("");
            await loadUsers();
        } catch (err) {
            setError(err.message || "Не удалось создать пользователя.");
        } finally {
            setIsSaving(false);
        }
    }

    async function removeUser(user) {
        if (
            currentUserName &&
            user.name.trim().toLowerCase() === currentUserName.trim().toLowerCase()
        ) {
            setError("Нельзя удалить пользователя, под которым выполнен вход.");
            return;
        }

        const confirmed = window.confirm(
            `Удалить пользователя «${user.name}»?`
        );

        if (!confirmed) return;

        setError("");
        setDeletingUserName(user.name);

        try {
            const response = await fetch(
                `${API_URL}/api/v1/user/deleteUser/${encodeURIComponent(user.name)}`,
                {
                    method: "DELETE",
                    headers: authHeaders,
                }
            );

            const result = await readResponse(response);

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(result, "Не удалось удалить пользователя.")
                );
            }

            await loadUsers();
        } catch (err) {
            setError(err.message || "Не удалось удалить пользователя.");
        } finally {
            setDeletingUserName("");
        }
    }

    return (
        <section className="mx-auto w-full max-w-6xl p-4 sm:p-8">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-[#45372f]">
                    Панель управления пользователями
                </h1>
                <p className="mt-2 text-sm text-[#88796f]">
                    Пользователи и роли загружаются с сервера. Для нового пользователя
                    задайте имя, пароль и роль.
                </p>
            </header>

            <form
                onSubmit={addUser}
                className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#eee4dc] bg-white p-4 sm:flex-row sm:items-end"
            >
                <label className="flex-1">
          <span className="mb-1 block text-sm font-medium text-[#62534a]">
            Имя пользователя
          </span>
                    <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Например, Анна Иванова"
                        autoComplete="off"
                        required
                        className="w-full rounded-lg border border-[#e4d8cf] px-3 py-2 text-sm outline-none focus:border-[#d9671b]"
                    />
                </label>

                <label className="flex-1">
          <span className="mb-1 block text-sm font-medium text-[#62534a]">
            Пароль
          </span>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Задайте пароль"
                        autoComplete="new-password"
                        required
                        className="w-full rounded-lg border border-[#e4d8cf] px-3 py-2 text-sm outline-none focus:border-[#d9671b]"
                    />
                </label>

                <label className="sm:w-56">
          <span className="mb-1 block text-sm font-medium text-[#62534a]">
            Роль
          </span>
                    <select
                        value={role}
                        onChange={(event) => setRole(event.target.value)}
                        disabled={roles.length === 0}
                        className="w-full rounded-lg border border-[#e4d8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#d9671b] disabled:opacity-60"
                    >
                        {roles.length === 0 ? (
                            <option value="">Роли не загружены</option>
                        ) : (
                            roles.map((serverRole) => (
                                <option key={serverRole} value={serverRole}>
                                    {roleLabel(serverRole)}
                                </option>
                            ))
                        )}
                    </select>
                </label>

                <button
                    type="submit"
                    disabled={isSaving || roles.length === 0}
                    className="min-h-[38px] rounded-lg bg-[#d9671b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#bd5412] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSaving ? "Добавляем…" : "Добавить"}
                </button>
            </form>

            {error && (
                <div
                    role="alert"
                    className="mb-4 rounded-lg border border-[#f2c8c1] bg-[#fff1ef] px-4 py-3 text-sm text-[#a83f36]"
                >
                    {error}
                </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-[#eee4dc] bg-white">
                <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="bg-[#fff7f0] text-[#76675d]">
                    <tr>
                        <th className="px-4 py-3 font-semibold">ID</th>
                        <th className="px-4 py-3 font-semibold">Имя</th>
                        <th className="px-4 py-3 font-semibold">Роль</th>
                        <th className="px-4 py-3 font-semibold">Действие</th>
                    </tr>
                    </thead>

                    <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-[#88796f]">
                                Загружаем пользователей…
                            </td>
                        </tr>
                    ) : users.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-[#88796f]">
                                Пользователей пока нет.
                            </td>
                        </tr>
                    ) : (
                        users.map((user) => {
                            const isCurrentUser =
                                currentUserName &&
                                user.name.trim().toLowerCase() ===
                                currentUserName.trim().toLowerCase();

                            return (
                                <tr key={user.id} className="border-t border-[#f0e8e2]">
                                    <td className="max-w-56 break-all px-4 py-3 font-mono text-xs text-[#776960]">
                                        {user.id}
                                    </td>

                                    <td className="px-4 py-3 font-medium text-[#45372f]">
                                        {user.name}
                                        {isCurrentUser && (
                                            <span className="ml-2 text-xs text-[#a09288]">
                          (текущий)
                        </span>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 text-[#776960]">
                                        {(ROLE_LABELS[user.role] ?? roleLabel(user.role)) ||
                                            "Не указана"}
                                    </td>

                                    <td className="px-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => removeUser(user)}
                                            disabled={Boolean(isCurrentUser) || deletingUserName === user.name}
                                            className="rounded-lg px-3 py-2 text-sm font-medium text-[#bd4138] hover:bg-[#fff1ef] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            {deletingUserName === user.name
                                                ? "Удаляем…"
                                                : "Удалить"}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>

                {!isLoading && (
                    <div className="border-t border-[#f0e8e2] p-3 text-right">
                        <button
                            type="button"
                            onClick={loadUsers}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-[#8b4b2b] hover:bg-[#fff1e7]"
                        >
                            Обновить список
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}

export default UsersManagement;