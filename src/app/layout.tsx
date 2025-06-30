import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from 'next/font/google';
import "./globals.css";
import { AmplifyProvider } from "../provider/AmplifyProvider";
import { NotificationProvider } from '@/components/ui/NotificationProvider';
import { ToastNotifications } from '@/components/ui/ToastNotifications';
import Header from "@/components/header";
import 'react-toastify/dist/ReactToastify.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Ivory",
  description: "Gestor de tareas y proyectos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans bg-gray-950 text-gray-100 min-h-screen flex flex-col`}>
        <AmplifyProvider>
          <NotificationProvider>
            <Header />
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
            <ToastNotifications />
          </NotificationProvider>
        </AmplifyProvider>
      </body>
    </html>
  );
}
