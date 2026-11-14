// Utilitas kompresi gambar di browser (maksimal 500 KB) dan penghapusan metadata EXIF.

import { MAX_PHOTO_BYTES } from "../config/constants.js";
import { CLIENT_ERROR_CODES, createAppError } from "./appError.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_INPUT_SIZE_BYTES = 5 * 1024 * 1024; // Batas file yang dipilih warga: 5 MB

// Mengompresi gambar via HTML5 Canvas sehingga ukuran <= MAX_PHOTO_BYTES dan metadata EXIF terbuang.
export async function compressImage(
  file,
  { maxWidth = 1024, maxHeight = 1024, initialQuality = 0.78 } = {}
) {
  // Langkah 1: Validasi keberadaan, format MIME, dan batas ukuran awal 5 MB
  if (!file || !ALLOWED_MIME_TYPES.includes(file.type) || file.size > MAX_INPUT_SIZE_BYTES) {
    throw createAppError(CLIENT_ERROR_CODES.INVALID_INPUT);
  }

  // Langkah 2: Muat gambar ke elemen Image dan hitung dimensi baru sesuai rasio aspek
  const imageBitmap = await loadImageFromFile(file);
  let { width, height } = calculateDimensions(
    imageBitmap.width,
    imageBitmap.height,
    maxWidth,
    maxHeight
  );

  // Langkah 3: Gambar ulang ke Canvas untuk membuang metadata EXIF (GPS/perangkat) dan kompresi bertahap
  const outputMimeType = file.type === "image/png" ? "image/webp" : "image/jpeg";
  let quality = initialQuality;
  let blob = await renderToBlob(imageBitmap, width, height, outputMimeType, quality);

  while (blob && blob.size > MAX_PHOTO_BYTES && quality > 0.3) {
    quality = Number((quality - 0.1).toFixed(2));
    blob = await renderToBlob(imageBitmap, width, height, outputMimeType, quality);
  }

  // Langkah 4: Perkecil resolusi apabila kualitas minimum masih menghasilkan ukuran > 500 KB
  while (blob && blob.size > MAX_PHOTO_BYTES && width > 480) {
    width = Math.round(width * 0.75);
    height = Math.round(height * 0.75);
    blob = await renderToBlob(imageBitmap, width, height, outputMimeType, quality);
  }

  // Langkah 5: Tolak jika hasil akhir tetap melebihi batas penyimpanan Firestore
  if (!blob || blob.size > MAX_PHOTO_BYTES) {
    throw createAppError(CLIENT_ERROR_CODES.PHOTO_TOO_LARGE);
  }

  // Langkah 6: Bungkus Blob menjadi objek File baru dan buat URL pratinjau lokal
  const extension = outputMimeType === "image/webp" ? "webp" : "jpg";
  const rawName = typeof file.name === "string" ? file.name : "photo";
  const baseName = rawName.replace(/\.[^/.]+$/, "") || "photo";
  const compressedFile = new File([blob], `${baseName}-compressed.${extension}`, {
    type: outputMimeType,
    lastModified: Date.now(),
  });

  const previewUrl = URL.createObjectURL(compressedFile);
  return { compressedFile, previewUrl };
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(createAppError(CLIENT_ERROR_CODES.INVALID_INPUT));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(createAppError(CLIENT_ERROR_CODES.INVALID_INPUT));
    reader.readAsDataURL(file);
  });
}

function calculateDimensions(srcWidth, srcHeight, maxWidth, maxHeight) {
  if (srcWidth <= maxWidth && srcHeight <= maxHeight) {
    return { width: srcWidth, height: srcHeight };
  }
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return {
    width: Math.round(srcWidth * ratio),
    height: Math.round(srcHeight * ratio),
  };
}

function renderToBlob(img, width, height, type, quality) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}