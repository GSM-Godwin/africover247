export const PLAIN_ENGLISH_LABELS: Record<string, string> = {
  Premium: "What you pay",
  "Sum Insured": "Maximum amount covered",
  Excess: "What you may pay towards a claim",
  Exclusion: "What isn't covered",
  Exclusions: "What isn't covered",
  Policy: "Your insurance agreement",
  Claim: "Asking your insurer to pay for a covered loss",
  Underwriting: "How we assess your risk",
  Beneficiary: "Who receives the benefit",
  Renewal: "Continue your cover",
  Expiry: "When your cover ends",
  "Effective Date": "When your cover starts",
  Liability: "When you are legally responsible for someone else's loss",
  Indemnity: "Putting you back financially after a covered loss",
  Deductible: "Amount you contribute before insurer pays",
  Endorsement: "A change to your policy",
  Lapse: "When your cover stops",
  Reinstatement: "Restoring a stopped policy",
  Subrogation: "Insurer's right to recover from a third party",
  "Third Party": "Someone other than you and the insurer",
  "Insurable Interest": "Your legitimate financial interest in what's insured",
  Quote: "An estimate of your insurance cost",
  Application: "The form you fill to buy insurance",
  "Proposal Form": "The detailed form about you and what you want to insure",
  Assessment: "How the insurer looks at the risk",
  "Policy Period": "The time your insurance is active",
  Loss: "Harm or damage that can trigger a claim",
  Damage: "When something you own is broken or harmed",
  "Claim Assessment": "The process of reviewing and settling a claim",
  "Claim Settlement": "The amount paid when a claim is approved",
  Salvage: "What remains after a claim is paid",
  "Waiting Period": "The gap between applying and cover starting",
  "Pre-existing Condition": "A problem that existed before cover started",
  "Wear & Tear": "Normal deterioration over time",
  Negligence: "Carelessness that causes harm",
  "Consequential Loss": "Indirect loss caused by the main loss",
  "Uninsured Loss": "A loss your policy does not cover",
  "Policy Limits": "The maximum the insurer will pay",
};

export type GlossaryTerm = {
  slug: string
  label: string
  category: string
  definition: string
  plainEnglish?: string
  example?: string
  relatedTerms: string[]
}

export const GLOSSARY_CATEGORY_ORDER = [
  "Understanding Insurance",
  "Buying Insurance",
  "Making a Claim",
  "Exclusions",
  "Policy Terms",
] as const

