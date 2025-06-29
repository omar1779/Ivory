import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from 'next/font/google';
import "./globals.css";
import { AmplifyProvider } from "../provider/AmplifyProvider";
import { NotificationProvider } from '@/components/ui/NotificationProvider';
import Header from "@/components/header";

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.className} antialiased h-full bg-gray-900`}
      >
        <AmplifyProvider>
          <NotificationProvider>
            <Header />
            {children}
          </NotificationProvider>
        </AmplifyProvider>
      </body>
    </html>
  );
}
