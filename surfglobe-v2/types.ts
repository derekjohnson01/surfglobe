// Type definitions for SurfGlobe

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface CameraState {
  center: [number, number]; // [longitude, latitude]
  zoom: number;
}
