export type Coordinates = [number, number];

export interface PointGeometry {
  type: "Point";
  coordinates: Coordinates;
}

export interface EventProperties {
  eventname: string;
  EventLongName: string;
  EventShortName: string;
  LocalisedEventLongName: string | null;
  countrycode: number;
  seriesid: number;
  EventLocation: string;
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
