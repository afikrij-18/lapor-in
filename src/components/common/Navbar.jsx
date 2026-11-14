import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="w-full bg-[#0A0A0A] border-b border-[#171717] px-6 py-4 flex items-center justify-between">
      {/* Langkah 1: Logo dan Brand Lapor.in */}
      <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl focus:outline-none">
        <Shield className="w-6 h-6 text-[#DC2626]" />
        <span>Lapor.in</span>
      </Link>

      {/* Langkah 2: Navigasi cepat ke Peta Publik */}
      <nav className="flex items-center gap-4">
        <Link 
          to="/peta" 
          className="text-sm font-medium text-[#F5F5F5] hover:text-[#DC2626] transition-colors"
        >
          Peta Publik
        </Link>
        <Link 
          to="/admin/login" 
          className="text-sm font-medium text-[#525252] hover:text-white transition-colors"
        >
          Admin
        </Link>
      </nav>
    </header>
  );
}