"use client";

import { CheckIcon } from "@heroicons/react/20/solid";


const PLAN_ID = process.env.NEXT_PUBLIC_WHOP_PLAN_ID || "plan_demo12345";

const tiers = [
  {
    name: "Hobby",
    id: "tier-hobby",
    priceMonthly: "$29",
    planId: PLAN_ID,
    description:
      "El plan perfecto si recién comienzas a usar Ivory para organizarte.",
    features: [
      "25 proyectos",
      "Hasta 10,000 tareas",
      "Analíticas básicas",
      "Soporte 24h",
    ],
    featured: false,
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    priceMonthly: "$99",
    planId: PLAN_ID,
    description: "Soporte e infraestructura dedicados para tu organización.",
    features: [
      "Proyectos ilimitados",
      "Tareas ilimitadas",
      "Analíticas avanzadas",
      "Representante de soporte dedicado",
      "Automatizaciones de productividad",
      "Integraciones personalizadas",
    ],
    featured: true,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function PricingSection() {
  return (
    <div className="relative isolate bg-gray-900 px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-base/7 font-semibold text-indigo-400">Planes Premium</h2>
        <p className="mt-2 text-5xl font-semibold tracking-tight text-balance text-white sm:text-6xl">
          Elige el plan adecuado para ti
        </p>
      </div>
      <p className="mx-auto mt-6 max-w-2xl text-center text-lg font-medium text-pretty text-gray-300 sm:text-xl/8">
        Desbloquea todo el potencial de Ivory con funciones exclusivas para impulsar tu aprendizaje y productividad.
      </p>

      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
        {tiers.map((tier, tierIdx) => (
          <div
            key={tier.id}
            className={classNames(
              tier.featured ? "relative bg-indigo-500/5 ring-1 ring-indigo-400/30" : "bg-white/5 sm:mx-8 lg:mx-0",
              tier.featured
                ? ""
                : tierIdx === 0
                ? "rounded-t-3xl sm:rounded-b-none lg:rounded-tr-none lg:rounded-bl-3xl"
                : "sm:rounded-t-none lg:rounded-tr-3xl lg:rounded-bl-none",
              "rounded-3xl p-8 sm:p-10"
            )}
          >
            <h3
              id={tier.id}
              className={classNames(
                tier.featured ? "text-indigo-300" : "text-indigo-400",
                "text-base/7 font-semibold"
              )}
            >
              {tier.name}
            </h3>
            <p className="mt-4 flex items-baseline gap-x-2">
              <span
                className={classNames(
                  tier.featured ? "text-white" : "text-gray-100",
                  "text-5xl font-semibold tracking-tight"
                )}
              >
                {tier.priceMonthly}
              </span>
              <span className={classNames("text-gray-400", "text-base")}>/mes</span>
            </p>
            <p className={classNames("text-gray-300", "mt-6 text-base/7")}>{tier.description}</p>
            <ul role="list" className="mt-8 space-y-3 text-sm/6 text-gray-300 sm:mt-10">
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <CheckIcon aria-hidden="true" className="h-6 w-5 flex-none text-indigo-400" />
                  {feature}
                </li>
              ))}
            </ul>

                        <div className="mt-8 sm:mt-10">
              <button
                onClick={() =>
                  window.open(`https://whop.com/checkout/${tier.planId}`, "_blank", "noopener,noreferrer")
                }
                className="w-full rounded-md bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-500 focus:outline-none"
              >
                Pagar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
