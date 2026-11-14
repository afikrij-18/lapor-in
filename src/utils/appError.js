// Pembuat Error seragam untuk service layer.
// Komponen UI menentukan pesan dan alur pemulihan dari error.code, lalu mengambil teksnya
// dari public/locales/id.json (kunci "errors.<CODE>").

// Kode error yang dibuat di sisi browser (di luar delapan kode resmi dari server, PRD bagian 8.2)
export const CLIENT_ERROR_CODES = {
  NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
  NOT_ADMIN: "NOT_ADMIN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  NETWORK_ERROR: "NETWORK_ERROR",
  PHOTO_TOO_LARGE: "PHOTO_TOO_LARGE",
  AUDIO_TOO_LARGE: "AUDIO_TOO_LARGE",
  INVALID_INPUT: "INVALID_INPUT",
  NOT_FOUND: "NOT_FOUND",
  UNKNOWN_ERROR: "UNKNOWN_ERROR"
};

// Membuat Error dengan properti code. Parameter cause menyimpan error asli untuk developer.
export function createAppError(code, cause) {
  const error = new Error(code);
  error.code = code;
  if (cause) {
    error.cause = cause;
  }
  return error;
}

// Mengubah error dari Firebase (Auth atau Firestore) menjadi Error dengan kode seragam.
export function toAppError(error, context) {
  // Langkah 1: Error yang sudah seragam diteruskan apa adanya
  if (error && Object.values(CLIENT_ERROR_CODES).includes(error.code)) {
    return error;
  }

  // Langkah 2: Catat detail teknis untuk developer; tidak ditampilkan ke warga
  console.error(`Error pada ${context}:`, error);

  // Langkah 3: Petakan kode Firebase ke kode aplikasi
  const firebaseCode = error && typeof error.code === "string" ? error.code : "";

  if (firebaseCode === "permission-denied") {
    return createAppError(CLIENT_ERROR_CODES.PERMISSION_DENIED, error);
  }
  if (firebaseCode === "unavailable" || firebaseCode === "auth/network-request-failed") {
    return createAppError(CLIENT_ERROR_CODES.NETWORK_ERROR, error);
  }
  if (
    firebaseCode === "auth/invalid-credential" ||
    firebaseCode === "auth/wrong-password" ||
    firebaseCode === "auth/user-not-found" ||
    firebaseCode === "auth/invalid-email"
  ) {
    return createAppError(CLIENT_ERROR_CODES.INVALID_CREDENTIALS, error);
  }

  return createAppError(CLIENT_ERROR_CODES.UNKNOWN_ERROR, error);
}
