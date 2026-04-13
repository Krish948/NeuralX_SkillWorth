const INR_CURRENCY_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const INR_COMPACT_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

function toSafeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function formatINR(value: number): string {
  return INR_CURRENCY_FORMATTER.format(toSafeNumber(value));
}

export function formatINRCompact(value: number): string {
  return INR_COMPACT_FORMATTER.format(toSafeNumber(value));
}

export function formatINRRange(min: number, max: number): string {
  return `${formatINR(min)} - ${formatINR(max)}`;
}
