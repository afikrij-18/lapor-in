// Utilitas manipulasi Geohash untuk Lapor.in (PRD bagian 7.1 & 8.1).
// Menggunakan library ngeohash untuk enkoding dan dekoding koordinat geografis.

import ngeohash from "ngeohash";

// Presisi default geohash: 7 karakter (~150m x 150m) sesuai kontrak PRD bagian 7.3 & 8.1
const DEFAULT_PRECISION = 7;

// Mengubah koordinat latitude dan longitude menjadi kode string geohash.
export function encodeGeohash(latitude, longitude, precision = DEFAULT_PRECISION) {
  // Langkah 1: Validasi keberadaan koordinat
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new Error("Latitude dan longitude harus berupa angka.");
  }

  // Langkah 2: Enkode koordinat menggunakan ngeohash
  return ngeohash.encode(latitude, longitude, precision);
}

// Mendekode string geohash kembali menjadi objek koordinat { latitude, longitude, error }.
export function decodeGeohash(geohash) {
  // Langkah 1: Validasi string geohash
  if (!geohash || typeof geohash !== "string") {
    throw new Error("Geohash harus berupa string non-kosong.");
  }

  // Langkah 2: Dekode geohash
  return ngeohash.decode(geohash);
}

// Mendapatkan bounding box batas wilayah geohash [minLat, minLng, maxLat, maxLng].
export function getGeohashBounds(geohash) {
  // Langkah 1: Validasi string geohash
  if (!geohash || typeof geohash !== "string") {
    throw new Error("Geohash harus berupa string non-kosong.");
  }

  // Langkah 2: Hitung bounding box
  return ngeohash.decode_bbox(geohash);
}

// Mengambil tetangga (neighbors) 8 arah di sekitar geohash untuk pencarian spasial.
export function getGeohashNeighbors(geohash) {
  // Langkah 1: Validasi string geohash
  if (!geohash || typeof geohash !== "string") {
    throw new Error("Geohash harus berupa string non-kosong.");
  }

  // Langkah 2: Dapatkan array tetangga
  return ngeohash.neighbors(geohash);
}