const AFRIGLOBAL_TERMS: GlossaryTerm[] = [
  {
    slug: "quote",
    label: "Quote",
    category: "Buying Insurance",
    definition: "Estimated premium or cost a prospective insured will pay for an insurance cover.",
    plainEnglish: "An estimate of how much your insurance will cost before you commit to buying it.",
    relatedTerms: ["Application", "Premium", "Underwriting"],
  },
  {
    slug: "application",
    label: "Application",
    category: "Buying Insurance",
    definition: "A formal request by a prospective insured to buy an insurance product.",
    plainEnglish: "The form you fill out when you want to buy insurance.",
    relatedTerms: ["Proposal Form", "Quote", "Underwriting"],
  },
  {
    slug: "proposal-form",
    label: "Proposal Form",
    category: "Buying Insurance",
    definition: "A form completed by the prospective insured providing necessary information about themselves and the cover they want.",
    plainEnglish: "The detailed form that asks about you and what you want to insure — so the insurer can decide whether to cover you and at what price.",
    relatedTerms: ["Application", "Underwriting", "Material Fact"],
  },
  {
    slug: "underwriting",
    label: "Underwriting",
    category: "Buying Insurance",
    definition: "The process of assessing a risk, ascertaining if it is insurable and at what premium.",
    plainEnglish: "The process where the insurer reviews your application and decides whether to cover you, and how much to charge.",
    example:
      "When Folake applies for health insurance, the insurer reviews her medical history to decide her premium — this is underwriting.",
    relatedTerms: ["Risk", "Premium", "Policy", "Material Fact", "Assessment"],
  },
  {
    slug: "assessment",
    label: "Assessment",
    category: "Buying Insurance",
    definition: "The process of identifying a potential risk associated with an insurance cover request.",
    plainEnglish: "When the insurer looks at your situation to understand what risks they would be taking on by covering you.",
    relatedTerms: ["Underwriting", "Risk", "Application"],
  },
  {
    slug: "insurable-interest",
    label: "Insurable Interest",
    category: "Buying Insurance",
    definition: "The financial or legal interest of the insured on the subject matter of insurance.",
    plainEnglish: "You can only insure something you would lose money on if it were damaged or destroyed — like your own car or home, not someone else's.",
    example:
      "You can insure your own car because you have an insurable interest in it. You cannot insure a stranger's car.",
    relatedTerms: ["Policy", "Underwriting", "Risk"],
  },
  {
    slug: "effective-date",
    label: "Effective Date",
    category: "Buying Insurance",
    definition: "The commencement date of an insurance cover.",
    plainEnglish: "The date your insurance starts — before this date you are not covered.",
    example:
      "Chisom buys insurance on 1 January with an effective date of 1 January. She is covered from that day.",
    relatedTerms: ["Expiry Date", "Policy Period", "Policy", "Renewal"],
  },
  {
    slug: "policy-period",
    label: "Policy Period",
    category: "Buying Insurance",
    definition: "The start and end date of an insurance policy.",
    plainEnglish: "The time your insurance is active — usually 12 months for most policies.",
    relatedTerms: ["Effective Date", "Expiry Date", "Renewal"],
  },
  {
    slug: "renewal",
    label: "Renewal",
    category: "Buying Insurance",
    definition: "Extension of an insurance policy after the expiry period for another period.",
    plainEnglish: "Continuing your insurance for another year (or period) after it expires.",
    example:
      "Adaeze's car insurance expires in December. She renews it for another year to stay protected.",
    relatedTerms: ["Expiry Date", "Premium", "Policy", "Lapse"],
  },
  {
    slug: "cancellation",
    label: "Cancellation",
    category: "Buying Insurance",
    definition: "The discontinuation of an insurance cover before the expiry date.",
    plainEnglish: "Ending your insurance policy before it is due to expire.",
    example:
      "Adaobi sells her car and no longer needs motor insurance. She cancels her policy and receives a partial refund.",
    relatedTerms: ["Policy", "Renewal", "Lapse"],
  },
  {
    slug: "loss",
    label: "Loss",
    category: "Making a Claim",
    definition: "The physical damage, injury, or financial harm suffered by a policy holder due to an unfortunate circumstance.",
    plainEnglish: "Any harm or damage that triggers an insurance claim — for example, your car being stolen or your property being flooded.",
    relatedTerms: ["Damage", "Claim", "Claim Settlement"],
  },
  {
    slug: "damage",
    label: "Damage",
    category: "Making a Claim",
    definition: "Physical harm or destruction to goods and properties.",
    plainEnglish: "When something you own is broken, destroyed, or harmed.",
    relatedTerms: ["Loss", "Claim", "Salvage"],
  },
  {
    slug: "claim-assessment",
    label: "Claim Assessment",
    category: "Making a Claim",
    definition: "The processes involved in settling a claim.",
    plainEnglish: "Everything that happens between submitting your claim and receiving your payout — including investigation, valuation, and approval.",
    relatedTerms: ["Claim", "Claim Settlement", "Loss"],
  },
  {
    slug: "claim-settlement",
    label: "Claim Settlement",
    category: "Making a Claim",
    definition: "The money paid out in settling a claim.",
    plainEnglish: "The amount your insurer pays you when your claim is approved.",
    relatedTerms: ["Claim", "Claim Assessment", "Compensation"],
  },
  {
    slug: "salvage",
    label: "Salvage",
    category: "Making a Claim",
    definition: "The physical remains of a damaged or destroyed property that the insurers possess after settling an insured's claim.",
    plainEnglish: "What is left of your damaged property after the insurer pays you out — for example, a written-off vehicle that the insurer takes ownership of.",
    relatedTerms: ["Claim Settlement", "Damage", "Loss"],
  },
  {
    slug: "exclusions",
    label: "Exclusions",
    category: "Exclusions",
    definition: "Things or circumstances not covered by an insurance policy.",
    plainEnglish: "The situations where your insurer will NOT pay — always read the exclusions section of your policy carefully.",
    relatedTerms: ["Exclusion", "Policy Limits", "Uninsured Loss", "Cover"],
  },
  {
    slug: "waiting-period",
    label: "Waiting Period",
    category: "Exclusions",
    definition: "The period between the application for an insurance cover and the acceptance and issuance of the policy document.",
    plainEnglish: "The gap between when you apply for insurance and when your cover actually starts.",
    relatedTerms: ["Effective Date", "Application", "Policy Period"],
  },
  {
    slug: "pre-existing-condition",
    label: "Pre-existing Condition",
    category: "Exclusions",
    definition: "A condition existing or prevailing before the inception of an insurance cover or contract.",
    plainEnglish: "A problem that existed before your insurance started — most policies will not cover claims related to pre-existing conditions.",
    relatedTerms: ["Exclusions", "Waiting Period", "Effective Date"],
  },
  {
    slug: "wear-and-tear",
    label: "Wear & Tear",
    category: "Exclusions",
    definition: "Prevalent acts of nature that are not covered by an insurance policy.",
    plainEnglish: "Normal deterioration of your property over time — insurance covers sudden damage, not gradual aging.",
    relatedTerms: ["Exclusions", "Damage", "Uninsured Loss"],
  },
  {
    slug: "negligence",
    label: "Negligence",
    category: "Exclusions",
    definition: "An unintentional careless act, or failure to act, that causes physical injury, damage, or financial loss to an insured person.",
    plainEnglish: "Being careless in a way that causes harm — some policies exclude claims caused by the insured's own negligence.",
    relatedTerms: ["Exclusions", "Uninsured Loss", "Liability"],
  },
  {
    slug: "consequential-loss",
    label: "Consequential Loss",
    category: "Exclusions",
    definition: "An indirect setback caused by direct property or equipment loss or damage.",
    plainEnglish: "Losses that happen as a result of the main loss — for example, lost business income because your equipment was damaged.",
    relatedTerms: ["Loss", "Exclusions", "Uninsured Loss"],
  },
  {
    slug: "uninsured-loss",
    label: "Uninsured Loss",
    category: "Exclusions",
    definition: "Losses not covered by the insurance contract issued to the insured.",
    plainEnglish: "Losses your policy does not cover — either because they are excluded or because they exceed your policy limit.",
    relatedTerms: ["Exclusions", "Policy Limits", "Excess"],
  },
  {
    slug: "policy-limits",
    label: "Policy Limits",
    category: "Exclusions",
    definition: "The highest amount of money the insurer will pay to the insured in the event of a claim.",
    plainEnglish: "The maximum your insurer will pay — if your loss exceeds this amount, you pay the difference yourself.",
    relatedTerms: ["Sum Insured", "Claim Settlement", "Uninsured Loss"],
  },
  {
    slug: "excess",
    label: "Excess",
    category: "Exclusions",
    definition: "The set amount of money the insured agrees to bear in each and every claim made.",
    plainEnglish: "The amount you pay first before your insurer covers the rest — also called a deductible. For example, if your excess is ₦50,000 and your claim is ₦500,000, you pay ₦50,000 and the insurer pays ₦450,000.",
    example:
      "Tunde's car repair costs ₦200,000. His policy has a ₦20,000 excess. He pays ₦20,000 and the insurer pays ₦180,000.",
    relatedTerms: ["Claim", "Deductible", "Policy Limits"],
  },
]

