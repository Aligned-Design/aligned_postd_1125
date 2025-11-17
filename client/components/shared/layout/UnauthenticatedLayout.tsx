import { ReactNode } from "react";

interface UnauthenticatedLayoutProps {
  children: ReactNode;
}

export function UnauthenticatedLayout({
  children,
}: UnauthenticatedLayoutProps) {
  return <div className="min-h-screen bg-white">{children}</div>;
}
