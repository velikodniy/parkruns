const NUMERIC_TO_ISO: Record<number, string> = {
  3: "au",
  4: "at",
  14: "ca",
  23: "dk",
  30: "fi",
  32: "de",
  42: "ie",
  44: "it",
  46: "jp",
  54: "lt",
  57: "my",
  64: "nl",
  65: "nz",
  67: "no",
  74: "pl",
  82: "sg",
  85: "za",
  88: "se",
  97: "gb",
  98: "us",
};

const NAMES: Record<string, string> = {
  au: "Australia",
  at: "Austria",
  ca: "Canada",
  dk: "Denmark",
  fi: "Finland",
  de: "Germany",
  ie: "Ireland",
  it: "Italy",
  jp: "Japan",
  lt: "Lithuania",
  my: "Malaysia",
  nl: "Netherlands",
  nz: "New Zealand",
  no: "Norway",
  pl: "Poland",
  sg: "Singapore",
  za: "South Africa",
  se: "Sweden",
  gb: "United Kingdom",
  us: "United States",
  "gb-eng": "England",
  "gb-sct": "Scotland",
  "gb-wls": "Wales",
  "gb-nir": "Northern Ireland",
  je: "Jersey",
  gg: "Guernsey",
  im: "Isle of Man",
  gi: "Gibraltar",
  fk: "Falkland Islands",
};

export function numericToISO(code: number): string | null {
  return NUMERIC_TO_ISO[code] ?? null;
}

export function getCountryName(iso: string): string | null {
  return NAMES[iso.toLowerCase()] ?? null;
}