const EXISTING_TERMS: GlossaryTerm[] = [
  {
    slug: "insurance",
    label: "Insurance",
    category: "Understanding Insurance",
    definition:
      "An arrangement that protects you financially when certain unexpected events happen. You pay a regular amount (premium) and the insurer pays if something goes wrong.",
    example:
      "Emeka pays ₦50,000 a year for motor insurance. When his car is stolen, the insurer pays him ₦2,000,000 to replace it.",
    relatedTerms: ["Premium", "Policy", "Claim", "Cover"],
  },
  {
    slug: "premium",
    label: "Premium",
    category: "Understanding Insurance",
    definition:
      "The amount you pay to obtain insurance cover. This can be paid monthly or annually.",
    example:
      "Fatima pays ₦25,000 every year for her home insurance. This ₦25,000 is her premium.",
    relatedTerms: ["Policy", "Cover", "Renewal", "Sum Insured", "Quote"],
  },
  {
    slug: "policy",
    label: "Policy",
    category: "Understanding Insurance",
    definition:
      "The document that explains what you are insured for, the conditions and what the insurer will pay.",
    example:
      "Chidi received his motor insurance policy document by email. It explains exactly what damage is covered and what is not.",
    relatedTerms: ["Premium", "Cover", "Exclusion", "Renewal"],
  },
  {
    slug: "cover",
    label: "Cover",
    category: "Understanding Insurance",
    definition:
      "The protection your insurance policy provides against specific risks or losses.",
    example:
      "Amaka's home insurance cover includes fire, theft, and flood damage to her property in Lekki.",
    relatedTerms: ["Policy", "Premium", "Exclusion", "Claim"],
  },
  {
    slug: "claim",
    label: "Claim",
    category: "Making a Claim",
    definition:
      "A request made to the insurer for payment or assistance after an insured event occurs.",
    example:
      "After the flood damaged Amaka's property, she filed a claim with her insurer and received compensation within two weeks.",
    relatedTerms: ["Excess", "Indemnity", "Exclusion", "Claim Assessment", "Loss"],
  },
  {
    slug: "exclusion",
    label: "Exclusion",
    category: "Policy Terms",
    definition:
      "Something the policy does not cover. Always check exclusions before buying.",
    example:
      "Ngozi's travel insurance excludes pre-existing medical conditions. Her diabetes treatment abroad is not covered.",
    relatedTerms: ["Exclusions", "Policy", "Cover", "Claim"],
  },
  {
    slug: "sum-insured",
    label: "Sum Insured",
    category: "Understanding Insurance",
    definition:
      "The maximum amount an insurer agrees to cover for an insured item or risk.",
    example:
      "Bola insures her shop contents for ₦5,000,000. If everything is stolen, the maximum she can claim is ₦5,000,000.",
    relatedTerms: ["Premium", "Indemnity", "Policy Limits"],
  },
  {
    slug: "beneficiary",
    label: "Beneficiary",
    category: "Understanding Insurance",
    definition:
      "A person or entity entitled to receive a benefit under certain insurance policies, such as life insurance.",
    example:
      "Kelechi names his daughter as the beneficiary on his life insurance policy.",
    relatedTerms: ["Nominee", "Policy"],
  },
  {
    slug: "expiry-date",
    label: "Expiry Date",
    category: "Policy Terms",
    definition:
      "The date on which insurance cover ends unless renewed.",
    example:
      "Babatunde's motor insurance expires on 31 March. After that date, driving without renewing means he has no cover.",
    relatedTerms: ["Renewal", "Effective Date", "Lapse", "Policy Period"],
  },
  {
    slug: "liability",
    label: "Liability",
    category: "Policy Terms",
    definition:
      "Legal responsibility for injury, damage or loss caused to another person.",
    example:
      "A customer slips in Ola's shop and breaks her arm. Ola may be liable and his public liability insurance covers the legal costs.",
    relatedTerms: ["Third Party", "Indemnity", "Exclusion"],
  },
  {
    slug: "indemnity",
    label: "Indemnity",
    category: "Making a Claim",
    definition:
      "Restoring the insured financially to approximately the position they were in before a covered loss.",
    example:
      "After a fire damages Emeka's warehouse, his insurer pays to repair the damage — restoring him to where he was before the fire.",
    relatedTerms: ["Claim", "Compensation", "Sum Insured"],
  },
  {
    slug: "third-party",
    label: "Third Party",
    category: "Policy Terms",
    definition:
      "Someone other than the insured and insurer who may be affected by an insured event.",
    example:
      "Emeka hits another driver's car. That other driver is the third party. Third-party insurance covers damage to their car.",
    relatedTerms: ["Liability", "Claim"],
  },
  {
    slug: "material-fact",
    label: "Material Fact",
    category: "Policy Terms",
    definition:
      "Important information that could influence an insurer's decision to provide cover or set its terms.",
    example:
      "When applying for car insurance, your accident history is a material fact. Hiding it could make your policy invalid.",
    relatedTerms: ["Non-disclosure", "Underwriting", "Policy", "Fraud"],
  },
  {
    slug: "non-disclosure",
    label: "Non-disclosure",
    category: "Policy Terms",
    definition:
      "Failing to provide relevant information required when applying for insurance.",
    example:
      "Chike does not mention his previous car accident when applying for motor insurance. This non-disclosure could void his policy.",
    relatedTerms: ["Material Fact", "Fraud", "Policy"],
  },
  {
    slug: "fraud",
    label: "Fraud",
    category: "Policy Terms",
    definition:
      "Deliberately providing false information or making a dishonest claim to obtain an insurance benefit.",
    example:
      "Staging a car accident to make a false insurance claim is fraud and is a criminal offence.",
    relatedTerms: ["Material Fact", "Non-disclosure", "Claim"],
  },
  {
    slug: "risk",
    label: "Risk",
    category: "Understanding Insurance",
    definition: "Something that could cause financial loss or damage.",
    example:
      "Driving on Lagos roads carries risks such as accidents, theft and flooding. Insurance helps manage these risks.",
    relatedTerms: ["Underwriting", "Premium", "Cover", "Assessment"],
  },
  {
    slug: "nominee",
    label: "Nominee",
    category: "Understanding Insurance",
    definition: "A person designated to receive policy benefits.",
    example:
      "When Nkechi fills in her life insurance form, she nominates her husband to receive the payout if she dies.",
    relatedTerms: ["Beneficiary", "Policy"],
  },
  {
    slug: "deductible",
    label: "Deductible",
    category: "Making a Claim",
    definition:
      "Another term for the amount the insured contributes before the insurer pays — same as excess.",
    example:
      "Femi's health insurance has a ₦10,000 deductible. He pays the first ₦10,000 of any medical bill.",
    relatedTerms: ["Excess", "Claim", "Premium"],
  },
  {
    slug: "compensation",
    label: "Compensation",
    category: "Making a Claim",
    definition: "Money or another benefit paid for an insured loss.",
    example:
      "After the fire, the insurer paid Amaka ₦3,000,000 in compensation for her lost stock.",
    relatedTerms: ["Claim", "Indemnity", "Claim Settlement", "Sum Insured"],
  },
  {
    slug: "lapse",
    label: "Lapse",
    category: "Policy Terms",
    definition:
      "When a policy stops being active, often because premium payments were not made.",
    example:
      "Tunde forgot to renew his motor insurance. His policy lapsed and he was uninsured when he had an accident.",
    relatedTerms: ["Renewal", "Premium", "Reinstatement", "Cancellation"],
  },
  {
    slug: "reinstatement",
    label: "Reinstatement",
    category: "Policy Terms",
    definition:
      "Restoring a policy that has previously stopped or lapsed.",
    example:
      "After missing two payments, Chisom paid all outstanding premiums and had her life insurance reinstated.",
    relatedTerms: ["Lapse", "Renewal", "Premium", "Policy"],
  },
  {
    slug: "subrogation",
    label: "Subrogation",
    category: "Making a Claim",
    definition:
      "The insurer's right, after paying a claim, to pursue recovery from a responsible third party.",
    example:
      "After paying Emeka's claim for damage caused by another driver, the insurer pursues that driver for the money.",
    relatedTerms: ["Claim", "Third Party", "Indemnity"],
  },
]

const afriglobalSlugs = new Set(AFRIGLOBAL_TERMS.map((t) => t.slug))

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  ...EXISTING_TERMS.filter((t) => !afriglobalSlugs.has(t.slug)),
  ...AFRIGLOBAL_TERMS,
]

export const GLOSSARY_BY_SLUG: Record<string, GlossaryTerm> = Object.fromEntries(
  GLOSSARY_TERMS.map((t) => [t.slug, t]),
)

export const GLOSSARY_BY_LABEL: Record<string, GlossaryTerm> = Object.fromEntries(
  GLOSSARY_TERMS.map((t) => [t.label, t]),
)
