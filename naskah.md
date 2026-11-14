# Naskah Video Demo Lapor.in

Durasi target: sekitar 3 menit. Kolom **Narasi** dibacakan apa adanya; kolom **Layar** adalah yang direkam. Total narasi sekitar 280 kata: sengaja longgar, karena sebagian waktu dipakai untuk suara warga dan menunggu layar berganti.

## Persiapan sebelum merekam

1. **Isi ulang data contoh:** `node scripts/seed-demo-data.mjs`, supaya peta dan antrean admin terisi rapi. Hapus dulu laporan uji yang tidak pantas tampil.
2. **Pakai alamat Vercel**, bukan `localhost`, dan pastikan kunci Gemini di Production adalah kunci demo yang kuotanya masih penuh.
3. **Uji dulu laporan suara berbahasa Minang** sampai hasilnya bagus. Jalur ini belum pernah dicoba. Kalau hasilnya tidak meyakinkan, pakai kalimat bahasa Indonesia di bawah dan ubah narasi adegan 3 (lihat catatan di akhir).
4. **Siapkan dua tab:** tab warga di halaman utama, dan tab admin yang sudah login di `/admin`.
5. **Siapkan satu foto** lampu jalan atau jalan gelap di perangkat perekam.
6. **Izinkan mikrofon dan lokasi** di browser sebelum merekam, supaya dialog izin tidak muncul di video.
7. **Rekam di ruangan tenang**, lalu lakukan satu kali gladi penuh. Balasan AI butuh beberapa detik; bagian menunggu boleh dipotong saat menyunting.

### Kalimat laporan yang diucapkan warga

Bahasa Minang (minta anggota tim yang fasih memeriksa dan mengucapkannya):

> "Pak, lampu jalan di muko SD 05 Lubuak Bagaluang alah mati saminggu. Kalam bana kalau malam, patang ado urang nan hampia jatuah dari onda."

Cadangan bahasa Indonesia, sengaja sedikit terbata-bata:

> "Pak, ini... lampu jalan di depan SD 05 Lubuk Begalung su-sudah mati seminggu. Gelap sekali kalau malam, kemarin ada yang hampir jatuh dari motor."

## Naskah

