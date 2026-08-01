export function formatNumberInput(value: string): string {
  const raw = value.replace(/[^0-9]/g, '')
  if (!raw) return ''
  return parseInt(raw, 10).toLocaleString('en-NG')
}

export function parseFormattedNumber(value: string): number {
  return parseFloat(value.replace(/,/g, '')) || 0
}
