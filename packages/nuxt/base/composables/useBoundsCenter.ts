// Similar to L.LatLngBounds.getCenter() but without Leaflet requirement
export const useBoundsCenter = (points: { lat: number; lng: number }[]) => {
  if (!points?.length) throw new Error('No points');

  // Handle wrap-around at the antimeridian by choosing the shorter span
  // Normalize longitudes to [-180, 180)
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => {
    const x = p.lng % 360;
    return x >= 180 ? x - 360 : x < -180 ? x + 360 : x;
  });

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  // Compute both spans: direct and via wrap (add 360 then mod)
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const directSpan = maxLng - minLng;

  // Try a wrapped frame by adding 360 to longitudes < 0
  const wrapped = lngs.map((x) => (x < 0 ? x + 360 : x)) as number[];
  const minLngW = Math.min(...wrapped);
  const maxLngW = Math.max(...wrapped);
  const wrappedSpan = maxLngW - minLngW;

  let centerLng: number | undefined;
  if (wrappedSpan < directSpan) {
    // Center in wrapped frame, then normalize back to [-180, 180)
    centerLng = ((minLngW + maxLngW) / 2) % 360;
    if (centerLng >= 180) centerLng -= 360;
  } else {
    centerLng = (minLng + maxLng) / 2;
  }

  const centerLat = (minLat + maxLat) / 2;

  return [centerLat, centerLng];
};
