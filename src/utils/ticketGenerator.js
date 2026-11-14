// Pembuat kode tiket pelacakan dengan format LPR-YYYY-XXXX (PRD bagian 7.1).
// Contoh hasil: "LPR-2026-4821".

export function generateTicketCode() {
  // Langkah 1: Ambil tahun berjalan
  const year = new Date().getFullYear();

  // Langkah 2: Buat empat digit acak (0000 sampai 9999)
  const randomNumber = Math.floor(Math.random() * 10000);
  const fourDigits = String(randomNumber).padStart(4, "0");

  // Langkah 3: Gabungkan menjadi kode tiket
  return `LPR-${year}-${fourDigits}`;
}
