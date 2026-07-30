import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Terms of Service",
  description:
    "AfriCover247 Terms of Service — terms and conditions for using our platform.",
};

export default function TermsOfServicePage() {
  return (
    <>
      <Navbar />
      <div className="pt-[50px]">
        <div className="bg-midnight text-white py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-display font-bold text-4xl mb-4">
              Terms of Service
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
              These Terms of Service are being finalized by AfriGlobal Insurance
              Brokers Limited and will be published here shortly.
            </p>
            <p className="font-body text-slate text-sm mt-2">
              For enquiries in the meantime, please contact us at{" "}
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
                title: "1. Acceptance of Terms",
                content:
                  "By accessing or using AfriCover247, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree, please do not use our platform.",
              },
              {
                title: "2. Use of Services",
                content:
                  "AfriCover247 is a digital platform operated by AfriGlobal Insurance Brokers Limited, a licensed insurance broker regulated by NAICOM. Our platform facilitates access to insurance products underwritten by licensed Nigerian insurance companies.",
              },
              {
                title: "3. Account Registration",
                content:
                  "You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials and for all activities under your account.",
              },
              {
                title: "4. Insurance Products",
                content:
                  "Insurance products available on AfriCover247 are underwritten by NAICOM-licensed insurance companies. AfriGlobal acts as your broker and intermediary. Policy terms, conditions, and exclusions are governed by the policy documents issued by the underwriting company.",
              },
              {
                title: "5. Payments",
                content:
                  "All payments are processed securely by Monnify, a licensed payment processor. Premiums are non-refundable once a policy has been issued unless otherwise specified in the policy terms.",
              },
              {
                title: "6. Limitation of Liability",
                content:
                  "AfriGlobal Insurance Brokers Limited is not liable for any indirect, incidental, or consequential damages arising from your use of AfriCover247. Our liability is limited to the premium amount paid for your policy.",
              },
              {
                title: "7. Governing Law",
                content:
                  "These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in Nigerian courts.",
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
