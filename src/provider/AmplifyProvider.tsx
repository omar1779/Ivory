"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Amplify } from "aws-amplify";
import { signOut as authSignOut } from "aws-amplify/auth";
import config from "../../amplify_outputs.json";
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser } from "aws-amplify/auth";

type User = {
  username: string;
  signInDetails?: {
    loginId?: string;
  };
} | null;

type AmplifyContextType = {
  initialized: boolean;
  user: User;
  checkUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AmplifyContext = createContext<AmplifyContextType | null>(null);

import { ReactNode } from "react";

export function AmplifyProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState<User>(null);

  // Función para verificar el usuario actual
  const checkUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser({
        username: currentUser.username,
        signInDetails: {
          loginId: currentUser.signInDetails?.loginId
        }
      });
    } catch {

      setUser(null);
    }
  }, []);

  // Función para cerrar sesión
  const signOut = useCallback(async () => {
    try {
      await authSignOut();
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }, []);

  // Configurar Amplify y verificar usuario al cargar
  useEffect(() => {

    Amplify.configure(config);
    
    // Verificar usuario actual
    checkUser();
    setInitialized(true);

    // Configurar listener para cambios de autenticación
    const hubListener = Hub.listen('auth', async ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          await checkUser();
          break;
        case 'signedOut':
          setUser(null);
          break;
        default:
          break;
      }
    });

    // Limpiar listener al desmontar
    return () => {
      hubListener();
    };
  }, [checkUser]);

  return (
    <AmplifyContext.Provider value={{ 
      initialized, 
      user,
      checkUser,
      signOut 
    }}>
      {children}
    </AmplifyContext.Provider>
  );
}

export function useAmplify() {
  const context = useContext(AmplifyContext);
  if (!context) throw new Error("useAmplify debe usarse dentro de AmplifyProvider");
  return context;
}