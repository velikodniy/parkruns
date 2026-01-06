export type Coordinates = [number, number];

export interface PointGeometry {
  type: "Point";
  coordinates: Coordinates;
}

export interface EventProperties {
  eventname: string;
  eventLongName: string;
  eventShortName: string;
  localisedEventLongName: string | null;
  countryCode: number;
  seriesId: number;
  eventLocation: string;
}

export interface EventFeature {
  id: number;
  type: "Feature";
  geometry: PointGeometry;
  properties: EventProperties;
}

export interface CountryInfo {
  url: string | null;
  bounds: [number, number, number, number];
}

export interface EventsData {
  countries: Record<string, CountryInfo>;
  events: {
    type: "FeatureCollection";
    features: EventFeature[];
  };
}
