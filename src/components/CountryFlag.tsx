interface CountryFlagProps {
  countryCode: string;
  size?: number;
  title?: string;
}

export function CountryFlag(
  { countryCode, size = 16, title }: CountryFlagProps,
) {
  return (
    <img
      src={`https://flagcdn.com/${countryCode.toLowerCase()}.svg`}
      alt={title ?? countryCode}
      title={title}
      height={size}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    />
  );
}
