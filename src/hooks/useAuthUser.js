// Hook untuk mengetahui siapa yang sedang masuk (warga anonim atau admin).
//
// Contoh:
//   const { user, isAdmin, isLoading } = useAuthUser();
//
// - user      : pengguna Firebase saat ini, atau null
// - isAdmin   : true jika pengguna adalah admin tunggal
// - isLoading : true selama Firebase masih memuat sesi yang tersimpan di browser

import { useEffect, useState } from "react";
import { isAdminUser, onAuthChange } from "../services/authService.js";

export function useAuthUser() {
  const [state, setState] = useState({ user: null, isLoading: true });

  useEffect(() => {
    // Langkah 1: Dengarkan perubahan sesi; panggilan pertama menandai sesi selesai dimuat
    const unsubscribe = onAuthChange((user) => {
      setState({ user, isLoading: false });
    });

    // Langkah 2: Berhenti mendengarkan saat komponen dilepas
    return unsubscribe;
  }, []);

  return {
    user: state.user,
    isAdmin: isAdminUser(state.user),
    isLoading: state.isLoading
  };
}
