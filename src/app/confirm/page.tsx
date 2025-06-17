"use client";
import { confirmSignUp, resendSignUpCode } from "@aws-amplify/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ConfirmPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resent, setResent] = useState(false);
  const router = useRouter();

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      setSuccess("¡Cuenta confirmada! Redirigiendo al inicio de sesión...");
      setTimeout(() => {
        router.push("/login");
      }, 2000); // Espera 2 segundos antes de redirigir
    } catch (err: unknown) {
      const errorMessage =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: string }).message)
          : "";
      if (
        errorMessage.includes("Current status is CONFIRMED") ||
        errorMessage.includes("User cannot be confirmed")
      ) {
        setError("Este usuario ya está confirmado. Redirigiendo al inicio de sesión...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else if (
        errorMessage.includes("Invalid code provided") ||
        errorMessage.includes("Código inválido")
      ) {
        setError("El código ingresado no es válido. Por favor, solicita un nuevo código e inténtalo de nuevo.");
      } else {
        setError(errorMessage || "Error al confirmar usuario");
      }
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await resendSignUpCode({ username: email });
      setResent(true);
      setSuccess("Código reenviado. Revisa tu correo.");
    } catch (err: unknown) {
      const errorMessage =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: string }).message)
          : "";
      setError(errorMessage || "Error al reenviar código");
    }
  };

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <Image
            alt="Tu empresa"
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
            className="mx-auto h-10 w-auto"
          />
          <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">
            Confirmar cuenta
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleConfirm} className="space-y-6">
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
              <label htmlFor="code" className="block text-sm/6 font-medium text-white">
                Código de confirmación
              </label>
              <div className="mt-2">
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-base font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-indigo-500 sm:text-sm/6"
              >
                Confirmar
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              onClick={handleResend}
              className="flex w-full justify-center rounded-md bg-gray-700 px-3 py-1.5 text-base font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline-2 focus-visible:outline-indigo-500 sm:text-sm/6"
            >
              Reenviar código
            </button>
          </div>

          {error && <div className="mt-4 text-center text-red-400">{error}</div>}
          {success && <div className="mt-4 text-center text-green-400">{success}</div>}
          {resent && <div className="mt-2 text-center text-indigo-300">Si no ves el correo, revisa tu carpeta de spam.</div>}
        </div>
      </div>
    </>
  );
}
