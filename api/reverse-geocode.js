// Endpoint reverse geocoding OSM Nominatim dengan cache Firestore dan rate limiting (PRD bagian 8.2).
// Mengubah koordinat GPS (lat, lng) menjadi alamat ringkas yang aman untuk privasi warga.

import ngeohash from "ngeohash";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Presisi geohash 7 karakter mencakup area sekitar 150m x 150m
const GEOHASH_PRECISION = 7;
// Masa berlaku cache koordinat: 30 hari (dalam milidetik)
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
// Jeda minimal antar request ke OSM Nominatim (kebijakan resmi OSM: max 1 request/detik)
const MIN_REQUEST_INTERVAL_MS = 1100;

// Variabel memori runtime untuk pelacakan throttle request ke Nominatim
let lastOsmRequestTime = 0;

// Inisialisasi Firebase Admin Firestore
function getAdminFirestore() {
  if (getApps().length === 0) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson) {
      try {
        const credentials = JSON.parse(serviceAccountJson);
        initializeApp({
          credential: cert(credentials)
        });
      } catch (err) {
        console.error("Gagal mengurai FIREBASE_SERVICE_ACCOUNT_JSON:", err);
        initializeApp();
      }
    } else {
      initializeApp();
    }
  }
  return getFirestore();
}

// Menunda eksekusi untuk menghormati batasan rate limit Nominatim
async function throttleOsmRequest() {
  const now = Date.now();
  const elapsed = now - lastOsmRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    const waitTime = MIN_REQUEST_INTERVAL_MS - elapsed;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  lastOsmRequestTime = Date.now();
}

// Merapikan data alamat dari respons Nominatim agar aman dari pengungkapan nomor rumah privat
function formatPrivacySafeAddress(addressDetails, displayName) {
  if (!addressDetails) {
    return displayName || "Lokasi Laporan";
  }

  // Prioritas susunan: [Nama Jalan/Tempat], [Kelurahan/Desa], [Kecamatan], [Kota/Kabupaten]
  const street = addressDetails.road || addressDetails.pedestrian || addressDetails.path || "";
  const subDistrict = addressDetails.village || addressDetails.neighbourhood || addressDetails.suburb || addressDetails.quarter || "";
  const district = addressDetails.city_district || addressDetails.subdistrict || addressDetails.district || "";
  const city = addressDetails.city || addressDetails.municipality || addressDetails.county || addressDetails.state || "";

  const parts = [street, subDistrict, district, city].filter((item) => typeof item === "string" && item.trim().length > 0);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  // Fallback ke display_name jika detail alamat tidak terpecah
  return displayName || "Lokasi Laporan";
}

export default async function handler(req, res) {
  // Langkah 1: Hanya menerima metode HTTP GET
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Metode request tidak diizinkan."
      }
    });
  }

  try {
    // Langkah 2: Ambil dan validasi parameter lat dan lng
    const { lat, lng } = req.query;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Parameter koordinat latitude atau longitude tidak valid."
        }
      });
    }

    // Langkah 3: Hitung string geohash presisi 7
    const geohash = ngeohash.encode(latitude, longitude, GEOHASH_PRECISION);

    // Langkah 4: Periksa cache di Firestore geocode_cache/{geohash}
    let db = null;
    try {
      db = getAdminFirestore();
      const cacheDoc = await db.collection("geocode_cache").doc(geohash).get();

      if (cacheDoc.exists) {
        const cacheData = cacheDoc.data();
        const cachedAt = cacheData.cachedAt ? cacheData.cachedAt.toMillis() : 0;
        const isFresh = Date.now() - cachedAt < CACHE_MAX_AGE_MS;

        if (isFresh && cacheData.address) {
          return res.status(200).json({
            success: true,
            address: cacheData.address,
            geohash,
            source: "cache"
          });
        }
      }
    } catch (dbError) {
      // Jika Firebase Admin belum terkonfigurasi saat dev lokal, lanjutkan ke OSM live
      console.warn("Peringatan cache Firestore geocode_cache:", dbError.message);
    }

    // Langkah 5: Panggil API Nominatim OSM dengan throttling minimal 1100 ms
    await throttleOsmRequest();

    // Nominatim mewajibkan identitas dengan kontak sungguhan; tanpa itu request tidak dikirim
    const contactEmail = process.env.OSM_CONTACT_EMAIL;
    if (!contactEmail) {
      throw new Error("OSM_CONTACT_EMAIL belum diisi di environment variable");
    }
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

    const osmResponse = await fetch(nominatimUrl, {
      method: "GET",
      headers: {
        "User-Agent": `LaporInApp/0.1 (${contactEmail})`,
        "Accept-Language": "id,en"
      }
    });

    if (!osmResponse.ok) {
      throw new Error(`Nominatim HTTP error! status: ${osmResponse.status}`);
    }

    const osmData = await osmResponse.json();

    // Titik yang tidak dikenali Nominatim (misalnya di laut) tidak punya rincian alamat.
    // Hasil seperti itu tidak disimpan ke cache; warga diminta mengetik alamatnya sendiri.
    if (!osmData || osmData.error || !osmData.address) {
      throw new Error(`Nominatim tidak mengenali titik ${latitude}, ${longitude}`);
    }

    const formattedAddress = formatPrivacySafeAddress(osmData.address, osmData.display_name);

    // Langkah 6: Simpan hasil ke cache Firestore untuk 30 hari ke depan
    if (db) {
      try {
        await db.collection("geocode_cache").doc(geohash).set({
          address: formattedAddress,
          cachedAt: FieldValue.serverTimestamp()
        });
      } catch (saveError) {
        console.error("Gagal menyimpan ke geocode_cache:", saveError);
      }
    }

    // Langkah 7: Kembalikan respons sukses ke klien
    return res.status(200).json({
      success: true,
      address: formattedAddress,
      geohash,
      source: "osm_live"
    });
  } catch (error) {
    // Langkah 8: Catat detail teknis error di server dan kembalikan pesan aman ke pengguna
    console.error("Error pada reverse-geocode:", error);
    return res.status(502).json({
      success: false,
      error: {
        code: "GEOCODE_FAILED",
        message: "Alamat tidak dapat ditemukan. Silakan ketik alamat Anda."
      }
    });
  }
}
