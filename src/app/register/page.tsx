"use client";
import { signUp, confirmSignUp } from "@aws-amplify/auth";
import { useState } from "react";
import Image from "next/image";
export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [code, setCode] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await signUp({
        username: email,
        password,
        options: { userAttributes: { email } },
      });
      setShowConfirm(true);
      setSuccess("Usuario registrado. Revisa tu correo para confirmar la cuenta.");
    } catch (err: unknown) {
      if (isAmplifyError(err)) {
        const msg = err.message;
        if (msg.includes("uppercase")) {
          setError("La contraseña debe contener al menos una letra mayúscula.");
        } else if (msg.includes("lowercase")) {
          setError("La contraseña debe contener al menos una letra minúscula.");
        } else if (msg.includes("must have numeric characters") || msg.includes("number")) {
          setError("La contraseña debe contener al menos un número.");
        } else if (msg.includes("symbol")) {
          setError("La contraseña debe contener al menos un símbolo.");
        } else if (msg.includes("not long enough")) {
          setError("La contraseña es demasiado corta. Debe tener al menos 8 caracteres.");
        } else if (isUsernameExistsError(err)) {
          setError("El usuario ya existe. ¿Necesitas confirmar tu cuenta?");
          setShowConfirm(true);
        } else {
          setError(msg || "Error al registrar usuario");
        }
      } else if (isUsernameExistsError(err)) {
        setError("El usuario ya existe. ¿Necesitas confirmar tu cuenta?");
        setShowConfirm(true);
      } else {
        setError("Error al registrar usuario");
      }
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      setSuccess("¡Cuenta confirmada! Ya puedes iniciar sesión.");
    } catch (err: unknown) {
      if (
        isAmplifyError(err) &&
        (err.message.includes("Invalid code provided") || err.message.includes("Código inválido"))
      ) {
        setError("El código ingresado no es válido. Por favor, solicita un nuevo código e inténtalo de nuevo.");
      } else if (isAmplifyError(err)) {
        setError(err.message || "Error al confirmar usuario");
      } else {
        setError("Error al confirmar usuario");
      }
      setSuccess(""); // Borra el mensaje de éxito si hay error
    }
  };

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-gray-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <Image
            alt="Tu empresa"
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
            width={40}
            height={40}
            className="mx-auto h-10 w-auto"
          />
          <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">
            Crear una cuenta
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form
            onSubmit={showConfirm ? handleConfirm : handleRegister}
            className="space-y-6"
          >
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
                  disabled={showConfirm}
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                />
              </div>
            </div>

            {!showConfirm && (
              <div>
                <label htmlFor="password" className="block text-sm/6 font-medium text-white">
                  Contraseña
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                  />
                </div>
              </div>
            )}

            {showConfirm && (
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
            )}

            {error && <div className="text-red-400">{error}</div>}
            {success && <div className="text-green-400">{success}</div>}

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                {showConfirm ? "Confirmar cuenta" : "Registrarse"}
              </button>
            </div>
          </form>

          {showConfirm && (
            <div className="mt-4 text-center">
              <a
                href="/confirm"
                className="text-indigo-400 hover:text-indigo-300 underline text-sm"
              >
                ¿Problemas con el código? Haz clic aquí para reenviar o ingresar el código de confirmación
              </a>
            </div>
          )}

          <p className="mt-10 text-center text-sm/6 text-gray-400">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

function isAmplifyError(err: unknown): err is { message: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as Record<string, unknown>).message === "string"
  );
}

function isUsernameExistsError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as Record<string, unknown>).name === "UsernameExistsException"
  );
}