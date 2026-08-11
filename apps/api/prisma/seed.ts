import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Motor: ['motor', 'car', 'vehicle', 'auto', 'automobile', 'driving', 'third party', 'comprehensive', 'road', 'accident', 'collision', 'theft', 'transport'],
  Property: ['property', 'home', 'house', 'building', 'contents', 'fire', 'flood', 'burglary', 'landlord', 'tenant', 'office', 'shop', 'real estate'],
  Health: ['health', 'medical', 'hospital', 'doctor', 'illness', 'sickness', 'treatment', 'surgery', 'medicine', 'healthcare', 'hmo', 'outpatient', 'inpatient'],
  Life: ['life', 'death', 'funeral', 'beneficiary', 'family', 'protection', 'term', 'whole life', 'endowment', 'savings'],
  Travel: ['travel', 'holiday', 'vacation', 'trip', 'abroad', 'flight', 'luggage', 'passport', 'visa', 'overseas', 'international', 'tourist'],
  Marine: ['marine', 'cargo', 'ship', 'boat', 'sea', 'ocean', 'freight', 'import', 'export', 'goods in transit', 'water', 'vessel', 'shipping'],
  Engineering: ['engineering', 'machinery', 'equipment', 'construction', 'contractor', 'erection', 'plant', 'industrial', 'factory', 'breakdown'],
  Financial: ['financial', 'money', 'fidelity', 'bond', 'fraud', 'professional', 'indemnity', 'liability', 'directors', 'officers'],
  Liability: ['liability', 'public', 'employer', 'workmen', 'compensation', 'accident', 'injury', 'third party', 'legal'],
  Agriculture: ['agriculture', 'farm', 'crop', 'livestock', 'cattle', 'poultry', 'fish', 'harvest', 'farmer', 'rural'],
};

