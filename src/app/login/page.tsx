"use client";
import { signIn } from "@aws-amplify/auth";
import { useState, ReactNode } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useRouter } from "next/navigation";
import Image from "next/image";

function isAmplifyError(err: unknown): err is { message: string; name?: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as Record<string, unknown>).message === "string"
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ReactNode>("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signIn({ username: email, password });
      router.push("/");
    } catch (err: unknown) {
      if (isAmplifyError(err)) {
        const msg = err.message;
        if (
          msg.includes("User is not confirmed") ||
          msg.includes("Usuario no está confirmado")
        ) {
          setError(
            <>
              Tu cuenta no está confirmada.{" "}
              <a href="/confirm" className="underline text-indigo-400 hover:text-indigo-300">
                Confirma tu cuenta aquí
              </a>
              .
            </>
          );
        } else if (
          msg.includes("Incorrect username or password") ||
          msg.includes("contraseña incorrecta")
        ) {
          setError("Correo o contraseña incorrectos.");
        } else if (
          msg.includes("User does not exist") ||
          msg.includes("usuario no existe")
        ) {
          setError("El usuario no existe. ¿Deseas registrarte?");
        } else if (
          msg.includes("already a signed in user") ||
          msg.includes("There is already a signed in user")
        ) {
          setError("Ya tienes una sesión activa.");
          router.push("/");
        } else {
          setError(msg || "Error al iniciar sesión");
        }
      } else {
        setError("Error al iniciar sesión");
      }
    }
  };

  return (
    <>
      <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <Image
            alt="Tu empresa"
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
            width={40}
            height={40} 
            className="mx-auto h-10 w-auto"
          />
          <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">
            Inicia sesión en tu cuenta
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm/6 font-medium text-white">
                Correo electrónico
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm/6 font-medium text-white">
                  Contraseña
                </label>
                <div className="text-sm">
                  <a href="/reset-password" className="font-semibold text-indigo-400 hover:text-indigo-300">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div>
              <div className="mt-2">
                <PasswordInput
                  id="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="text-red-400">{error}</div>}

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                Iniciar sesión
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm/6 text-gray-400">
            ¿No tienes cuenta?{" "}
            <a href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
              Regístrate
            </a>
          </p>
          <p className="mt-2 text-center text-sm/6 text-gray-400">
            ¿No recibiste el código de confirmación?{" "}
            <a href="/confirm" className="font-semibold text-indigo-400 hover:text-indigo-300">
              Confirmar cuenta
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
