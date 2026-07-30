import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Privacy Policy",
  description:
    "AfriCover247 Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <div className="pt-[50px]">
        <div className="bg-midnight text-white py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-display font-bold text-4xl mb-4">
              Privacy Policy
            </h1>
            <p className="font-body text-white/60 text-sm">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-NG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="bg-daybreak/10 border border-daybreak/20 rounded-2xl p-6 mb-10">
            <p className="font-body text-midnight font-semibold text-sm">
              This Privacy Policy is being finalized by AfriGlobal Insurance
              Brokers Limited and will be published here shortly.
            </p>
            <p className="font-body text-slate text-sm mt-2">
              For any privacy-related enquiries in the meantime, please contact
              us at{" "}
              <a
                href="mailto:info@afriglobal.com.ng"
                className="text-daybreak hover:underline"
              >
                info@afriglobal.com.ng
              </a>
            </p>
          </div>
          <div className="space-y-8">
            {[
              {
                title: "1. Information We Collect",
                content:
                  "We collect information you provide when registering for an account, applying for insurance products, filing claims, or contacting us. This includes personal identification information, contact details, financial information, and vehicle or asset details relevant to your insurance application.",
              },
              {
                title: "2. How We Use Your Information",
                content:
                  "We use your information to process insurance applications, issue policies, handle claims, send important notifications about your policy, comply with legal and regulatory requirements under NAICOM, and improve our services.",
              },
              {
                title: "3. Information Sharing",
                content:
                  "We share your information with underwriting insurance companies for the purpose of processing your application, payment processors (Monnify) for secure payment handling, and regulatory authorities (NAICOM) as required by law. We do not sell your personal data to third parties.",
              },
              {
                title: "4. Data Security",
                content:
                  "We implement industry-standard security measures to protect your personal information, including encryption in transit and at rest, secure authentication, and regular security audits.",
              },
              {
                title: "5. Your Rights",
                content:
                  "Under the Nigeria Data Protection Act (NDPA), you have the right to access, correct, or delete your personal information. Contact us at info@afriglobal.com.ng to exercise these rights.",
              },
              {
                title: "6. Contact Us",
                content:
                  "For privacy-related questions, contact AfriGlobal Insurance Brokers Limited at info@afriglobal.com.ng.",
              },
            ].map((section) => (
              <div key={section.title}>
                <h2 className="font-display font-bold text-midnight text-xl mb-3">
                  {section.title}
                </h2>
                <p className="font-body text-slate text-base leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
