import { Navbar } from "@/components/layout/navbar";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#F5F6F8]">{children}</main>
    </>
  );
}
