export interface Map {
  location: Location;
  classNames?: string;
  markers?: Marker[];
  fitBounds?: boolean;
  circleRadius?: number;
}

export type Marker = {
  title?: string;
  point: [number, number];
  isObfuscated?: boolean;
};

export interface Location {
  // = [latitude, longitude]
  point: [number, number];
  zoom: number;
}
