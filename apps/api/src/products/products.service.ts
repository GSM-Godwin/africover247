import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const SYNONYMS: Record<string, string[]> = {
  car: ['motor', 'vehicle', 'automobile', 'auto'],
  vehicle: ['motor', 'car', 'automobile', 'auto'],
  automobile: ['motor', 'car', 'vehicle'],
  auto: ['motor', 'car', 'vehicle'],
  truck: ['motor', 'vehicle', 'haulage', 'commercial'],
  bus: ['motor', 'vehicle', 'commercial', 'transport'],
  bike: ['motor', 'vehicle', 'motorcycle'],
  motorcycle: ['motor', 'vehicle', 'bike'],
  driving: ['motor', 'vehicle', 'road'],
  accident: ['motor', 'health', 'claim', 'collision'],
  crash: ['motor', 'accident', 'collision', 'vehicle'],
  collision: ['motor', 'accident', 'crash'],
  theft: ['motor', 'property', 'burglary', 'stolen'],
  stolen: ['theft', 'motor', 'property'],
  'third party': ['motor', 'liability', 'tpft'],
  tpft: ['motor', 'third party'],
  comprehensive: ['motor', 'full cover'],
  holiday: ['travel', 'trip', 'vacation', 'abroad'],
  vacation: ['travel', 'holiday', 'trip', 'abroad'],
  trip: ['travel', 'holiday', 'vacation', 'abroad'],
  abroad: ['travel', 'international', 'overseas', 'foreign'],
  overseas: ['travel', 'abroad', 'international'],
  international: ['travel', 'abroad', 'overseas'],
  flight: ['travel', 'airline', 'aviation'],
  luggage: ['travel', 'baggage', 'suitcase'],
  passport: ['travel', 'abroad', 'international'],
  visa: ['travel', 'abroad', 'international'],
  tourist: ['travel', 'holiday', 'vacation'],
  dubai: ['travel', 'abroad', 'international'],
  london: ['travel', 'abroad', 'international'],
  usa: ['travel', 'abroad', 'international'],
  uk: ['travel', 'abroad', 'international'],
  hospital: ['health', 'medical', 'hmo'],
  medical: ['health', 'hospital', 'treatment', 'hmo'],
  doctor: ['health', 'medical', 'hospital'],
  illness: ['health', 'medical', 'sickness'],
  sickness: ['health', 'medical', 'illness'],
  treatment: ['health', 'medical', 'hospital'],
  surgery: ['health', 'medical', 'hospital'],
  hmo: ['health', 'medical', 'hospital'],
  medicine: ['health', 'medical', 'pharmacy'],
  clinic: ['health', 'medical', 'hospital'],
  'hospital bills': ['health', 'medical', 'hmo'],
  healthcare: ['health', 'medical', 'hmo'],
  death: ['life', 'funeral', 'beneficiary'],
  funeral: ['life', 'death', 'burial'],
  burial: ['life', 'death', 'funeral'],
  beneficiary: ['life', 'death', 'family'],
  'life cover': ['life', 'death', 'beneficiary'],
  endowment: ['life', 'savings', 'investment'],
  house: ['property', 'building', 'home', 'real estate'],
  home: ['property', 'building', 'house', 'real estate'],
  building: ['property', 'house', 'construction', 'real estate'],
  office: ['property', 'commercial', 'building'],
  shop: ['property', 'commercial', 'retail'],
  fire: ['property', 'engineering', 'claim'],
  flood: ['property', 'natural disaster', 'water damage'],
  burglary: ['property', 'theft', 'stolen', 'break in'],
  landlord: ['property', 'rent', 'tenant'],
  tenant: ['property', 'rent', 'landlord'],
  'real estate': ['property', 'building', 'house'],
  contents: ['property', 'home', 'household'],
  household: ['property', 'home', 'contents'],
  ship: ['marine', 'cargo', 'sea', 'vessel'],
  boat: ['marine', 'sea', 'vessel', 'water'],
  vessel: ['marine', 'ship', 'boat', 'sea'],
  cargo: ['marine', 'freight', 'goods', 'shipping'],
  shipping: ['marine', 'cargo', 'freight', 'sea'],
  freight: ['marine', 'cargo', 'shipping', 'goods'],
  sea: ['marine', 'ocean', 'water', 'vessel'],
  ocean: ['marine', 'sea', 'water'],
  import: ['marine', 'cargo', 'freight', 'shipping'],
  export: ['marine', 'cargo', 'freight', 'shipping'],
  goods: ['marine', 'cargo', 'freight', 'transit'],
  transit: ['marine', 'cargo', 'goods in transit'],
  machinery: ['engineering', 'equipment', 'plant', 'industrial'],
  equipment: ['engineering', 'machinery', 'plant'],
  construction: ['engineering', 'building', 'contractor'],
  contractor: ['engineering', 'construction', 'project'],
  factory: ['engineering', 'industrial', 'plant', 'machinery'],
  industrial: ['engineering', 'factory', 'plant', 'machinery'],
  plant: ['engineering', 'machinery', 'factory'],
  breakdown: ['engineering', 'machinery', 'equipment'],
  erection: ['engineering', 'construction', 'installation'],
  fraud: ['financial', 'fidelity', 'bond'],
  fidelity: ['financial', 'fraud', 'bond'],
  bond: ['financial', 'fidelity', 'guarantee'],
  'professional indemnity': ['financial', 'liability', 'professional'],
  liability: ['liability', 'public', 'employer', 'third party'],
  'public liability': ['liability', 'public', 'third party'],
  employer: ['liability', 'workmen', 'employee', 'staff'],
  workmen: ['liability', 'employer', 'compensation', 'worker'],
  compensation: ['liability', 'workmen', 'employer'],
  injury: ['liability', 'health', 'accident', 'workmen'],
  directors: ['financial', 'liability', 'officers'],
  farm: ['agriculture', 'crop', 'livestock', 'farmer'],
  farmer: ['agriculture', 'farm', 'crop', 'livestock'],
  crop: ['agriculture', 'farm', 'harvest', 'plant'],
  livestock: ['agriculture', 'farm', 'cattle', 'poultry'],
  cattle: ['agriculture', 'livestock', 'farm'],
  poultry: ['agriculture', 'livestock', 'farm', 'chicken'],
  fish: ['agriculture', 'aquaculture', 'farm'],
  harvest: ['agriculture', 'crop', 'farm'],
  rural: ['agriculture', 'farm', 'crop'],
};

