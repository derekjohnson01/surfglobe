// Main Map Globe Component — Satellite Globe with Wind Particle Animation
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';

import {
  MAPBOX_ACCESS_TOKEN,
  ZOOM_DEFAULT,
  ANIMATION_DURATION_MS,
  DEFAULT_CENTER,
  colors,
} from './constants';
import { CameraState } from './types';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

// Satellite style for the realistic globe look
const SATELLITE_STYLE = 'mapbox://styles/mapbox/standard-satellite';

export default function MapGlobe() {
  const [camera, setCamera] = useState<CameraState>({
    center: DEFAULT_CENTER,
    zoom: ZOOM_DEFAULT,
  });
  const [locationGranted, setLocationGranted] = useState(false);
  const [windVisible, setWindVisible] = useState(true);

  const cameraRef = useRef<Mapbox.Camera>(null);
  const mapRef = useRef<Mapbox.MapView>(null);
  const isNavigatingRef = useRef(false);
  const locationInitializedRef = useRef(false);

  const navigateToCoordinates = useCallback((lat: number, lng: number, zoom: number) => {
    isNavigatingRef.current = true;
    setCamera({ center: [lng, lat], zoom });

    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [lng, lat],
        zoomLevel: zoom,
        animationDuration: ANIMATION_DURATION_MS,
      });
    }

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, ANIMATION_DURATION_MS + 200);
  }, []);

  useEffect(() => {
    if (locationInitializedRef.current) return;
    locationInitializedRef.current = true;

    let isMounted = true;

    const initLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || !isMounted) return;

        setLocationGranted(true);

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!isMounted) return;

        navigateToCoordinates(
          location.coords.latitude,
          location.coords.longitude,
          ZOOM_DEFAULT
        );
      } catch (error) {
        console.log('[location] Error:', error);
      }
    };

    initLocation();
    return () => { isMounted = false; };
  }, [navigateToCoordinates]);

  const handleCameraChanged = useCallback((state: any) => {
    if (isNavigatingRef.current) return;
    const { center, zoom } = state.properties;
    if (center && zoom !== undefined) {
      setCamera({ center: [center[0], center[1]], zoom });
    }
  }, []);

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={SATELLITE_STYLE}
        projection="globe"
        compassEnabled={false}
        scaleBarEnabled={false}
        onCameraChanged={handleCameraChanged}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: DEFAULT_CENTER,
            zoomLevel: ZOOM_DEFAULT,
            pitch: 0,
          }}
          animationMode="flyTo"
          animationDuration={ANIMATION_DURATION_MS}
        />

        {/* Mapbox native wind particle animation — GFS wind data */}
        {windVisible && (
          <Mapbox.RasterArraySource
            id="wind-source"
            url="mapbox://rasterarrayexamples.gfs-winds"
            tileSize={512}
          >
            <Mapbox.RasterParticleLayer
              id="wind-particles"
              sourceLayerID="10winds"
              style={{
                rasterParticleCount: 1024,
                rasterParticleMaxSpeed: 40,
                rasterParticleSpeedFactor: 4,
                rasterParticleFadeOpacityFactor: 0.96,
                rasterParticleResetRateFactor: 0.8,
                rasterParticleColor: [
                  'interpolate',
                  ['linear'],
                  ['raster-particle-speed'],
                  1.5, 'rgba(134, 163, 171, 0.3)',
                  2.5, 'rgba(134, 163, 171, 0.5)',
                  4.5, 'rgba(110, 143, 208, 0.7)',
                  6.5, 'rgba(100, 140, 230, 0.8)',
                  8.5, 'rgba(80, 165, 235, 0.85)',
                  11.0, 'rgba(45, 195, 210, 0.9)',
                  14.0, 'rgba(35, 210, 160, 0.9)',
                  17.5, 'rgba(80, 230, 100, 0.95)',
                  20.5, 'rgba(170, 240, 60, 0.95)',
                  24.0, 'rgba(240, 220, 40, 1.0)',
                  28.0, 'rgba(255, 165, 30, 1.0)',
                  33.0, 'rgba(255, 95, 30, 1.0)',
                  40.0, 'rgba(255, 45, 45, 1.0)',
                ],
              }}
            />
          </Mapbox.RasterArraySource>
        )}

        {/* Native location puck */}
        {locationGranted && (
          <Mapbox.LocationPuck
            puckBearing="heading"
            pulsing={{ isEnabled: true }}
          />
        )}
      </Mapbox.MapView>

      {/* Wind toggle */}
      <TouchableOpacity
        style={styles.windToggle}
        onPress={() => setWindVisible(!windVisible)}
      >
        <Text style={styles.windToggleText}>
          {windVisible ? '💨 Wind ON' : '💨 Wind OFF'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
  windToggle: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  windToggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});