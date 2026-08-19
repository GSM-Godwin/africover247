import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — AfriCover247 by AfriGlobal Insurance Brokers",
  description:
    "AfriGlobal Insurance Brokers Limited is a NAICOM-licensed insurance brokerage committed to providing innovative insurance solutions across Nigeria.",
};

const BOARD = [
  {
    name: "Sylverius Okoli",
    title: "Chairman",
    bio: "Sylverius Okoli has held various top management positions in the Oil sector and is a former Director of a number of Shell companies in Africa. He was Managing Director of Shell Sierra Leone and National Oil & Chemical Marketing Plc (now Conoil Plc) and is currently the Executive Chairman of West Africa Bitumen Emulsion Co. Limited (WABECO) and Safecon Sierra Leone Limited.",
  },
  {
    name: "Casmir Azubuike",
    title: "MD/CEO",
    bio: "Casmir Chibuzor Azubuike is an insurance technocrat with over 20 years experience in insurance underwriting, marketing and insurance broking. He is a graduate of Insurance & Actuarial Science and an Associate of the Chartered Insurance Institute of Nigeria (ACIIN). He holds an MBA in Management Technology and is a Certified Alumni of Cornell University USA in Strategic Leadership.",
  },
  {
    name: "Sulaiman Adedokun",
    title: "Non-Executive Director",
    bio: "Sulaiman Adedokun started his career with Security Swaps Limited and later Nigerian Stockbrokers Limited. He pioneered the establishment of Meristem Wealth Management Ltd, a wholly owned subsidiary of Meristem Securities Ltd, and currently manages the Wealth Management Firm.",
  },
  {
    name: "Solomon Egbeleye",
    title: "Executive Director",
    bio: "Solomon Egbeleye is an experienced financial expert with skill competence in Finance, Accounting, Auditing and Investment. He has over 25 years cognate working experience across Trading, Publishing, Manufacturing, Oil & Gas and Insurance. He is a Fellow of the Institute of Chartered Accountants of Nigeria.",
  },
];

const MANAGEMENT = [
  {
    name: "Casmir Azubuike",
    title: "MD/CEO",
    bio: "Insurance technocrat with over 20 years experience in insurance underwriting, marketing and broking. Associate of the Chartered Insurance Institute of Nigeria (ACIIN), MBA in Management Technology, and Certified Alumni of Cornell University USA in Strategic Leadership.",
  },
  {
    name: "Solomon Egbeleye",
    title: "Executive Director",
    bio: "Experienced financial expert with over 25 years experience across Trading, Publishing, Manufacturing, Oil & Gas and Insurance. Fellow of the Institute of Chartered Accountants of Nigeria.",
  },
  {
    name: "Motunrayo Fagbemi",
    title: "Head, Marketing",
    bio: "Graduate of Business Administration and Management with a Master's Degree in Human Resources. Over 13 years experience in marketing and customer service in the insurance broking industry.",
  },
  {
    name: "Ubu Oluchukwu",
    title: "Head, South-East Zone",
    bio: "Associate member of the Nigeria Institute of Management Chartered with over 10 years experience in business development, client advisory services, technical operations and claims handling across multiple insurance firms.",
  },
];

const GOALS = [
  "Customer satisfaction through quality services",
  "Upholding the highest level of integrity in every aspect of our business",
  "Meet and exceed client's expectations",
  "Teamwork and harmony of purpose",
  "Training and continuous development",
  "Maintain a conducive work environment",
];

const SERVICES = [
  "Risk Identification, Evaluation & Control",
  "Evaluation of Underwriters",
  "Negotiation with Underwriters",
  "Risk placement and Review of Policy Documents",
  "Speedy Claims Processing and Recovery",
  "Insurance Portfolio Management and Advisory Services",
  "Alternative Risk Management and Consultancy",
];

