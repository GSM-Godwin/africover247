export const PLAIN_ENGLISH_LABELS: Record<string, string> = {
  Premium: "What you pay",
  "Sum Insured": "Maximum amount covered",
  Excess: "What you may pay towards a claim",
  Exclusion: "What isn't covered",
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
};

export const GLOSSARY_TERMS: Record<
  string,
  { definition: string; example: string; relatedTerms: string[] }
> = {
  Insurance: {
    definition:
      "An arrangement that protects you financially when certain unexpected events happen. You pay a regular amount (premium) and the insurer pays if something goes wrong.",
    example:
      "Emeka pays ₦50,000 a year for motor insurance. When his car is stolen, the insurer pays him ₦2,000,000 to replace it.",
    relatedTerms: ["Premium", "Policy", "Claim", "Cover"],
  },
  Premium: {
    definition:
      "The amount you pay to obtain insurance cover. This can be paid monthly or annually.",
    example:
      "Fatima pays ₦25,000 every year for her home insurance. This ₦25,000 is her premium.",
    relatedTerms: ["Policy", "Cover", "Renewal", "Sum Insured"],
  },
  Policy: {
    definition:
      "The document that explains what you are insured for, the conditions and what the insurer will pay.",
    example:
      "Chidi received his motor insurance policy document by email. It explains exactly what damage is covered and what is not.",
    relatedTerms: ["Premium", "Cover", "Exclusion", "Renewal"],
  },
  Cover: {
    definition:
      "The protection your insurance policy provides against specific risks or losses.",
    example:
      "Amaka's home insurance cover includes fire, theft, and flood damage to her property in Lekki.",
    relatedTerms: ["Policy", "Premium", "Exclusion", "Claim"],
  },
  Claim: {
    definition:
      "A request made to the insurer for payment or assistance after an insured event occurs.",
    example:
      "After the flood damaged Amaka's property, she filed a claim with her insurer and received compensation within two weeks.",
    relatedTerms: ["Excess", "Indemnity", "Exclusion", "Claimant"],
  },
  Excess: {
    definition:
      "The amount you may have to contribute toward a claim before the insurer pays the balance.",
    example:
      "Tunde's car repair costs ₦200,000. His policy has a ₦20,000 excess. He pays ₦20,000 and the insurer pays ₦180,000.",
    relatedTerms: ["Claim", "Deductible", "Indemnity"],
  },
  Exclusion: {
    definition:
      "Something the policy does not cover. Always check exclusions before buying.",
    example:
      "Ngozi's travel insurance excludes pre-existing medical conditions. Her diabetes treatment abroad is not covered.",
    relatedTerms: ["Policy", "Cover", "Claim", "Conditions"],
  },
  "Sum Insured": {
    definition:
      "The maximum amount an insurer agrees to cover for an insured item or risk.",
    example:
      "Bola insures her shop contents for ₦5,000,000. If everything is stolen, the maximum she can claim is ₦5,000,000.",
    relatedTerms: ["Premium", "Indemnity", "Replacement Cost"],
  },
  Beneficiary: {
    definition:
      "A person or entity entitled to receive a benefit under certain insurance policies, such as life insurance.",
    example:
      "Kelechi names his daughter as the beneficiary on his life insurance policy.",
    relatedTerms: ["Nominee", "Life Insurance", "Policy"],
  },
  Renewal: {
    definition:
      "Extending insurance cover for another period after the current policy expires.",
    example:
      "Adaeze's car insurance expires in December. She renews it for another year to stay protected.",
    relatedTerms: ["Expiry Date", "Premium", "Policy", "Lapse"],
  },
  "Expiry Date": {
    definition:
      "The date on which insurance cover ends unless renewed.",
    example:
      "Babatunde's motor insurance expires on 31 March. After that date, driving without renewing means he has no cover.",
    relatedTerms: ["Renewal", "Effective Date", "Lapse", "Policy"],
  },
  "Effective Date": {
    definition: "The date from which insurance cover begins.",
    example:
      "Chisom buys insurance on 1 January with an effective date of 1 January. She is covered from that day.",
    relatedTerms: ["Expiry Date", "Policy", "Renewal"],
  },
  Liability: {
    definition:
      "Legal responsibility for injury, damage or loss caused to another person.",
    example:
      "A customer slips in Ola's shop and breaks her arm. Ola may be liable and his public liability insurance covers the legal costs.",
    relatedTerms: ["Third Party", "Indemnity", "Exclusion"],
  },
  Indemnity: {
    definition:
      "Restoring the insured financially to approximately the position they were in before a covered loss.",
    example:
      "After a fire damages Emeka's warehouse, his insurer pays to repair the damage — restoring him to where he was before the fire.",
    relatedTerms: ["Claim", "Compensation", "Sum Insured"],
  },
  Underwriting: {
    definition:
      "The process of assessing risk and deciding whether and on what terms to provide insurance.",
    example:
      "When Folake applies for health insurance, the insurer reviews her medical history to decide her premium — this is underwriting.",
    relatedTerms: ["Risk", "Premium", "Policy", "Material Fact"],
  },
  "Third Party": {
    definition:
      "Someone other than the insured and insurer who may be affected by an insured event.",
    example:
      "Emeka hits another driver's car. That other driver is the third party. Third-party insurance covers damage to their car.",
    relatedTerms: ["Liability", "Motor Insurance", "Claim"],
  },
  Cancellation: {
    definition:
      "Ending an insurance policy before its normal expiry date.",
    example:
      "Adaobi sells her car and no longer needs motor insurance. She cancels her policy and receives a partial refund.",
    relatedTerms: ["Policy", "Renewal", "Lapse", "Refund"],
  },
  "Material Fact": {
    definition:
      "Important information that could influence an insurer's decision to provide cover or set its terms.",
    example:
      "When applying for car insurance, your accident history is a material fact. Hiding it could make your policy invalid.",
    relatedTerms: ["Non-disclosure", "Underwriting", "Policy", "Fraud"],
  },
  "Non-disclosure": {
    definition:
      "Failing to provide relevant information required when applying for insurance.",
    example:
      "Chike does not mention his previous car accident when applying for motor insurance. This non-disclosure could void his policy.",
    relatedTerms: ["Material Fact", "Fraud", "Policy", "Void"],
  },
  Fraud: {
    definition:
      "Deliberately providing false information or making a dishonest claim to obtain an insurance benefit.",
    example:
      "Staging a car accident to make a false insurance claim is fraud and is a criminal offence.",
    relatedTerms: ["Material Fact", "Non-disclosure", "Claim", "Void"],
  },
  Risk: {
    definition: "Something that could cause financial loss or damage.",
    example:
      "Driving on Lagos roads carries risks such as accidents, theft and flooding. Insurance helps manage these risks.",
    relatedTerms: ["Underwriting", "Premium", "Peril", "Cover"],
  },
  Nominee: {
    definition: "A person designated to receive policy benefits.",
    example:
      "When Nkechi fills in her life insurance form, she nominates her husband to receive the payout if she dies.",
    relatedTerms: ["Beneficiary", "Life Insurance", "Policy"],
  },
  Deductible: {
    definition:
      "Another term for the amount the insured contributes before the insurer pays — same as excess.",
    example:
      "Femi's health insurance has a ₦10,000 deductible. He pays the first ₦10,000 of any medical bill.",
    relatedTerms: ["Excess", "Claim", "Premium"],
  },
  Compensation: {
    definition: "Money or another benefit paid for an insured loss.",
    example:
      "After the fire, the insurer paid Amaka ₦3,000,000 in compensation for her lost stock.",
    relatedTerms: ["Claim", "Indemnity", "Sum Insured"],
  },
  Lapse: {
    definition:
      "When a policy stops being active, often because premium payments were not made.",
    example:
      "Tunde forgot to renew his motor insurance. His policy lapsed and he was uninsured when he had an accident.",
    relatedTerms: ["Renewal", "Premium", "Reinstatement", "Cancellation"],
  },
  Reinstatement: {
    definition:
      "Restoring a policy that has previously stopped or lapsed.",
    example:
      "After missing two payments, Chisom paid all outstanding premiums and had her life insurance reinstated.",
    relatedTerms: ["Lapse", "Renewal", "Premium", "Policy"],
  },
  "Insurable Interest": {
    definition:
      "Having a legitimate financial interest in the thing or person being insured.",
    example:
      "You can insure your own car because you have an insurable interest in it. You cannot insure a stranger's car.",
    relatedTerms: ["Policy", "Underwriting", "Risk"],
  },
  Subrogation: {
    definition:
      "The insurer's right, after paying a claim, to pursue recovery from a responsible third party.",
    example:
      "After paying Emeka's claim for damage caused by another driver, the insurer pursues that driver for the money.",
    relatedTerms: ["Claim", "Third Party", "Indemnity"],
  },
};
