import type { Resource } from "@depot/shared";
import type { Marker } from "~/base/models/map";

export const getMarkerForResource = (resource: Resource): Marker | null => {
    const address = resource.address;
  
    if (!address) {
      return null;
    }
  
    if (
      typeof address.latitude === 'number' &&
      typeof address.longitude === 'number'
    ) {
      return {
        title: resource.title,
        point: [address.latitude, address.longitude],
        isObfuscated: false,
      };
    }
  
    if (
      typeof address.obfuscatedLatitude === 'number' &&
      typeof address.obfuscatedLongitude === 'number'
    ) {
      return {
        title: resource.title,
        point: [address.obfuscatedLatitude, address.obfuscatedLongitude],
        isObfuscated: true,
      };
    }
  
    return null;
  };