const OFFICES = [
  {
    city: "Head Office — Lagos",
    address: "141c Oshodi/Gbagada Expressway, Anthony, Lagos, Nigeria",
    phone: "08101315330 / 09063675032",
    email: "info@afriglobal.com.ng",
  },
  {
    city: "Abuja Office",
    address:
      "Polaris Bank Building, 3 Kaura Namoda Street Area, Garki FCT, Abuja, Nigeria",
    phone: "08033000728",
    email: "info@afriglobal.com.ng",
  },
  {
    city: "Port Harcourt Office",
    address:
      "Polaris Bank Building, 204 Aba Road, Beside Mr. Biggs, Rumuola, Port Harcourt",
    phone: "08037605330",
    email: "info@afriglobal.com.ng",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <section className="bg-midnight text-white py-20 px-6 pt-[130px]">
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-body text-daybreak text-sm font-semibold uppercase tracking-widest mb-3">
              About Us
            </p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl mb-6">
              In keeping with international best practice
            </h1>
            <p className="font-body text-white/70 text-lg max-w-2xl mx-auto leading-relaxed">
              We are always one step ahead to give our customers the unique
              advantage of mitigating against risk using the best people,
              process and technology.
            </p>
          </div>
        </section>

        <section className="py-16 px-6 bg-paper">
          <div className="max-w-[1140px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-slate/10 p-8">
              <h2 className="font-display font-bold text-midnight text-2xl mb-4">
                Our Mission
              </h2>
              <p className="font-body text-slate text-base leading-relaxed">
                To continuously provide innovative solutions to suit the current
                and future needs of our customers, thereby increasing
                stakeholders&apos; value.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate/10 p-8">
              <h2 className="font-display font-bold text-midnight text-2xl mb-4">
                Our Vision
              </h2>
              <p className="font-body text-slate text-base leading-relaxed">
                To be the preferred Insurance Brokers in Nigeria in the
                provision of insurance risk advisory and intermediation
                services.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-white">
          <div className="max-w-[1140px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display font-bold text-midnight text-3xl mb-4">
                Our Role as Insurance Brokers
              </h2>
              <p className="font-body text-slate text-base mb-6 leading-relaxed">
                As Insurance Professionals, we intermediate between buyers of
                insurance products and insurance underwriters (insurance
                companies).
              </p>
              <ul className="space-y-3">
                {SERVICES.map((service) => (
                  <li key={service} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-daybreak/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-daybreak" />
                    </span>
                    <span className="font-body text-slate text-sm leading-relaxed">
                      {service}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-midnight rounded-2xl p-8">
              <h3 className="font-display font-bold text-white text-xl mb-6">
                Our Goals
              </h3>
              <ul className="space-y-4">
                {GOALS.map((goal) => (
                  <li key={goal} className="flex items-start gap-3">
                    <span className="text-daybreak mt-0.5 shrink-0">✓</span>
                    <span className="font-body text-white/80 text-sm leading-relaxed">
                      {goal}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-paper">
          <div className="max-w-[1140px] mx-auto">
            <h2 className="font-display font-bold text-midnight text-3xl mb-2 text-center">
              Meet the Board
            </h2>
            <p className="font-body text-slate text-base text-center mb-10">
              Experienced leaders guiding AfriGlobal&apos;s mission and vision
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {BOARD.map((member) => (
                <div
                  key={member.name}
                  className="bg-white rounded-2xl border border-slate/10 p-6"
                >
                  <div className="w-14 h-14 rounded-full bg-midnight/10 flex items-center justify-center mb-4">
                    <span className="font-display font-bold text-midnight text-xl">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                  </div>
                  <h3 className="font-body font-bold text-midnight text-base mb-0.5">
                    {member.name}
                  </h3>
                  <p className="font-body text-daybreak text-xs font-semibold uppercase tracking-wide mb-3">
                    {member.title}
                  </p>
                  <p className="font-body text-slate text-sm leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-white">
          <div className="max-w-[1140px] mx-auto">
            <h2 className="font-display font-bold text-midnight text-3xl mb-2 text-center">
              Management Team
            </h2>
            <p className="font-body text-slate text-base text-center mb-10">
              The team driving AfriGlobal&apos;s day-to-day operations
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {MANAGEMENT.map((member) => (
                <div
                  key={member.name + member.title}
                  className="bg-paper rounded-2xl border border-slate/10 p-6"
                >
                  <div className="w-14 h-14 rounded-full bg-daybreak/10 flex items-center justify-center mb-4">
                    <span className="font-display font-bold text-daybreak text-xl">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                  </div>
                  <h3 className="font-body font-bold text-midnight text-base mb-0.5">
                    {member.name}
                  </h3>
                  <p className="font-body text-daybreak text-xs font-semibold uppercase tracking-wide mb-3">
                    {member.title}
                  </p>
                  <p className="font-body text-slate text-sm leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-midnight">
          <div className="max-w-[1140px] mx-auto">
            <h2 className="font-display font-bold text-white text-3xl mb-2 text-center">
              Our Offices
            </h2>
            <p className="font-body text-white/60 text-base text-center mb-10">
              Visit us at any of our offices across Nigeria
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {OFFICES.map((office) => (
                <div
                  key={office.city}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6"
                >
                  <h3 className="font-body font-bold text-white text-base mb-4">
                    {office.city}
                  </h3>
                  <p className="font-body text-white/70 text-sm leading-relaxed mb-3">
                    {office.address}
                  </p>
                  <a
                    href={`tel:+234${office.phone.split("/")[0].trim().replace(/^0/, "")}`}
                    className="block font-body text-daybreak text-sm font-semibold hover:text-white transition-colors mb-1"
                  >
                    {office.phone}
                  </a>
                  <a
                    href={`mailto:${office.email}`}
                    className="block font-body text-white/60 text-sm hover:text-white transition-colors"
                  >
                    {office.email}
                  </a>
                </div>
              ))}
            </div>
            <p className="font-body text-white/40 text-xs text-center mt-8">
              Download our company profile:{" "}
              <a
                href="https://afriglobal.com.ng/img/company.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-daybreak hover:text-white transition-colors"
              >
                afriglobal.com.ng/img/company.pdf
              </a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
