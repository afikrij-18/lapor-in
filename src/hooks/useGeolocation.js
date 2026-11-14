// Hook untuk mengakses posisi GPS perangkat warga (PRD bagian 3, 7.1 & 8.1).
// Menangani alur izin, pembacaan koordinat presisi tinggi, dan alur gagal secara aman.

import { useState, useCallback } from "react";
import { CLIENT_ERROR_CODES, createAppError } from "../utils/appError.js";

export function useGeolocation() {
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fungsi untuk meminta koordinat lokasi saat ini dari browser
  const getCurrentLocation = useCallback((customOptions = {}) => {
    return new Promise((resolve, reject) => {
      // Langkah 1: Periksa ketersediaan Geolocation API di browser pengguna
      if (!navigator.geolocation) {
        const err = createAppError(CLIENT_ERROR_CODES.UNKNOWN_ERROR, new Error("Geolocation tidak didukung browser"));
        setError(err.code);
        reject(err);
        return;
      }

      setLoading(true);
      setError(null);

      // Langkah 2: Opsi default untuk pembacaan GPS akurasi tinggi
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...customOptions
      };

      // Langkah 3: Eksekusi permintaan lokasi
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setCoordinates(coords);
          setLoading(false);
          setError(null);
          resolve(coords);
        },
        (geoError) => {
          setLoading(false);
          let appErrorCode = CLIENT_ERROR_CODES.UNKNOWN_ERROR;

          // Langkah 4: Petakan error bawaan browser ke kode error seragam
          if (geoError.code === geoError.PERMISSION_DENIED) {
            appErrorCode = CLIENT_ERROR_CODES.PERMISSION_DENIED;
          } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
            appErrorCode = CLIENT_ERROR_CODES.NETWORK_ERROR;
          } else if (geoError.code === geoError.TIMEOUT) {
            appErrorCode = CLIENT_ERROR_CODES.NETWORK_ERROR;
          }

          console.error("Error pada useGeolocation:", geoError);
          const mappedError = createAppError(appErrorCode, geoError);
          setError(appErrorCode);
          reject(mappedError);
        },
        options
      );
    });
  }, []);

  return {
    coordinates,
    loading,
    error,
    getCurrentLocation
  };
}

export default useGeolocation;
