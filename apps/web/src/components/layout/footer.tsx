import Link from "next/link";

const links = {
  Product: [
    { label: "Motor", href: "/products/motor" },
    { label: "Health", href: "/products/health" },
    { label: "SSLAG / SSPP", href: "/products/sslag" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "NAICOM Insurers", href: "/insurers" },
    { label: "Contact Us", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-midnight py-12 sm:py-16">
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-baseline gap-0 mb-3">
              <span className="font-display font-bold text-paper text-lg leading-none">
                AfriCover
              </span>
              <span className="font-mono font-medium text-paper text-lg leading-none">
                247
              </span>
            </div>
            <p className="font-body text-paper/50 text-sm leading-relaxed max-w-[180px]">
              The always-on front door to insurance in Lagos.
            </p>
          </div>

          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <p className="font-body text-paper/40 text-xs font-semibold uppercase tracking-widest mb-4">
                {heading}
              </p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="font-body text-paper/60 text-sm hover:text-paper hover:translate-x-0.5 transition-all duration-150 inline-block"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-paper/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-body text-paper/30 text-xs">
            © 2026 AfriCover247 — AfriGlobal Insurance Brokers
          </p>
          <p className="font-body text-paper/30 text-xs">Lagos, Nigeria</p>
        </div>
      </div>
    </footer>
  );
}
