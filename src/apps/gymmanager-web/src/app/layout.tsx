import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "GymManager",
  description: "Multi-tenant gym management platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
