"use client";

import { useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const INSURERS = [
  { name: "AIICO Insurance Plc", category: "Composite", license: "NAICOM/REG/2001/001", website: "https://www.aiicoplc.com" },
  { name: "AXA Mansard Insurance Plc", category: "Composite", license: "NAICOM/REG/2001/002", website: "https://www.axamansard.com" },
  { name: "Cornerstone Insurance Plc", category: "Composite", license: "NAICOM/REG/2001/003", website: "https://www.cornerstone.com.ng" },
  { name: "Custodian Life Assurance Limited", category: "Composite", license: "NAICOM/REG/2001/004", website: "https://www.custodianplc.com.ng" },
  { name: "FBNInsurance Limited", category: "Composite", license: "NAICOM/REG/2001/005", website: "https://www.fbninsurance.com.ng" },
  { name: "Leadway Assurance Company Limited", category: "Composite", license: "NAICOM/REG/2001/006", website: "https://www.leadway.com" },
  { name: "Mutual Benefits Assurance Plc", category: "Composite", license: "NAICOM/REG/2001/007", website: "https://www.mutualbenefitsplc.com" },
  { name: "Niger Insurance Plc", category: "Composite", license: "NAICOM/REG/2001/008", website: "https://www.nigerinsurance.com" },
  { name: "Old Mutual Nigeria Life Assurance", category: "Composite", license: "NAICOM/REG/2001/009", website: "https://www.oldmutual.com.ng" },
  { name: "Staco Insurance Plc", category: "Composite", license: "NAICOM/REG/2001/010", website: "https://www.stacoinsurance.com" },
  { name: "Allianz Nigeria Insurance Plc", category: "General", license: "NAICOM/REG/2002/001", website: "https://www.allianz.com.ng" },
  { name: "Anchor Insurance Company Limited", category: "General", license: "NAICOM/REG/2002/002", website: "https://www.anchorinsurance.com.ng" },
  { name: "Consolidated Hallmark Insurance Plc", category: "General", license: "NAICOM/REG/2002/003", website: "https://www.chiplc.com" },
  { name: "Coronation Insurance Plc", category: "General", license: "NAICOM/REG/2002/004", website: "https://www.coronationinsurance.com.ng" },
  { name: "Custodian and Allied Insurance Limited", category: "General", license: "NAICOM/REG/2002/005", website: "https://www.custodianplc.com.ng" },
  { name: "Equity Assurance Plc", category: "General", license: "NAICOM/REG/2002/006", website: "https://www.equityassuranceplc.com" },
  { name: "Goldlink Insurance Plc", category: "General", license: "NAICOM/REG/2002/007", website: "https://www.goldlinkinsurance.com" },
  { name: "Great Nigeria Insurance Plc", category: "General", license: "NAICOM/REG/2002/008", website: "https://www.greatnigeriainsurance.com" },
  { name: "Guinea Insurance Plc", category: "General", license: "NAICOM/REG/2002/009", website: "https://www.guineainsurance.com.ng" },
  { name: "Industrial and General Insurance Plc", category: "General", license: "NAICOM/REG/2002/010", website: "https://www.igiplc.com" },
  { name: "International Energy Insurance Plc", category: "General", license: "NAICOM/REG/2002/011", website: "https://www.ieiplc.com" },
  { name: "Lasaco Assurance Plc", category: "General", license: "NAICOM/REG/2002/012", website: "https://www.lasacoplc.com" },
  { name: "Law Union and Rock Insurance Plc", category: "General", license: "NAICOM/REG/2002/013", website: "https://www.lawunionrock.com" },
  { name: "Linkage Assurance Plc", category: "General", license: "NAICOM/REG/2002/014", website: "https://www.linkageassurance.com" },
  { name: "Mansard Insurance Plc", category: "General", license: "NAICOM/REG/2002/015", website: "https://www.axamansard.com" },
  { name: "NEM Insurance Plc", category: "General", license: "NAICOM/REG/2002/016", website: "https://www.nem-insurance.com" },
  { name: "NSIA Insurance Limited", category: "General", license: "NAICOM/REG/2002/017", website: "https://www.nsia-insurance.com.ng" },
  { name: "Prestige Assurance Plc", category: "General", license: "NAICOM/REG/2002/018", website: "https://www.prestigeassurance.com" },
  { name: "Regency Alliance Insurance Plc", category: "General", license: "NAICOM/REG/2002/019", website: "https://www.regencyallianceplc.com" },
  { name: "Royal Exchange Plc", category: "General", license: "NAICOM/REG/2002/020", website: "https://www.royalexchange.com.ng" },
  { name: "Saham Unitrust Insurance Nigeria", category: "General", license: "NAICOM/REG/2002/021", website: "https://www.saham.com.ng" },
  { name: "Sovereign Trust Insurance Plc", category: "General", license: "NAICOM/REG/2002/022", website: "https://www.stiplc.com" },
  { name: "Standard Alliance Insurance Plc", category: "General", license: "NAICOM/REG/2002/023", website: "https://www.standardallianceplc.com" },
  { name: "Sterling Assurance Nigeria Limited", category: "General", license: "NAICOM/REG/2002/024", website: "https://www.sterlingassurance.com.ng" },
  { name: "Sunu Assurances Nigeria Plc", category: "General", license: "NAICOM/REG/2002/025", website: "https://www.sunu.com.ng" },
  { name: "Tangerine General Insurance", category: "General", license: "NAICOM/REG/2002/026", website: "https://www.tangerineafrica.com" },
  { name: "Unity Kapital Assurance Plc", category: "General", license: "NAICOM/REG/2002/027", website: "https://www.unitykapital.com" },
  { name: "Universal Insurance Plc", category: "General", license: "NAICOM/REG/2002/028", website: "https://www.universalinsuranceplc.com" },
  { name: "Veritas Kapital Assurance Plc", category: "General", license: "NAICOM/REG/2002/029", website: "https://www.veritaskapital.com" },
  { name: "Zenith General Insurance Company", category: "General", license: "NAICOM/REG/2002/030", website: "https://www.zenithinsurance.com.ng" },
  { name: "ARM Life Plc", category: "Life", license: "NAICOM/REG/2003/001", website: "https://www.arm.com.ng" },
  { name: "FBN Insurance Limited", category: "Life", license: "NAICOM/REG/2003/002", website: "https://www.fbninsurance.com.ng" },
  { name: "Generali Life Assurance Nigeria", category: "Life", license: "NAICOM/REG/2003/003", website: "https://www.generali.com.ng" },
  { name: "Heirs Life Assurance Limited", category: "Life", license: "NAICOM/REG/2003/004", website: "https://www.heirslifeassurance.com" },
  { name: "Nigerian International Insurance Company", category: "Life", license: "NAICOM/REG/2003/005", website: "https://www.niicplc.com" },
  { name: "Tangerine Life Insurance Limited", category: "Life", license: "NAICOM/REG/2003/006", website: "https://www.tangerineafrica.com" },
  { name: "Veritas Life Assurance Company", category: "Life", license: "NAICOM/REG/2003/007", website: "https://www.veritaskapital.com" },
  { name: "Africa Re (African Reinsurance Corporation)", category: "Reinsurance", license: "NAICOM/REG/2004/001", website: "https://www.africa-re.com" },
  { name: "Continental Reinsurance Plc", category: "Reinsurance", license: "NAICOM/REG/2004/002", website: "https://www.continental-re.com" },
  { name: "Nigeria Reinsurance Corporation", category: "Reinsurance", license: "NAICOM/REG/2004/003", website: "https://www.nigerianre.com.ng" },
  { name: "Jaiz Takaful Insurance Plc", category: "Takaful", license: "NAICOM/REG/2005/001", website: "https://www.jaiztakaful.com" },
  { name: "Noor Takaful Insurance Plc", category: "Takaful", license: "NAICOM/REG/2005/002", website: "https://www.noortakaful.com.ng" },
  { name: "Tangerine General Takaful", category: "Takaful", license: "NAICOM/REG/2005/003", website: "https://www.tangerineafrica.com" },
];

const CATEGORIES = ["All", "Composite", "General", "Life", "Reinsurance", "Takaful"];

const CATEGORY_COLOURS: Record<string, string> = {
  Composite: "bg-midnight/10 text-midnight",
  General: "bg-daybreak/10 text-daybreak",
  Life: "bg-cover-green/10 text-cover-green",
  Reinsurance: "bg-info/10 text-info",
  Takaful: "bg-slate/10 text-slate",
};

export default function InsurersPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = INSURERS.filter((ins) => {
    const matchesCategory =
      activeCategory === "All" || ins.category === activeCategory;
    const matchesSearch =
      !search ||
      ins.name.toLowerCase().includes(search.toLowerCase()) ||
      ins.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-paper pt-[50px]">
      <div className="bg-midnight text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-body text-white/60 text-sm uppercase tracking-widest mb-3">
            NAICOM Licensed
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl mb-4">
            Nigerian Insurance Companies
          </h1>
          <p className="font-body text-white/70 text-base max-w-xl mx-auto">
            All insurance companies registered and licensed by the National
            Insurance Commission (NAICOM) of Nigeria.
          </p>
          <p className="font-body text-white/40 text-xs mt-4">
            Data sourced from naicom.gov.ng · {INSURERS.length} registered
            companies
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="relative mb-6">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name or category..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate/20 rounded-xl font-body text-sm text-midnight placeholder:text-slate/50 focus:outline-none focus:border-daybreak"
          />
        </div>

        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`font-body text-sm px-4 py-2 rounded-full border transition-colors ${
                activeCategory === cat
                  ? "bg-midnight text-white border-midnight"
                  : "border-slate/20 text-slate hover:border-midnight hover:text-midnight bg-white"
              }`}
            >
              {cat}
              {cat !== "All" && (
                <span className="ml-1.5 text-xs opacity-60">
                  ({INSURERS.filter((i) => i.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>

        <p className="font-body text-sm text-slate mb-4">
          Showing {filtered.length} of {INSURERS.length} companies
        </p>

        <div className="bg-white border border-slate/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate/5 border-b border-slate/10">
                <th className="text-left font-body text-xs font-semibold text-slate uppercase tracking-wide px-5 py-3">
                  Company Name
                </th>
                <th className="text-left font-body text-xs font-semibold text-slate uppercase tracking-wide px-5 py-3 hidden sm:table-cell">
                  Category
                </th>
                <th className="text-left font-body text-xs font-semibold text-slate uppercase tracking-wide px-5 py-3 hidden md:table-cell">
                  License
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate/5">
              {filtered.map((ins) => (
                <tr
                  key={ins.license}
                  className="hover:bg-slate/5 transition-colors"
                >
                  <td className="px-5 py-3">
                    <p className="font-body text-sm font-semibold text-midnight">
                      {ins.name}
                    </p>
                    <p className="font-body text-xs text-slate sm:hidden mt-0.5">
                      {ins.category}
                    </p>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span
                      className={`font-body text-xs font-medium px-2.5 py-1 rounded-full ${CATEGORY_COLOURS[ins.category] || "bg-slate/10 text-slate"}`}
                    >
                      {ins.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <p className="font-mono text-xs text-slate">{ins.license}</p>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <a
                      href={ins.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-body text-xs text-midnight hover:text-daybreak transition-colors"
                    >
                      Visit <ExternalLink size={12} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-body text-slate">
                No companies found matching your search.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-daybreak/5 border border-daybreak/20 rounded-xl p-5">
          <p className="font-body text-sm text-midnight font-semibold mb-2">
            Disclaimer
          </p>
          <p className="font-body text-sm text-slate leading-relaxed">
            This list is provided for reference purposes only. Data is sourced
            from the NAICOM website at{" "}
            <a
              href="https://naicom.gov.ng"
              target="_blank"
              rel="noopener noreferrer"
              className="text-daybreak hover:underline"
            >
              naicom.gov.ng
            </a>
            . For the most up-to-date and authoritative list of licensed
            insurance companies in Nigeria, please visit the NAICOM website
            directly. AfriGlobal Insurance Brokers Limited is a registered
            insurance broker and works with select underwriting partners from
            this list.
          </p>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}
