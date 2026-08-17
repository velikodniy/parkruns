interface CountryFlagProps {
  countryCode: string;
  size?: number;
  title?: string;
  dimmed?: boolean;
}

export function CountryFlag(
  { countryCode, size = 16, title, dimmed = false }: CountryFlagProps,
) {
  return (
    <img
      src={`https://flagcdn.com/${countryCode.toLowerCase()}.svg`}
      alt={title ?? countryCode}
      title={title}
      height={size}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        filter: dimmed ? "grayscale(1)" : undefined,
        opacity: dimmed ? 0.3 : undefined,
      }}
    />
  );
}
