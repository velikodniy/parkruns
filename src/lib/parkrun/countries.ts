interface CountryMapping {
  iso: string;
  name: string;
}

const COUNTRY_CODES: Record<number, CountryMapping> = {
  3: { iso: "AU", name: "Australia" },
  4: { iso: "AT", name: "Austria" },
  14: { iso: "CA", name: "Canada" },
  23: { iso: "DK", name: "Denmark" },
  30: { iso: "FI", name: "Finland" },
  32: { iso: "DE", name: "Germany" },
  42: { iso: "IE", name: "Ireland" },
  44: { iso: "IT", name: "Italy" },
  46: { iso: "JP", name: "Japan" },
  54: { iso: "LT", name: "Lithuania" },
  57: { iso: "MY", name: "Malaysia" },
  64: { iso: "NL", name: "Netherlands" },
  65: { iso: "NZ", name: "New Zealand" },
  67: { iso: "NO", name: "Norway" },
  74: { iso: "PL", name: "Poland" },
  82: { iso: "SG", name: "Singapore" },
  85: { iso: "ZA", name: "South Africa" },
  88: { iso: "SE", name: "Sweden" },
  97: { iso: "GB", name: "United Kingdom" },
  98: { iso: "US", name: "United States" },
};

export function getCountryISO(numericCode: number): string | null {
  return COUNTRY_CODES[numericCode]?.iso ?? null;
}

export function getCountryName(numericCode: number): string | null {
  return COUNTRY_CODES[numericCode]?.name ?? null;
}

export function getAllCountryCodes(): number[] {
  return Object.keys(COUNTRY_CODES).map(Number);
}

const ISO_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.values(COUNTRY_CODES).map(({ iso, name }) => [iso, name])
);

export function getCountryNameByISO(iso: string): string | null {
  return ISO_TO_NAME[iso.toUpperCase()] ?? null;
}