function expandSearchTerms(input: string): string[] {
  const term = input.toLowerCase().trim();
  if (term.length < 2) return [term];

  const words = term.split(/\s+/).filter(Boolean);
  const expanded = new Set<string>();

  expanded.add(term);

  for (const word of words) {
    expanded.add(word);

    const exactSynonyms = SYNONYMS[word] || [];
    exactSynonyms.forEach((s) => expanded.add(s));

    for (const [phrase, synonyms] of Object.entries(SYNONYMS)) {
      if (phrase.startsWith(word) || word.startsWith(phrase)) {
        expanded.add(phrase);
        synonyms.forEach((s) => expanded.add(s));
      }
    }
  }

  for (const [phrase, synonyms] of Object.entries(SYNONYMS)) {
    if (term.includes(phrase) || phrase.startsWith(term)) {
      synonyms.forEach((s) => expanded.add(s));
    }
  }

  return Array.from(expanded);
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // --- Customer-facing ---

  findAll(search?: string, category?: string) {
    const where: any = { status: 'active' };

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (search) {
      const expandedTerms = expandSearchTerms(search);

      where.OR = expandedTerms.flatMap((term) => [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ]);
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // --- Admin ---

  findAllAdmin() {
    return this.prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        category: dto.category,
        description: dto.description,
        premiumAmount: dto.premiumAmount,
        durationMonths: dto.durationMonths,
        coverageHighlights: dto.coverageHighlights,
        exclusions: dto.exclusions ?? '',
        requiredDocuments: dto.requiredDocuments ?? '',
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async setStatus(id: string, status: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { status: status as any },
    });
  }
}
