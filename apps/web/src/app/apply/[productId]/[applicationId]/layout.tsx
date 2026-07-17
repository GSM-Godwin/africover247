import { ApplicationWizardProvider } from "@/contexts/application-wizard-context";

export default function ApplicationWizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ApplicationWizardProvider>{children}</ApplicationWizardProvider>;
}
