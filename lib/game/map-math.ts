export const mercatorLimit = 85.05112878;
export function mapPoint(lat: number, lon: number, zoom: number) {
  const size = 256 * 2 ** zoom,
    phi =
      (Math.max(-mercatorLimit, Math.min(mercatorLimit, lat)) * Math.PI) / 180;
  return {
    x: ((lon + 180) / 360) * size,
    y: ((1 - Math.asinh(Math.tan(phi)) / Math.PI) / 2) * size,
  };
}
export function mapLocation(x: number, y: number, zoom: number) {
  const size = 256 * 2 ** zoom;
  return {
    lon: (((((x / size) * 360) % 360) + 360) % 360) - 180,
    lat:
      (Math.atan(
        Math.sinh(Math.PI * (1 - (2 * Math.max(0, Math.min(size, y))) / size)),
      ) *
        180) /
      Math.PI,
  };
}
export function wrappedDelta(x: number, center: number, size: number) {
  return ((((x - center + size / 2) % size) + size) % size) - size / 2;
}
