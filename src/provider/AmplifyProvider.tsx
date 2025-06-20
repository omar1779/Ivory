"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import config from "../../amplify_outputs.json";

type AmplifyContextType = {
  initialized: boolean;
};

const AmplifyContext = createContext<AmplifyContextType | null>(null);

import { ReactNode } from "react";

export function AmplifyProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log("Configurando Amplify...");
    Amplify.configure(config);
    setInitialized(true);
  }, []);

  return (
    <AmplifyContext.Provider value={{ initialized }}>
      {children}
    </AmplifyContext.Provider>
  );
}

export function useAmplify() {
  const context = useContext(AmplifyContext);
  if (!context) throw new Error("useAmplify debe usarse dentro de AmplifyProvider");
  return context;
}