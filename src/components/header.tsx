"use client";

import { getCurrentUser, signOut } from "@aws-amplify/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAmplify } from "@/provider/AmplifyProvider";
import Image from "next/image";
import { FiMenu, FiX, FiCheckSquare, FiClipboard, FiTrendingUp, FiLink, FiActivity, FiCalendar, FiLogIn, FiInfo } from "react-icons/fi";
import { FaChevronDown } from "react-icons/fa";
import Link from "next/link";
import {
  Dialog,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from "@headlessui/react";

// Servicios de la app
const herramientas = [
  {
    name: "Tareas y Proyectos",
    description: "Organiza tus tareas y proyectos pendientes",
    href: "/task",
    icon: FiCheckSquare,
  },
  {
    name: "Notas",
    description: "Toma notas y organiza tus documentos",
    href: "/notas",
    icon: FiClipboard,
  },
  {
    name: "Seguimiento de Hábitos",
    description: "Registra y mantén tus hábitos diarios",
    href: "/habitos",
    icon: FiTrendingUp,
  },
  {
    name: "Recursos",
    description: "Guarda y organiza enlaces útiles",
    href: "/recursos",
    icon: FiLink,
  },
];

const accionesRapidas = [
  { name: "Ver dashboard", href: "/dashboard", icon: FiActivity },
  { name: "Calendario", href: "/calendario", icon: FiCalendar },
  { name: "Ayuda", href: "/ayuda", icon: FiInfo },
];

export default function Header() {
  const { initialized } = useAmplify();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        setUserEmail(user.signInDetails?.loginId ?? null);
      } catch (error) {
        // Usuario no autenticado - esto es normal
        setUserEmail(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [initialized]);

  const handleLogout = async () => {
    try {
      await signOut();
      setUserEmail(null);
      router.push("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <header className="relative isolate z-10 bg-gray-900">
      <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <Image
              alt="Ivory App"
              src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
              width={32}
              height={32}
              className="h-8 w-auto"
              priority
            />
            <span className="text-white text-lg font-bold">Ivory</span>
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-200"
            aria-label="Abrir menú principal"
          >
            <FiMenu size={24} />
          </button>
        </div>
        
        {!loading && userEmail ? (
          <>
            <PopoverGroup className="hidden lg:flex lg:gap-x-8">
              <Popover>
                <PopoverButton className="flex items-center gap-x-1 text-sm/6 font-semibold text-gray-200">
                  Herramientas
                  <FaChevronDown size={12} className="text-gray-400" />
                </PopoverButton>

                <PopoverPanel
                  transition
                  className="absolute inset-x-0 top-0 -z-10 bg-gray-800 pt-14 shadow-lg ring-1 ring-gray-700 transition data-closed:-translate-y-1 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
                >
                  <div className="mx-auto grid max-w-7xl grid-cols-4 gap-x-4 px-6 py-10 lg:px-8 xl:gap-x-8">
                    {herramientas.map((item) => (
                      <div key={item.name} className="group relative rounded-lg p-6 text-sm/6 hover:bg-gray-700">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-gray-700 group-hover:bg-gray-600">
                          <item.icon size={20} className="text-indigo-400 group-hover:text-indigo-300" />
                        </div>
                        <Link href={item.href} className="mt-6 block font-semibold text-white">
                          {item.name}
                          <span className="absolute inset-0" />
                        </Link>
                        <p className="mt-1 text-gray-400">{item.description}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-700">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                      <div className="grid grid-cols-3 divide-x divide-gray-600 border-x border-gray-600">
                        {accionesRapidas.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center justify-center gap-x-2.5 p-3 text-sm/6 font-semibold text-gray-200 hover:bg-gray-600"
                          >
                            <item.icon size={16} className="text-gray-400" />
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverPanel>
              </Popover>

              <Link href="/dashboard" className="text-sm/6 font-semibold text-gray-200 hover:text-white">
                Dashboard
              </Link>
              <Link href="/calendario" className="text-sm/6 font-semibold text-gray-200 hover:text-white">
                Calendario
              </Link>
              <Link href="/ayuda" className="text-sm/6 font-semibold text-gray-200 hover:text-white">
                Ayuda
              </Link>
            </PopoverGroup>
            
            <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-4">
              <span className="text-white text-sm mr-2">{userEmail}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-x-1 bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded text-sm font-semibold"
              >
                <FiLogIn size={16} />
                Cerrar sesión
              </button>
            </div>
          </>
        ) : !loading ? (
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-6">
            <Link href="/login" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">
              Iniciar sesión
            </Link>
            <Link 
              href="/register" 
              className="rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              Registrarse
            </Link>
          </div>
        ) : null}
      </nav>
      
      {/* Menú móvil */}
      <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
        <div className="fixed inset-0 z-50" />
        <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-800">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
              <Image
                alt="Ivory App"
                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="text-white text-lg font-bold">Ivory</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-200"
              aria-label="Cerrar menú"
            >
              <FiX size={24} />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-700">
              {!loading && userEmail ? (
                <>
                  <div className="py-6">
                    <div className="mb-4 text-white">{userEmail}</div>
                    <Disclosure as="div" className="-mx-3">
                      <DisclosureButton className="group flex w-full items-center justify-between rounded-lg py-2 pr-3.5 pl-3 text-base/7 font-semibold text-white hover:bg-gray-800">
                        Herramientas
                        <FaChevronDown 
                          size={12} 
                          className="text-gray-400 transition-transform group-data-open:rotate-180" 
                        />
                      </DisclosureButton>
                      <DisclosurePanel className="mt-2 space-y-2">
                        {herramientas.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex gap-2 items-center rounded-lg py-2 pr-3 pl-6 text-sm/7 font-semibold text-gray-200 hover:bg-gray-800"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <item.icon size={16} className="text-indigo-400" />
                            {item.name}
                          </Link>
                        ))}
                      </DisclosurePanel>
                    </Disclosure>
                    
                    <Link
                      href="/dashboard"
                      className="-mx-3 flex items-center gap-2 rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-200 hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FiActivity size={16} className="text-indigo-400" />
                      Dashboard
                    </Link>
                    <Link
                      href="/calendario"
                      className="-mx-3 flex items-center gap-2 rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-200 hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FiCalendar size={16} className="text-indigo-400" />
                      Calendario
                    </Link>
                    <Link
                      href="/ayuda"
                      className="-mx-3 flex items-center gap-2 rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-200 hover:bg-gray-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FiInfo size={16} className="text-indigo-400" />
                      Ayuda
                    </Link>
                  </div>
                  <div className="py-6">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex justify-center items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-2 rounded text-sm font-semibold"
                    >
                      <FiLogIn size={16} />
                      Cerrar sesión
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-6 space-y-4">
                  <Link
                    href="/login"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-indigo-400 hover:text-indigo-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-center bg-indigo-500 hover:bg-indigo-400 text-white font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                  <Link
                    href="/confirm"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-indigo-400 hover:text-indigo-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Confirmar cuenta
                  </Link>
                </div>
              )}
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}
