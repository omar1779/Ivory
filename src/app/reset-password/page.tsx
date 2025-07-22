"use client";
import { FormEvent, useState } from "react";

// Helper to identify Amplify error objects
function isAmplifyError(err: unknown): err is { message?: string } {
  return typeof err === "object" && err !== null && "message" in err;
}
import { resetPassword, confirmResetPassword } from "@aws-amplify/auth";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleRequest = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await resetPassword({ username: email });
      setMessage("Se envió un código a tu correo electrónico.");
      setStep("confirm");
    } catch (err: unknown) {
      setError(isAmplifyError(err) && err.message ? err.message : "Error al solicitar restablecimiento.");
    }
  };

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
      setMessage("Contraseña restablecida correctamente. Inicia sesión.");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: unknown) {
      setError(isAmplifyError(err) && err.message ? err.message : "Error al confirmar restablecimiento.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-white">
          Restablecer contraseña
        </h2>
      </div>
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {step === "request" ? (
          <form onSubmit={handleRequest} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-white">
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
            {error && <div className="text-red-400">{error}</div>}
            {message && <div className="text-green-400">{message}</div>}
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Enviar código
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium leading-6 text-white">
                Código de verificación
              </label>
              <div className="mt-2">
                <input
                  id="code"
                  name="code"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                />
              </div>
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium leading-6 text-white">
                Nueva contraseña
              </label>
              <div className="mt-2">
                <PasswordInput
                  id="newPassword"
                  name="newPassword"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            {error && <div className="text-red-400">{error}</div>}
            {message && <div className="text-green-400">{message}</div>}
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Restablecer contraseña
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