async function main() {
  const adminPassword = await bcrypt.hash('Admin@123456', 10);
  await prisma.user.upsert({
    where: { email: 'admin@africover247.com' },
    update: {},
    create: {
      email: 'admin@africover247.com',
      firstName: 'AfriCover',
      lastName: 'Admin',
      passwordHash: adminPassword,
      role: 'admin',
      emailVerified: true,
      phone: '08000000000',
    },
  });

  const customerPassword = await bcrypt.hash('Customer@123456', 10);
  await prisma.user.upsert({
    where: { email: 'test@africover247.com' },
    update: {},
    create: {
      email: 'test@africover247.com',
      firstName: 'Test',
      lastName: 'Customer',
      passwordHash: customerPassword,
      role: 'customer',
      emailVerified: true,
      phone: '08012345678',
    },
  });

  const products = [
    {
      name: 'Motor Insurance — 3rd Party (Private Car)',
      category: 'Motor',
      description:
        'Third-party car and motor insurance for private vehicles on the road. Covers damage or injury caused to other people and their property while driving.',
      pricingType: 'fixed' as const,
      premiumAmount: 15000,
      coverageHighlights:
        'Third-party bodily injury\nThird-party property damage\nLegal liability cover',
      exclusions:
        'Own vehicle damage\nTheft of own vehicle\nPersonal accident to driver\nDrunk driving incidents',
      requiredDocuments:
        'Government-issued ID\nProof of address\nVehicle registration document\nVehicle licence',
      durationMonths: 12,
    },
    {
      name: 'Motor Insurance — 3rd Party (Goods Vehicle)',
      category: 'Motor',
      description:
        'Third-party motor insurance for goods-carrying vehicles and trucks on the road. Covers liability to third parties arising from use of the vehicle.',
      pricingType: 'fixed' as const,
      premiumAmount: 30000,
      coverageHighlights:
        'Third-party bodily injury\nThird-party property damage\nLegal liability cover\nGoods vehicle endorsement',
      exclusions:
        'Own vehicle damage\nCargo/goods in transit\nDrunk driving incidents\nUnauthorised use',
      requiredDocuments:
        'Government-issued ID\nProof of address\nVehicle registration document\nVehicle licence\nHackney permit (if applicable)',
      durationMonths: 12,
    },
    {
      name: 'Motor Insurance — 3rd Party (Six Tyre Vehicle)',
      category: 'Motor',
      description:
        'Third-party motor insurance for six-tyre commercial vehicles on the road, including tipper trucks and medium haulage vehicles.',
      pricingType: 'fixed' as const,
      premiumAmount: 50000,
      coverageHighlights:
        'Third-party bodily injury\nThird-party property damage\nLegal liability\nCommercial vehicle endorsement',
      exclusions:
        'Own vehicle damage\nCargo in transit\nDrunk driving\nOverloading incidents',
      requiredDocuments:
        'Government-issued ID\nProof of address\nVehicle registration document\nVehicle licence\nRoad worthiness certificate',
      durationMonths: 12,
    },
    {
      name: 'Motor Insurance — 3rd Party (Trailers / Trucks)',
      category: 'Motor',
      description:
        'Third-party motor insurance for trailers, articulated trucks, and heavy haulage vehicles used on Nigerian roads.',
      pricingType: 'fixed' as const,
      premiumAmount: 100000,
      coverageHighlights:
        'Third-party bodily injury\nThird-party property damage\nLegal liability\nHeavy vehicle endorsement',
      exclusions:
        'Own vehicle damage\nCargo in transit\nDrunk driving\nUnauthorised drivers',
      requiredDocuments:
        'Government-issued ID\nProof of address\nVehicle registration document\nVehicle licence\nRoad worthiness certificate\nHaulage permit',
      durationMonths: 12,
    },
    {
      name: 'Motor Comprehensive Insurance',
      category: 'Motor',
      description:
        'Full comprehensive car and motor insurance covering own vehicle damage, theft, fire, and third-party liability on the road. The most complete motor cover available.',
      pricingType: 'calculable' as const,
      rate: 0.05,
      calculationBasis: 'vehicle market value',
      assetFields: [
        {
          key: 'vehicleValue',
          label: 'Vehicle Market Value (₦)',
          type: 'number',
          required: true,
          hint: 'Current market value of your vehicle in Naira',
        },
        {
          key: 'vehicleMake',
          label: 'Vehicle Make',
          type: 'text',
          required: true,
          hint: 'e.g. Toyota, Honda, Mercedes',
        },
        {
          key: 'vehicleModel',
          label: 'Vehicle Model',
          type: 'text',
          required: true,
          hint: 'e.g. Camry, Civic, E-Class',
        },
        {
          key: 'vehicleYear',
          label: 'Year of Manufacture',
          type: 'number',
          required: true,
          hint: 'e.g. 2020',
        },
        {
          key: 'vehicleColour',
          label: 'Vehicle Colour',
          type: 'text',
          required: true,
        },
        {
          key: 'plateNumber',
          label: 'Plate Number',
          type: 'text',
          required: true,
        },
        {
          key: 'engineNumber',
          label: 'Engine Number',
          type: 'text',
          required: true,
        },
        {
          key: 'chassisNumber',
          label: 'Chassis Number',
          type: 'text',
          required: true,
        },
        {
          key: 'vehicleUse',
          label: 'Vehicle Use',
          type: 'select',
          required: true,
          options: ['Private', 'Commercial'],
        },
      ],
      coverageHighlights:
        'Own damage from accident\nTheft and attempted theft\nFire and explosion\nThird-party bodily injury\nThird-party property damage\nFlood and storm damage',
      exclusions:
        'Drunk driving incidents\nRacing or motorsport use\nMechanical or electrical breakdown\nWear and tear\nUnlicensed driver',
      requiredDocuments:
        'Government-issued ID\nProof of address\nVehicle registration document\nVehicle licence\nPassport photograph',
      durationMonths: 12,
    },
    {
      name: 'Computer / Electronic Equipment Insurance',
      category: 'Property',
      description:
        'All-risk insurance for computers, servers, electronic equipment, and related peripherals against accidental damage, theft, and electrical breakdown.',
      pricingType: 'calculable' as const,
      rate: 0.01,
      calculationBasis: 'equipment replacement value',
      assetFields: [
        {
          key: 'equipmentValue',
          label: 'Total Equipment Replacement Value (₦)',
          type: 'number',
          required: true,
          hint: 'Cost to replace all equipment at current market prices',
        },
        {
          key: 'equipmentLocation',
          label: 'Location of Equipment',
          type: 'text',
          required: true,
          hint: 'Address where equipment is kept',
        },
        {
          key: 'mainItems',
          label: 'List of Main Items',
          type: 'textarea',
          required: true,
          hint: 'e.g. 5 Dell laptops, 2 HP servers, 10 monitors',
        },
        {
          key: 'securityMeasures',
          label: 'Security Measures in Place',
          type: 'text',
          required: false,
          hint: 'e.g. CCTV, alarm, security guard',
        },
      ],
      coverageHighlights:
        'Accidental damage\nTheft and burglary\nElectrical and mechanical breakdown\nPower surge damage\nData recovery costs',
      exclusions:
        'Software and data loss\nWear and tear\nConsumables (ink, paper, etc.)\nDamage during transport unless specified\nViruses and malware',
      requiredDocuments:
        'Government-issued ID\nProof of address\nEquipment list with values\nPurchase receipts (if available)',
      durationMonths: 12,
    },
    {
      name: 'Plant All Risk / Machinery Breakdown Insurance',
      category: 'Engineering',
      description:
        'Comprehensive insurance for industrial plant, machinery, and equipment against sudden and unforeseen physical damage and breakdown.',
      pricingType: 'calculable' as const,
      rate: 0.01,
      calculationBasis: 'plant and machinery replacement value',
      assetFields: [
        {
          key: 'plantValue',
          label: 'Plant / Machinery Replacement Value (₦)',
          type: 'number',
          required: true,
          hint: 'Cost to replace the plant or machinery at current prices',
        },
        {
          key: 'machineryType',
          label: 'Type of Machinery',
          type: 'text',
          required: true,
          hint: 'e.g. generator, excavator, printing press, lathe machine',
        },
        {
          key: 'location',
          label: 'Location of Plant',
          type: 'text',
          required: true,
        },
        {
          key: 'yearOfManufacture',
          label: 'Year of Manufacture',
          type: 'number',
          required: true,
        },
        {
          key: 'manufacturer',
          label: 'Manufacturer / Brand',
          type: 'text',
          required: false,
        },
        {
          key: 'serialNumber',
          label: 'Serial Number',
          type: 'text',
          required: false,
        },
      ],
      coverageHighlights:
        'Sudden and unforeseen physical damage\nMechanical and electrical breakdown\nOperator error\nExplosion and implosion\nShort circuit damage',
      exclusions:
        'Wear and tear\nCorrosion and rust\nDamage during overhaul or maintenance\nConsequential losses\nObsolete parts unavailability',
      requiredDocuments:
        'Government-issued ID\nProof of address\nMachinery purchase documents or valuation\nMaintenance records (if available)',
      durationMonths: 12,
    },
    {
      name: 'Group Life Assurance (Individual)',
      category: 'Life',
      description:
        'Individual life assurance providing a lump sum payment to beneficiaries in the event of death of the life assured during the policy period.',
      pricingType: 'calculable' as const,
      rate: 0.0006,
      calculationBasis: 'sum assured per ₦1,000',
      assetFields: [
        {
          key: 'sumAssured',
          label: 'Sum Assured (₦)',
          type: 'number',
          required: true,
          hint: 'The amount your beneficiaries will receive in the event of your death',
        },
        {
          key: 'dateOfBirth',
          label: 'Date of Birth',
          type: 'date',
          required: true,
        },
        {
          key: 'occupation',
          label: 'Occupation',
          type: 'text',
          required: true,
        },
        {
          key: 'healthStatus',
          label: 'Current Health Status',
          type: 'select',
          required: true,
          options: ['Good', 'Fair', 'Poor'],
        },
        {
          key: 'beneficiaryName',
          label: 'Beneficiary Full Name',
          type: 'text',
          required: true,
        },
        {
          key: 'beneficiaryRelationship',
          label: 'Relationship to Beneficiary',
          type: 'text',
          required: true,
          hint: 'e.g. Spouse, Child, Parent',
        },
      ],
      coverageHighlights:
        'Lump sum payment on death\nCovers natural and accidental death\nNominated beneficiary receives payout\nNo medical examination required for standard cover',
      exclusions:
        'Suicide within first two years\nDeath resulting from criminal acts\nWar and civil unrest\nDeath from pre-disclosed terminal conditions',
      requiredDocuments:
        'Government-issued ID\nProof of address\nPassport photograph\nBirth certificate or age declaration',
      durationMonths: 12,
    },
    {
      name: 'Money Insurance',
      category: 'Financial',
      description:
        'Insurance covering loss of money — cash, cheques, and other negotiable instruments — while on the business premises or in transit.',
      pricingType: 'calculable' as const,
      rate: 0.01,
      calculationBasis: 'sum insured',
      assetFields: [
        {
          key: 'sumInsured',
          label: 'Amount to Insure (₦)',
          type: 'number',
          required: true,
          hint: 'Maximum amount of money held at any one time',
        },
        {
          key: 'moneyType',
          label: 'Type of Money',
          type: 'select',
          required: true,
          options: ['Cash only', 'Cheques only', 'Both cash and cheques'],
        },
        {
          key: 'storageMethod',
          label: 'Storage Method',
          type: 'select',
          required: true,
          options: ['Safe', 'Vault', 'Cash till / drawer', 'Mixed'],
        },
        {
          key: 'businessAddress',
          label: 'Business Address',
          type: 'text',
          required: true,
        },
        {
          key: 'securityMeasures',
          label: 'Security Measures',
          type: 'text',
          required: false,
          hint: 'e.g. CCTV, alarm, security guard, safe rating',
        },
      ],
      coverageHighlights:
        'Loss of cash on premises\nLoss during transit to/from bank\nLoss by theft, robbery, or burglary\nLoss of cheques and negotiable instruments',
      exclusions:
        'Mysterious disappearance without evidence of theft\nLoss by fraud or dishonesty of employees (see Fidelity Guaranty)\nAccounting errors\nCounterfeit currency',
      requiredDocuments:
        'Government-issued ID\nProof of business address\nBank statements (last 3 months)',
      durationMonths: 12,
    },
    {
      name: 'Fire & Special Perils Insurance',
      category: 'Property',
      description:
        'Home and building insurance against loss or damage to property caused by fire, lightning, explosion, and a range of special perils including flood and storm.',
      pricingType: 'quote_based' as const,
      assetFields: [
        {
          key: 'propertyValue',
          label: 'Property / Contents Value (₦)',
          type: 'number',
          required: true,
        },
        {
          key: 'propertyType',
          label: 'Property Type',
          type: 'select',
          required: true,
          options: ['Residential', 'Commercial', 'Industrial', 'Mixed use'],
        },
        {
          key: 'propertyAddress',
          label: 'Property Address',
          type: 'text',
          required: true,
        },
        {
          key: 'constructionType',
          label: 'Construction Type',
          type: 'select',
          required: true,
          options: ['Concrete/brick', 'Steel frame', 'Wooden frame', 'Mixed'],
        },
        {
          key: 'occupancy',
          label: 'Property Occupancy',
          type: 'select',
          required: true,
          options: ['Owner occupied', 'Tenanted', 'Partly tenanted', 'Unoccupied'],
        },
        {
          key: 'fireProtection',
          label: 'Fire Protection Measures',
          type: 'text',
          required: false,
          hint: 'e.g. fire extinguishers, sprinkler system, smoke detectors',
        },
        {
          key: 'previousLosses',
          label: 'Any fire losses in the last 5 years?',
          type: 'select',
          required: true,
          options: ['No', 'Yes'],
        },
        {
          key: 'previousLossDetails',
          label: 'If yes, provide details',
          type: 'textarea',
          required: false,
        },
      ],
      coverageHighlights:
        'Fire and lightning damage\nExplosion\nAircraft and vehicle impact\nFlood and storm\nBush fire\nSprinkler leakage',
      exclusions:
        'Earthquake and volcanic eruption\nWar and civil unrest\nNuclear risks\nInherent vice or gradual deterioration\nTheft following damage (unless combined with burglary)',
      requiredDocuments:
        'Government-issued ID\nProof of property ownership or tenancy\nProperty valuation report',
      durationMonths: 12,
    },
    {
      name: 'Burglary / Housebreaking Insurance',
      category: 'Property',
      description:
        'Home and house burglary insurance against loss or damage to contents and property caused by theft involving forcible and violent entry or exit.',
      pricingType: 'quote_based' as const,
      assetFields: [
        {
          key: 'contentsValue',
          label: 'Contents Value (₦)',
          type: 'number',
          required: true,
          hint: 'Total value of all items to be insured',
        },
        {
          key: 'propertyType',
          label: 'Property Type',
          type: 'select',
          required: true,
          options: ['Residential', 'Commercial', 'Office', 'Warehouse'],
        },
        {
          key: 'propertyAddress',
          label: 'Property Address',
          type: 'text',
          required: true,
        },
        {
          key: 'securityFeatures',
          label: 'Security Features',
          type: 'text',
          required: true,
          hint: 'e.g. burglar alarm, CCTV, security bars, guard',
        },
        {
          key: 'previousClaims',
          label: 'Any burglary claims in the last 5 years?',
          type: 'select',
          required: true,
          options: ['No', 'Yes'],
        },
        {
          key: 'previousClaimDetails',
          label: 'If yes, provide details',
          type: 'textarea',
          required: false,
        },
      ],
      coverageHighlights:
        'Theft by forcible entry\nDamage to premises during break-in\nTheft by violence or threat of violence\nDamage to contents during burglary attempt',
      exclusions:
        'Theft without evidence of forcible entry\nEmployee theft (see Fidelity Guaranty)\nMoney and securities (see Money Insurance)\nJewellery above specified limit without declaration',
      requiredDocuments:
        'Government-issued ID\nProof of property address\nList of insured items with values',
      durationMonths: 12,
    },
    {
      name: 'Goods in Transit Insurance',
      category: 'Marine',
      description:
        'Insurance covering goods and merchandise against loss or damage while being transported by road within Nigeria.',
      pricingType: 'quote_based' as const,
      assetFields: [
        {
          key: 'cargoValue',
          label: 'Cargo Value (₦)',
          type: 'number',
          required: true,
        },
        {
          key: 'goodsType',
          label: 'Type of Goods',
          type: 'text',
          required: true,
          hint: 'Describe the goods being transported',
        },
        {
          key: 'origin',
          label: 'Origin / Loading Point',
          type: 'text',
          required: true,
        },
        {
          key: 'destination',
          label: 'Destination / Delivery Point',
          type: 'text',
          required: true,
        },
        {
          key: 'transportMode',
          label: 'Mode of Transport',
          type: 'select',
          required: true,
          options: ['Road', 'Rail', 'Air', 'Water', 'Mixed'],
        },
        {
          key: 'frequency',
          label: 'Trip Frequency',
          type: 'select',
          required: true,
          options: ['Single trip', 'Multiple trips (annual policy)'],
        },
        {
          key: 'packagingType',
          label: 'Packaging Type',
          type: 'text',
          required: false,
          hint: 'e.g. crates, cartons, pallets, drums',
        },
        {
          key: 'vehicleType',
          label: 'Type of Transporting Vehicle',
          type: 'text',
          required: false,
        },
      ],
      coverageHighlights:
        'Loss or damage during transit\nTheft from vehicle\nAccident damage\nFire during transit\nLoading and unloading risks',
      exclusions:
        'Perishable goods deterioration\nLeakage from normal wear\nDelay losses\nInadequate packaging\nContraband or illegal goods',
      requiredDocuments:
        'Government-issued ID\nProof of business address\nWaybill or delivery note (for single trip)',
      durationMonths: 12,
    },
    {
      name: 'Fidelity Guaranty Insurance',
      category: 'Financial',
      description:
        'Insurance protecting businesses against financial loss caused by the dishonest or fraudulent acts of employees.',
      pricingType: 'quote_based' as const,
      assetFields: [
        {
          key: 'sumInsured',
          label: 'Sum Insured (₦)',
          type: 'number',
          required: true,
          hint: 'Maximum loss you want to cover per employee or in total',
        },
        {
          key: 'numberOfEmployees',
          label: 'Number of Employees to be Covered',
          type: 'number',
          required: true,
        },
        {
          key: 'businessNature',
          label: 'Nature of Business',
          type: 'text',
          required: true,
        },
        {
          key: 'employeesHandlingCash',
          label: 'Do covered employees handle cash or valuables?',
          type: 'select',
          required: true,
          options: ['Yes', 'No'],
        },
        {
          key: 'internalControls',
          label: 'Internal Controls in Place',
          type: 'textarea',
          required: false,
          hint: 'e.g. dual authorisation, monthly reconciliation, audit',
        },
        {
          key: 'previousLosses',
          label: 'Any employee dishonesty losses in the last 5 years?',
          type: 'select',
          required: true,
          options: ['No', 'Yes'],
        },
      ],
      coverageHighlights:
        'Employee theft of money\nEmployee theft of goods or stock\nFraud and forgery by employees\nComputer fraud by employees',
      exclusions:
        'Losses discovered more than 12 months after occurrence\nThird-party fraud (not employees)\nKnown dishonest employees at policy inception\nAccounting errors',
      requiredDocuments:
        'Government-issued ID\nProof of business address\nList of employees to be covered\nLast audited accounts',
      durationMonths: 12,
    },
    {
      name: 'Public / Product Liability Insurance',
      category: 'Liability',
      description:
        'Insurance protecting businesses against legal liability for bodily injury or property damage caused to third parties arising from business operations or products.',
      pricingType: 'quote_based' as const,
      assetFields: [
        {
          key: 'sumInsured',
          label: 'Limit of Indemnity (₦)',
          type: 'number',
          required: true,
          hint: 'Maximum amount the insurer will pay per claim or in total',
        },
        {
          key: 'businessNature',
          label: 'Nature of Business / Operations',
          type: 'textarea',
          required: true,
        },
        {
          key: 'numberOfEmployees',
          label: 'Number of Employees',
          type: 'number',
          required: true,
        },
        {
          key: 'annualTurnover',
          label: 'Annual Turnover (₦)',
          type: 'number',
          required: true,
        },
        {
          key: 'businessPremises',
          label: 'Business Premises Address',
          type: 'text',
          required: true,
        },
        {
          key: 'productsManufactured',
          label: 'Products Manufactured or Sold (if applicable)',
          type: 'textarea',
          required: false,
        },
        {
          key: 'previousClaims',
          label: 'Any liability claims in the last 5 years?',
          type: 'select',
          required: true,
          options: ['No', 'Yes'],
        },
      ],
      coverageHighlights:
        'Third-party bodily injury\nThird-party property damage\nLegal defence costs\nProduct liability (if included)\nPremises liability',
      exclusions:
        "Employee injuries (see Workmen's Compensation)\nProfessional advice liability (see Professional Indemnity)\nContractual liability\nIntentional acts\nPollution",
      requiredDocuments:
        'Government-issued ID\nProof of business address\nBusiness registration documents',
      durationMonths: 12,
    },
    {
      name: 'Professional Indemnity Insurance',
      category: 'Liability',
      description:
        'Insurance protecting professionals against claims of negligence, errors, or omissions arising from the provision of professional services.',
      pricingType: 'quote_based' as const,
      assetFields: [
        {
          key: 'sumInsured',
          label: 'Limit of Indemnity (₦)',
          type: 'number',
          required: true,
        },
        {
          key: 'profession',
          label: 'Profession / Type of Service',
          type: 'text',
          required: true,
          hint: 'e.g. Architect, Lawyer, Accountant, Consultant, Doctor',
        },
        {
          key: 'yearsInPractice',
          label: 'Years in Practice',
          type: 'number',
          required: true,
        },
        {
          key: 'annualFeeIncome',
          label: 'Annual Fee Income (₦)',
          type: 'number',
          required: true,
        },
        {
          key: 'numberOfProfessionals',
          label: 'Number of Qualified Professionals in Firm',
          type: 'number',
          required: true,
        },
        {
          key: 'clientType',
          label: 'Typical Client Type',
          type: 'text',
          required: false,
          hint: 'e.g. individuals, SMEs, large corporations, government',
        },
        {
          key: 'previousClaims',
          label: 'Any professional indemnity claims in the last 5 years?',
          type: 'select',
          required: true,
          options: ['No', 'Yes'],
        },
      ],
      coverageHighlights:
        'Negligence and errors in professional advice\nOmissions in professional services\nBreed of professional duty\nLegal defence costs\nMitigating loss costs',
      exclusions:
        'Deliberate dishonest acts\nCriminal fines and penalties\nBodily injury and property damage (see liability)\nDisputes over fees\nKnown claims at inception',
      requiredDocuments:
        'Government-issued ID\nProfessional qualification certificates\nProof of business address',
      durationMonths: 12,
    },
    {
      name: 'Agric Insurance',
      category: 'Agriculture',
      description:
        'Insurance protecting farmers and agribusinesses against losses to crops, livestock, and farm equipment arising from natural perils and other insured risks.',
      pricingType: 'quote_based' as const,
      assetFields: [
        {
          key: 'farmValue',
          label: 'Total Farm / Livestock Value (₦)',
          type: 'number',
          required: true,
        },
        {
          key: 'insuranceType',
          label: 'Type of Agricultural Insurance',
          type: 'select',
          required: true,
          options: [
            'Crop insurance',
            'Livestock insurance',
            'Both crops and livestock',
            'Farm equipment',
          ],
        },
        {
          key: 'cropType',
          label: 'Type of Crop (if applicable)',
          type: 'text',
          required: false,
          hint: 'e.g. maize, rice, cassava, vegetables',
        },
        {
          key: 'livestockType',
          label: 'Type of Livestock (if applicable)',
          type: 'text',
          required: false,
          hint: 'e.g. cattle, poultry, fish farming',
        },
        {
          key: 'farmSize',
          label: 'Farm Size (hectares)',
          type: 'number',
          required: true,
        },
        {
          key: 'farmLocation',
          label: 'Farm Location (State and LGA)',
          type: 'text',
          required: true,
        },
        {
          key: 'irrigationSystem',
          label: 'Irrigation System in Use?',
          type: 'select',
          required: false,
          options: [
            'None — rain-fed only',
            'Drip irrigation',
            'Sprinkler',
            'Flood irrigation',
          ],
        },
        {
          key: 'previousLosses',
          label: 'Any agricultural losses in the last 3 years?',
          type: 'select',
          required: true,
          options: ['No', 'Yes'],
        },
      ],
      coverageHighlights:
        'Crop failure from drought or flood\nLivestock death from disease or accident\nFire damage to farm\nPest and disease outbreak\nStorm and hail damage',
      exclusions:
        'Market price fluctuations\nVoluntary destruction by farmer\nNeglect or poor farming practices\nWar and civil unrest\nNuclear contamination',
      requiredDocuments:
        'Government-issued ID\nProof of farm ownership or lease\nFarm registration (if applicable)',
      durationMonths: 12,
    },
    {
      name: 'Bond Insurance',
      category: 'Financial',
      description:
        'Surety bond insurance providing financial guarantee that contractual obligations will be fulfilled. Covers performance bonds, advance payment bonds, and bid bonds.',
      pricingType: 'quote_based' as const,
      assetFields: [
        {
          key: 'bondValue',
          label: 'Bond Value (₦)',
          type: 'number',
          required: true,
        },
        {
          key: 'bondType',
          label: 'Type of Bond',
          type: 'select',
          required: true,
          options: [
            'Performance bond',
            'Advance payment bond',
            'Bid bond',
            'Customs bond',
            'Court bond',
          ],
        },
        {
          key: 'contractDuration',
          label: 'Contract Duration (months)',
          type: 'number',
          required: true,
        },
        {
          key: 'principalName',
          label: 'Principal / Obligee Name',
          type: 'text',
          required: true,
          hint: 'The party requiring the bond (e.g. government agency, client)',
        },
        {
          key: 'contractDescription',
          label: 'Brief Description of Contract / Obligation',
          type: 'textarea',
          required: true,
        },
        {
          key: 'previousBonds',
          label: 'Have you held bonds before?',
          type: 'select',
          required: true,
          options: ['No', 'Yes'],
        },
        {
          key: 'previousDefaultHistory',
          label: 'Any bond defaults in the last 5 years?',
          type: 'select',
          required: true,
          options: ['No', 'Yes'],
        },
      ],
      coverageHighlights:
        'Performance guarantee\nAdvance payment protection\nBid security\nFinancial guarantee to obligee\nLegal compliance assurance',
      exclusions:
        "Losses due to obligee's own default\nChanges in contract scope without insurer consent\nForce majeure events (unless specified)\nBeyond bond expiry date",
      requiredDocuments:
        'Government-issued ID\nBusiness registration documents\nContract documents or tender documents\nLast 3 years audited accounts',
      durationMonths: 12,
    },
    {
      name: 'Credit Life / Keyman Insurance',
      category: 'Life',
      description:
        'Insurance that pays off outstanding loans or provides business continuity funds in the event of death or permanent disability of the insured person.',
      pricingType: 'quote_based' as const,
      assetFields: [
        {
          key: 'sumInsured',
          label: 'Sum Insured (₦)',
          type: 'number',
          required: true,
          hint: 'Loan amount (credit life) or estimated business impact (keyman)',
        },
        {
          key: 'insuranceType',
          label: 'Type of Cover',
          type: 'select',
          required: true,
          options: ['Credit Life (loan protection)', 'Keyman (business continuity)'],
        },
        {
          key: 'lifeAssuredName',
          label: 'Name of Life Assured',
          type: 'text',
          required: true,
        },
        {
          key: 'dateOfBirth',
          label: 'Date of Birth of Life Assured',
          type: 'date',
          required: true,
        },
        {
          key: 'occupation',
          label: 'Occupation / Role in Business',
          type: 'text',
          required: true,
        },
        {
          key: 'loanAmount',
          label: 'Loan Amount (₦) — for Credit Life only',
          type: 'number',
          required: false,
        },
        {
          key: 'lenderName',
          label: 'Name of Lender — for Credit Life only',
          type: 'text',
          required: false,
        },
        {
          key: 'healthStatus',
          label: 'Current Health Status',
          type: 'select',
          required: true,
          options: ['Good', 'Fair', 'Poor'],
        },
        {
          key: 'existingConditions',
          label: 'Any existing medical conditions?',
          type: 'textarea',
          required: false,
        },
      ],
      coverageHighlights:
        'Loan repayment on death\nPermanent disability cover\nBusiness continuity protection\nLump sum or decreasing benefit options',
      exclusions:
        'Suicide within first two years\nPre-existing undisclosed conditions\nSelf-inflicted injury\nWar and civil unrest\nCriminal acts',
      requiredDocuments:
        'Government-issued ID\nPassport photograph\nLoan agreement documents (for credit life)\nMedical report (for large sums assured)',
      durationMonths: 12,
    },
    {
      name: 'Marine Cargo Insurance',
      category: 'Marine',
      description:
        'Insurance covering goods and merchandise against loss or damage during sea, air, or road transit across international and domestic routes.',
      pricingType: 'quote_based' as const,
      assetFields: [
        {
          key: 'cargoValue',
          label: 'Cargo Value (₦)',
          type: 'number',
          required: true,
        },
        {
          key: 'goodsType',
          label: 'Type of Goods / Cargo',
          type: 'text',
          required: true,
        },
        {
          key: 'originPort',
          label: 'Port of Origin / Loading Point',
          type: 'text',
          required: true,
        },
        {
          key: 'destinationPort',
          label: 'Port of Destination',
          type: 'text',
          required: true,
        },
        {
          key: 'shippingMethod',
          label: 'Shipping Method',
          type: 'select',
          required: true,
          options: ['Sea freight', 'Air freight', 'Road', 'Water', 'Multimodal'],
        },
        {
          key: 'voyageFrequency',
          label: 'Voyage Frequency',
          type: 'select',
          required: true,
          options: ['Single voyage', 'Open cover (multiple voyages)'],
        },
        {
          key: 'packagingType',
          label: 'Packaging Type',
          type: 'text',
          required: true,
          hint: 'e.g. containers, crates, drums, bulk',
        },
        {
          key: 'specialHazards',
          label: 'Any Special Hazards or Conditions',
          type: 'textarea',
          required: false,
          hint: 'e.g. hazardous materials, refrigerated cargo, oversized items',
        },
      ],
      coverageHighlights:
        'Loss or damage during sea transit\nTheft and piracy\nWeather damage\nLoading and unloading risk\nWarehouse storage (limited period)',
      exclusions:
        'Inherent vice or nature of goods\nDelay losses\nWar risks (unless specified)\nNuclear risks\nImproper packing',
      requiredDocuments:
        'Government-issued ID\nBill of lading or airway bill\nCommercial invoice\nPacking list',
      durationMonths: 12,
    },
    {
      name: 'Marine Hull Insurance',
      category: 'Marine',
      description:
        'Insurance covering physical loss or damage to vessels — boats, ships, and other watercraft — including machinery and equipment on board.',
      pricingType: 'quote_based' as const,
      assetFields: [
        {
          key: 'vesselValue',
          label: 'Vessel Insured Value (₦)',
          type: 'number',
          required: true,
        },
        {
          key: 'vesselType',
          label: 'Type of Vessel',
          type: 'select',
          required: true,
          options: [
            'Speed boat',
            'Ferry',
            'Cargo vessel',
            'Fishing boat',
            'Oil rig vessel',
            'Other',
          ],
        },
        {
          key: 'vesselAge',
          label: 'Age of Vessel (years)',
          type: 'number',
          required: true,
        },
        {
          key: 'registrationNumber',
          label: 'Vessel Registration Number',
          type: 'text',
          required: true,
        },
        {
          key: 'tradingArea',
          label: 'Trading Area / Waters',
          type: 'text',
          required: true,
          hint: 'e.g. Lagos lagoon, River Niger, Atlantic coast',
        },
        {
          key: 'intendedUse',
          label: 'Intended Use',
          type: 'select',
          required: true,
          options: [
            'Passenger transport',
            'Cargo transport',
            'Fishing',
            'Pleasure/leisure',
            'Oil and gas support',
          ],
        },
        {
          key: 'surveyDate',
          label: 'Date of Last Survey',
          type: 'date',
          required: false,
        },
        {
          key: 'crewSize',
          label: 'Number of Crew Members',
          type: 'number',
          required: false,
        },
      ],
      coverageHighlights:
        'Physical loss or damage to vessel\nMachinery damage\nCollision liability\nFire and explosion on board\nSinking and stranding',
      exclusions:
        'Wear and tear\nDry rot and marine growth\nWar and piracy (unless specified)\nUnseaworthiness if known to owner\nOperating outside agreed trading area',
      requiredDocuments:
        'Government-issued ID\nVessel registration documents\nSurvey report\nProof of ownership',
      durationMonths: 12,
    },
    {
      name: 'Health Insurance',
      category: 'Health',
      description:
        'Comprehensive medical and hospital insurance covering inpatient and outpatient healthcare expenses for individuals and families at accredited hospitals across Nigeria.',
      pricingType: 'quote_based' as const,
      assetFields: [
        {
          key: 'numberOfLives',
          label: 'Number of Lives to be Covered',
          type: 'number',
          required: true,
        },
        {
          key: 'coverageType',
          label: 'Coverage Type Required',
          type: 'select',
          required: true,
          options: ['Outpatient only', 'Inpatient only', 'Both inpatient and outpatient'],
        },
        {
          key: 'ageRange',
          label: 'Age Range of Members',
          type: 'text',
          required: true,
          hint: 'e.g. 25-45 years, or list ages if few members',
        },
        {
          key: 'preferredHospitals',
          label: 'Preferred Hospital(s)',
          type: 'textarea',
          required: false,
          hint: 'List preferred hospitals or areas for treatment',
        },
        {
          key: 'existingConditions',
          label: 'Any pre-existing medical conditions among members?',
          type: 'select',
          required: true,
          options: ['None', 'Yes — will provide details'],
        },
        {
          key: 'existingConditionDetails',
          label: 'If yes, describe the conditions',
          type: 'textarea',
          required: false,
        },
        {
          key: 'maternityCover',
          label: 'Is maternity cover required?',
          type: 'select',
          required: true,
          options: ['No', 'Yes'],
        },
        {
          key: 'dentalOptical',
          label: 'Is dental and optical cover required?',
          type: 'select',
          required: true,
          options: ['No', 'Yes — dental only', 'Yes — optical only', 'Yes — both'],
        },
      ],
      coverageHighlights:
        'Inpatient hospitalisation\nOutpatient consultations\nSurgical procedures\nLaboratory and diagnostics\nEmergency treatment\nMaternity cover (if selected)',
      exclusions:
        'Cosmetic procedures\nExperimental treatments\nSelf-inflicted injuries\nSubstance abuse treatment\nPre-existing conditions (subject to waiting period)',
      requiredDocuments:
        'Government-issued ID\nPassport photograph for each member\nCompleted health declaration form',
      durationMonths: 12,
    },
    {
      name: 'Travel Insurance',
      category: 'Travel',
      description:
        'Holiday and travel cover for trips abroad or at home — insurance for vacation travellers against unexpected events including medical emergencies abroad, trip cancellation, and lost baggage.',
      pricingType: 'quote_based' as const,
      assetFields: [
        {
          key: 'destinationCountry',
          label: 'Destination Country / Countries',
          type: 'text',
          required: true,
        },
        {
          key: 'departureDate',
          label: 'Departure Date',
          type: 'date',
          required: true,
        },
        {
          key: 'returnDate',
          label: 'Return Date',
          type: 'date',
          required: true,
        },
        {
          key: 'numberOfTravellers',
          label: 'Number of Travellers',
          type: 'number',
          required: true,
        },
        {
          key: 'travellersAges',
          label: 'Ages of Travellers',
          type: 'text',
          required: true,
          hint: 'e.g. 35, 33, 8, 5',
        },
        {
          key: 'purposeOfTravel',
          label: 'Purpose of Travel',
          type: 'select',
          required: true,
          options: ['Tourism / holiday', 'Business', 'Education / student', 'Medical', 'Other'],
        },
        {
          key: 'existingConditions',
          label: 'Any existing health conditions among travellers?',
          type: 'select',
          required: true,
          options: ['None', 'Yes — will provide details'],
        },
        {
          key: 'existingConditionDetails',
          label: 'If yes, describe',
          type: 'textarea',
          required: false,
        },
        {
          key: 'coverRequired',
          label: 'Additional Cover Required',
          type: 'text',
          required: false,
          hint: 'e.g. adventure sports, trip cancellation, rental car',
        },
      ],
      coverageHighlights:
        'Emergency medical expenses abroad\nMedical evacuation and repatriation\nTrip cancellation and curtailment\nBaggage loss and delay\nPassport and document loss\nPersonal liability abroad',
      exclusions:
        'Pre-existing undisclosed conditions\nAdventure sports without endorsement\nTravel to war zones\nAlcohol or drug-related incidents\nVisa refusal costs',
      requiredDocuments:
        'Government-issued ID (passport)\nTravel itinerary or flight booking',
      durationMonths: 1,
    },
    {
      name: "Contractors' All Risk Insurance",
      category: 'Engineering',
      description:
        'Comprehensive insurance for construction projects covering physical loss or damage to contract works, plant, and equipment, plus third-party liability arising from construction activities.',
      pricingType: 'quote_based' as const,
      assetFields: [
        {
          key: 'contractValue',
          label: 'Total Contract Value (₦)',
          type: 'number',
          required: true,
        },
        {
          key: 'projectType',
          label: 'Type of Project',
          type: 'select',
          required: true,
          options: [
            'Building construction',
            'Civil engineering',
            'Road construction',
            'Bridge construction',
            'Industrial installation',
            'Other',
          ],
        },
        {
          key: 'projectLocation',
          label: 'Project Location (State and LGA)',
          type: 'text',
          required: true,
        },
        {
          key: 'projectDuration',
          label: 'Project Duration (months)',
          type: 'number',
          required: true,
        },
        {
          key: 'numberOfWorkers',
          label: 'Number of Workers on Site',
          type: 'number',
          required: true,
        },
        {
          key: 'subContractors',
          label: 'Are sub-contractors involved?',
          type: 'select',
          required: true,
          options: ['No', 'Yes'],
        },
        {
          key: 'subContractorDetails',
          label: 'If yes, describe sub-contractor works',
          type: 'textarea',
          required: false,
        },
        {
          key: 'projectDescription',
          label: 'Brief Project Description',
          type: 'textarea',
          required: true,
        },
        {
          key: 'thirdPartyLiabilityLimit',
          label: 'Third-Party Liability Limit Required (₦)',
          type: 'number',
          required: false,
        },
      ],
      coverageHighlights:
        'Physical damage to contract works\nPlant and equipment damage\nThird-party liability\nClearing and removal of debris\nSurrounding property protection',
      exclusions:
        'Design defects\nWear and tear\nConsequential losses\nPre-existing damage\nWar and nuclear risks',
      requiredDocuments:
        'Government-issued ID\nContract documents\nBill of quantities or project drawings\nBusiness registration documents',
      durationMonths: 12,
    },
    {
      name: "Combined Workmen's Compensation / Group Personal Accident",
      category: 'Liability',
      description:
        'Insurance providing statutory compensation to employees injured, disabled, or killed during the course of their employment, combined with group personal accident benefits.',
      pricingType: 'quote_based' as const,
      assetFields: [
        {
          key: 'numberOfEmployees',
          label: 'Total Number of Employees',
          type: 'number',
          required: true,
        },
        {
          key: 'industryType',
          label: 'Nature of Work / Industry',
          type: 'text',
          required: true,
          hint: 'e.g. construction, manufacturing, oil and gas, office work',
        },
        {
          key: 'annualSalaryBill',
          label: 'Annual Salary Bill (₦)',
          type: 'number',
          required: true,
          hint: 'Total annual wages and salaries paid to all employees',
        },
        {
          key: 'workLocations',
          label: 'Work Location(s)',
          type: 'textarea',
          required: true,
          hint: 'List all locations where employees work',
        },
        {
          key: 'hazardousWork',
          label: 'Do employees perform hazardous work?',
          type: 'select',
          required: true,
          options: [
            'No',
            'Yes — at height',
            'Yes — with heavy machinery',
            'Yes — with chemicals',
            'Yes — other',
          ],
        },
        {
          key: 'accidentHistory',
          label: 'Workplace accidents in the last 3 years',
          type: 'select',
          required: true,
          options: ['None', '1-2 minor accidents', '3 or more accidents', 'Any fatality'],
        },
        {
          key: 'accidentDetails',
          label: 'If accidents occurred, provide brief details',
          type: 'textarea',
          required: false,
        },
        {
          key: 'safetyMeasures',
          label: 'Safety Measures in Place',
          type: 'textarea',
          required: false,
          hint: 'e.g. PPE provided, safety training, health and safety officer',
        },
      ],
      coverageHighlights:
        'Death benefit to family\nPermanent total disability lump sum\nTemporary total disability weekly benefit\nMedical expenses for work injuries\nLegal liability to employees',
      exclusions:
        'Injuries outside scope of employment\nSelf-inflicted injuries\nAlcohol or drug-related incidents\nPre-existing disabilities\nWar and civil unrest',
      requiredDocuments:
        'Government-issued ID\nBusiness registration documents\nEmployee list with job titles and salaries\nProof of business address',
      durationMonths: 12,
    },
  ];

  for (const product of products) {
    const item = product as any;
    const keywords = CATEGORY_KEYWORDS[item.category] ?? [];
    const data = {
      ...item,
      keywords,
      premiumAmount: item.premiumAmount ?? null,
      rate: item.rate ?? null,
      rateMin: item.rateMin ?? null,
      rateMax: item.rateMax ?? null,
      calculationBasis: item.calculationBasis ?? null,
      assetFields: item.assetFields ?? null,
    };

    const existing = await prisma.product.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { keywords },
      });
    } else {
      await prisma.product.create({ data: data as any });
    }
  }

  console.log(`Seeded ${products.length} products`);
  console.log('Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
