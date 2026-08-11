const SYNONYMS: Record<string, string[]> = {
  car: ['motor', 'vehicle', 'automobile'],
  vehicle: ['motor', 'car', 'automobile'],
  holiday: ['travel', 'trip', 'vacation', 'abroad'],
  vacation: ['travel', 'holiday', 'trip'],
  trip: ['travel', 'holiday', 'vacation'],
  abroad: ['travel', 'international', 'overseas'],
  hospital: ['health', 'medical', 'hmo'],
  medical: ['health', 'hospital', 'treatment'],
  doctor: ['health', 'medical', 'hospital'],
  house: ['property', 'building', 'home'],
  home: ['property', 'building', 'house'],
  building: ['property', 'house', 'construction'],
  ship: ['marine', 'cargo', 'sea', 'vessel'],
  cargo: ['marine', 'freight', 'goods'],
  farm: ['agriculture', 'crop', 'livestock'],
  accident: ['motor', 'health', 'collision'],
  crash: ['motor', 'accident', 'collision'],
  theft: ['motor', 'property', 'burglary'],
  fire: ['property', 'engineering'],
  death: ['life', 'funeral', 'beneficiary'],
  funeral: ['life', 'death', 'burial'],
  machinery: ['engineering', 'equipment', 'plant'],
  fraud: ['financial', 'fidelity', 'bond'],
  liability: ['liability', 'public', 'employer'],
  injury: ['liability', 'health', 'accident'],
  dubai: ['travel', 'abroad', 'international'],
  overseas: ['travel', 'abroad', 'international'],
}

export function expandSearchTerms(input: string): string[] {
  const term = input.toLowerCase().trim()
  if (term.length < 2) return [term]

  const words = term.split(/\s+/).filter(Boolean)
  const expanded = new Set<string>()

  expanded.add(term)

  for (const word of words) {
    expanded.add(word)

    const exactSynonyms = SYNONYMS[word] || []
    exactSynonyms.forEach((s) => expanded.add(s))

    for (const [phrase, synonyms] of Object.entries(SYNONYMS)) {
      if (phrase.startsWith(word) || word.startsWith(phrase)) {
        expanded.add(phrase)
        synonyms.forEach((s) => expanded.add(s))
      }
    }
  }

  for (const [phrase, synonyms] of Object.entries(SYNONYMS)) {
    if (term.includes(phrase) || phrase.startsWith(term)) {
      synonyms.forEach((s) => expanded.add(s))
    }
  }

  return Array.from(expanded)
}
