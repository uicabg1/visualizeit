export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 2;
export const ZOOM_STEP = 0.1;

export function clampZoom(zoom: number): number {
  const snapped = Math.round(zoom * 10) / 10;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, snapped));
}

export function zoomByWheel(current: number, deltaY: number): number {
  return clampZoom(current + (deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
}

// iOS Safari blank-canvas guard: bitmap area (cssW*s × cssH*s) must stay under ~16.7M px.
export const MAX_CANVAS_AREA_PX = 16_000_000;

export function maxAreaScale(cssWidth: number, cssHeight: number): number {
  const area = cssWidth * cssHeight;
  if (area <= 0) return 1;
  return Math.sqrt(MAX_CANVAS_AREA_PX / area);
}
