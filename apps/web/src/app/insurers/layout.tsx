import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NAICOM Registered Insurance Companies",
  description:
    "Directory of all insurance companies registered and licensed by NAICOM in Nigeria.",
};

export default function InsurersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
