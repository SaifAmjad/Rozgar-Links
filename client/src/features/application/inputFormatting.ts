export function formatCnic(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function formatPakistaniMobile(value: string) {
  return value.replace(/\D/g, '').slice(0, 11);
}

export function formatExperience(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [whole = '', ...decimalParts] = cleaned.split('.');
  const decimal = decimalParts.join('').slice(0, 1);
  return decimalParts.length > 0 ? `${whole.slice(0, 2)}.${decimal}` : whole.slice(0, 2);
}
