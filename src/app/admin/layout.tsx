import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - IT-Bewerbungs-Management-Tool",
  description: "Administrationsbereich für das IT-Bewerbungs-Management-Tool",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="admin-layout">{children}</div>;
}
