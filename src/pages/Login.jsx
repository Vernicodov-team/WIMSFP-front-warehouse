import { useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5094")
    .replace(/\/+$/, "");

function getRoleFromClaims(payload) {
    return (
        payload.role ??
        payload.roles ??
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
        payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"] ??
        null
    );
}

function decodeToken(token) {
    try {
        const payloadPart = token.split(".")[1];
        if (!payloadPart) return {};

        const base64 = payloadPart
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");

        const binary = atob(base64);
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

        return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
        return {};
    }
}

export default function Login({ onSuccess }) {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/v1/user/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    password,
                }),
            });

            const responseText = await response.text();
            let result = null;

            try {
                result = responseText ? JSON.parse(responseText) : null;
            } catch {
                result = responseText;
            }

            if (!response.ok) {
                const message =
                    typeof result === "string"
                        ? result
                        : result?.message || result?.title;

                throw new Error(message || "Неверное имя пользователя или пароль.");
            }

            const responseData =
                typeof result === "object" && result !== null
                    ? result.data ?? result
                    : result;

            let token =
                typeof responseData === "string"
                    ? responseData
                    : responseData?.token ??
                    responseData?.accessToken ??
                    responseData?.access_token ??
                    responseData?.jwtToken;

            if (typeof token === "string") {
                token = token.replace(/^Bearer\s+/i, "").trim();
            }

            if (!token) {
                throw new Error(
                    "Вход выполнен, но сервер не вернул токен. Проверьте формат ответа login."
                );
            }

            const claims = decodeToken(token);
            const serverUser = responseData?.user ?? responseData;

            const role =
                serverUser?.role ??
                serverUser?.roles ??
                getRoleFromClaims(claims);

            const serverName =
                serverUser?.name ??
                serverUser?.username ??
                claims.name ??
                claims.unique_name ??
                claims.preferred_username ??
                name.trim();

            onSuccess({
                token,
                user: {
                    name: serverName,
                    role: Array.isArray(role) ? role[0] : role,
                },
            });
        } catch (err) {
            setError(
                err.message ||
                "Не удалось подключиться к серверу. Проверьте, запущен ли бэкенд."
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f8f5f2] px-4 text-[#45372f]">
            <section className="w-full max-w-md rounded-2xl border border-[#eee4dc] bg-white p-8 shadow-sm sm:p-10">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100">
                        <img src="/warehouse.svg" alt="Склад" className="h-8 w-8" />
                    </div>

                    <h1 className="text-2xl font-bold">Складской модуль</h1>
                    <p className="mt-2 text-sm text-[#776960]">
                        Войдите, чтобы продолжить
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="login-name"
                            className="mb-2 block text-sm font-medium"
                        >
                            Имя пользователя
                        </label>
                        <input
                            id="login-name"
                            name="name"
                            type="text"
                            autoComplete="username"
                            required
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Введите имя пользователя"
                            className="w-full rounded-xl border border-[#e6ddd5] px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="login-password"
                            className="mb-2 block text-sm font-medium"
                        >
                            Пароль
                        </label>
                        <input
                            id="login-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Введите пароль"
                            className="w-full rounded-xl border border-[#e6ddd5] px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoading ? "Входим…" : "Войти"}
                    </button>
                </form>
            </section>
        </main>
    );
}