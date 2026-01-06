interface CountryFlagProps {
  countryCode: string;
  size?: number;
}

export function CountryFlag({ countryCode, size = 16 }: CountryFlagProps) {
  return (
    <img
      src={`https://flagcdn.com/${countryCode.toLowerCase()}.svg`}
      alt={countryCode}
      height={size}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    />
  );
}
