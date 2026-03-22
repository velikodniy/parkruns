/** GeoJSON coordinate order per RFC 7946 */
export type LngLat = [longitude: number, latitude: number];
/** Map/API coordinate order (Leaflet, Open-Meteo, Nominatim) */
export type LatLng = [latitude: number, longitude: number];

export interface PointGeometry {
  type: "Point";
  coordinates: LngLat;
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
