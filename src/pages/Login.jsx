import { useState } from "react";

export default function Login({ onSuccess }) {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");

    function handleSubmit(event) {
        event.preventDefault();

        if (!name.trim() || !password) {
            return;
        }

        // Демонстрационный вход: данные пока не проверяются сервером.
        onSuccess(name.trim());
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f8f5f2] px-4 text-[#45372f]">
            <section className="w-full max-w-md rounded-2xl border border-[#eee4dc] bg-white p-8 shadow-sm sm:p-10">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100">
                            <img src="/warehouse.svg" alt="Склад" className="h-8 w-8" />
                        </div>
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

                    <button
                        type="submit"
                        className="w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white transition hover:bg-orange-600"
                    >
                        Войти
                    </button>

                    <p className="text-center text-xs text-[#97877c]">
                        Демонстрационный вход: подойдут любые непустые имя и пароль.
                    </p>
                </form>
            </section>
        </main>
    );
}