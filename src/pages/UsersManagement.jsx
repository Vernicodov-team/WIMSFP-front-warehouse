import { useState } from "react";
import { ROLE_LABELS } from "../config/permissions";

function createUserId(users) {
    const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

    for (let attempt = 0; attempt < 10; attempt += 1) {
        let code = "";

        if (globalThis.crypto?.getRandomValues) {
            const randomBytes = new Uint8Array(6);
            globalThis.crypto.getRandomValues(randomBytes);

            code = Array.from(randomBytes, (byte) => alphabet[byte & 31]).join("");
        } else {
            code = Array.from(
                { length: 6 },
                () => alphabet[Math.floor(Math.random() * alphabet.length)]
            ).join("");
        }

        const id = `USR-${code}`;

        if (!users.some((user) => user.id === id)) {
            return id;
        }
    }

    return `USR-${Date.now().toString(36).toUpperCase()}`;
}

function UsersManagement({
                             users,
                             onUsersChange,
                             currentUserId,
                         }) {
    const [name, setName] = useState("");
    const [role, setRole] = useState("waiter");
    const [error, setError] = useState("");

    function addUser(event) {
        event.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            setError("Введите имя пользователя.");
            return;
        }

        const newUser = {
            id: createUserId(users),
            name: trimmedName,
            role,
        };

        onUsersChange([...users, newUser]);
        setName("");
        setRole("waiter");
        setError("");
    }

    function changeRole(userId, newRole) {
        const targetUser = users.find((user) => user.id === userId);

        if (
            targetUser?.role === "admin" &&
            newRole !== "admin" &&
            users.filter((user) => user.role === "admin").length <= 1
        ) {
            setError("В системе должен оставаться хотя бы один администратор.");
            return;
        }

        onUsersChange(
            users.map((user) =>
                user.id === userId ? { ...user, role: newRole } : user
            )
        );
        setError("");
    }

    function removeUser(userId) {
        if (userId === currentUserId) {
            setError("Нельзя удалить текущего пользователя.");
            return;
        }

        const targetUser = users.find((user) => user.id === userId);

        if (
            targetUser?.role === "admin" &&
            users.filter((user) => user.role === "admin").length <= 1
        ) {
            setError("Нельзя удалить последнего администратора.");
            return;
        }

        onUsersChange(users.filter((user) => user.id !== userId));
        setError("");
    }

    return (
        <section className="mx-auto w-full max-w-6xl p-4 sm:p-8">
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-[#45372f]">
                    Панель управления пользователями
                </h1>
                <p className="mt-2 text-sm text-[#88796f]">
                    Добавляйте пользователей и назначайте им роли, определяющие доступные
                    разделы.
                </p>
            </header>

            <form
                onSubmit={addUser}
                className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#eee4dc] bg-white p-4 sm:flex-row"
            >
                <label className="flex-1">
          <span className="mb-1 block text-sm font-medium text-[#62534a]">
            Имя пользователя
          </span>
                    <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Например, Анна Иванова"
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
                        className="w-full rounded-lg border border-[#e4d8cf] bg-white px-3 py-2 text-sm outline-none focus:border-[#d9671b]"
                    >
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="flex items-end">
                    <button
                        type="submit"
                        className="min-h-[38px] rounded-lg bg-[#d9671b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#bd5412]"
                    >
                        Добавить
                    </button>
                </div>
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
                    {users.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-[#88796f]">
                                Пользователей пока нет.
                            </td>
                        </tr>
                    ) : (
                        users.map((user) => (
                            <tr key={user.id} className="border-t border-[#f0e8e2]">
                                <td className="max-w-56 break-all px-4 py-3 font-mono text-xs text-[#776960]">
                                    {user.id}
                                </td>
                                <td className="px-4 py-3 font-medium text-[#45372f]">
                                    {user.name}
                                    {user.id === currentUserId && (
                                        <span className="ml-2 text-xs text-[#a09288]">
                        (текущий)
                      </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <select
                                        aria-label={`Роль пользователя ${user.name}`}
                                        value={user.role}
                                        onChange={(event) =>
                                            changeRole(user.id, event.target.value)
                                        }
                                        className="rounded-lg border border-[#e4d8cf] bg-white px-3 py-2 text-sm"
                                    >
                                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => removeUser(user.id)}
                                        disabled={user.id === currentUserId}
                                        className="rounded-lg px-3 py-2 text-sm font-medium text-[#bd4138] hover:bg-[#fff1ef] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default UsersManagement;