| No | Waktu | Layar | Narasi |
|---|---|---|---|
| 1 | 0:00 - 0:20 | Teks pembuka di layar hitam: "Melapor seharusnya semudah bercerita." Lalu halaman utama Lapor.in. | Lampu jalan mati, jalan berlubang, sampah menumpuk. Warga tahu masalahnya, tetapi banyak yang tidak melapor. Formulir daring terlalu panjang bagi lansia, sulit bagi penyandang disabilitas, dan terasa kaku bagi warga yang sehari-hari berbahasa daerah. Lapor.in mengubah melapor menjadi semudah bercerita. |
| 2 | 0:20 - 0:35 | Halaman utama. Kursor menunjuk tombol mikrofon merah, lalu tulisan pemberitahuan rekaman 30 hari. | Tidak ada pendaftaran dan tidak ada login. Di halaman utama hanya ada satu tombol besar. Warga cukup menekannya, lalu berbicara. |
| 3 | 0:35 - 0:55 | Tekan tombol mikrofon. Warga mengucapkan kalimat laporan berbahasa Minang. Tekan lagi untuk berhenti. Halaman berpindah ke chat dan menampilkan "sedang memproses". | Ibu ini melapor dengan bahasa Minang, seperti saat ia bercerita ke tetangganya. (Jeda: biarkan suara warga terdengar.) AI kami mendengarkan rekamannya, mengabaikan suara bising, dan merapikan ucapan yang terbata-bata. |
| 4 | 0:55 - 1:20 | Kartu draf muncul: judul, kategori, urgensi, ringkasan dalam bahasa Indonesia. Asisten membacakan balasannya. | Dalam beberapa detik, cerita tadi menjadi laporan berbahasa Indonesia baku, lengkap dengan judul, kategori, dan tingkat urgensi. Balasan asisten juga dibacakan, sehingga warga yang sulit membaca tetap bisa mengikuti. |
| 5 | 1:20 - 1:45 | Ketik di kolom chat: "ubah urgensinya jadi darurat". Kartu berubah. Lalu tekan "Gunakan Lokasi Saya Saat Ini", alamat terisi. Tekan "Tambah Foto", pilih foto. | Kalau ada yang keliru, warga cukup bilang ke asisten, dan kartunya langsung diperbarui. Lokasi diambil dari GPS dengan satu ketukan, atau dipilih di peta. Foto bukti bisa ditambahkan, dan data lokasi di dalam foto dihapus otomatis demi privasi. |
| 6 | 1:45 - 2:00 | Tekan "Kirim Laporan Sekarang". Layar tiket muncul dengan kode `LPR-...`. | Satu ketukan lagi, laporan terkirim, dan warga menerima kode tiket. Identitasnya tidak pernah diminta. |
| 7 | 2:00 - 2:10 | Kembali ke halaman utama, tekan "Ketik Laporan Secara Manual", ketik huruf acak. Asisten meminta mengulang dan menampilkan tombol pilihan. | Warga yang lebih suka mengetik juga bisa. Dan saat sesuatu gagal, selalu ada jalan lain: tidak ada jalan buntu. |
| 8 | 2:10 - 2:40 | Pindah ke tab admin. Antrean verifikasi, laporan darurat di paling atas. Tekan "Verifikasi" pada laporan tadi: modal menampilkan foto, tombol putar rekaman, dan transkrip asli. Tekan "Verifikasi & Publikasikan". | Di sisi pengelola, laporan paling mendesak selalu berada di urutan teratas. Admin bisa mendengar rekaman asli dan membaca transkripnya untuk mencocokkan hasil AI, mengoreksi bila perlu, lalu memverifikasi. Laporan yang tidak layak ditolak dengan alasan yang jelas. |
| 9 | 2:40 - 2:52 | Buka `/peta`. Peta dengan kelompok pin. Klik pin laporan tadi, panel detail muncul. Coba satu filter. | Laporan yang lolos verifikasi langsung tampil di peta publik. Warga bisa melihat masalah di sekitarnya dan memantau penanganannya, tanpa data pribadi pelapor. |
| 10 | 2:52 - 3:05 | Layar ringkas: logo teknologi atau daftar "React, Firebase, Vercel, Gemini, OpenStreetMap", lalu tulisan "Biaya operasional: Rp 0". | Semua ini berjalan di layanan gratis: Gemini, Firebase, Vercel, dan OpenStreetMap. Biaya operasionalnya nol rupiah, sehingga RT, kelurahan, atau desa mana pun bisa memakainya. |
| 11 | 3:05 - 3:12 | Halaman utama dengan tombol mikrofon, lalu teks "Lapor.in - Tim Minimize". | Lapor.in. Cukup bercerita, kami yang menuliskannya. Kami tim Minimize. Terima kasih. |

## Catatan penyuntingan

- **Bagian menunggu AI dipotong.** Sisakan satu sampai dua detik tulisan "sedang memproses" supaya terasa nyata, sisanya dibuang.
- **Tambahkan teks terjemahan** di bawah layar saat warga berbicara bahasa Minang, supaya juri paham isi ucapannya.
- **Perbesar bagian penting** (kartu draf, kode tiket, tombol putar rekaman) saat disebut di narasi.
- **Durasi longgar sekitar 10 detik.** Kalau harus tepat 3 menit, buang adegan 7 atau gabungkan adegan 10 dan 11.

## Kalau suara bahasa Minang belum bisa diandalkan

Pakai kalimat cadangan bahasa Indonesia, dan ganti narasi adegan 3 menjadi:

> "Bapak ini melapor dengan caranya sendiri, sedikit terbata-bata, di pinggir jalan yang bising. AI kami mendengarkan rekamannya, mengabaikan suara bising, dan merapikan ucapannya tanpa mengubah maknanya."

Lalu di adegan 4, ganti "menjadi laporan berbahasa Indonesia baku" dengan "menjadi laporan yang rapi", dan sebutkan dukungan bahasa daerah secara lisan di adegan 10 hanya jika sudah terbukti saat uji.
