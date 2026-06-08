import React, { useState, useEffect } from 'react';
import { signOut } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { 
  Menu, X, BrainCircuit, LogOut, Database, Users, 
  Settings, FileText, BookOpen, Library, Check 
} from 'lucide-react';
import { auth, db } from '../config/firebase';
import { LOGO_URL } from '../config/constants';

// Subcomponents
import AiGenerator from './AiGenerator';
import RppGenerator from './RppGenerator';
import ReferensiPdfView from './ReferensiPdfView';
import KelolaMapelView from './KelolaMapelView';
import PengaturanLembagaView from './PengaturanLembagaView';
import KelolaTutorView from './KelolaTutorView';

export default function Dashboard({ user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [activeMenu, setActiveMenu] = useState('rpp-generator');
  const [imageError, setImageError] = useState(false); 
  const isAdmin = user.role === 'Super Admin';
  const [lembaga, setLembaga] = useState({ 
    kepsekName: 'MINARTI, S.Pd, M.Pd', 
    kepsekNip: '19711118 199903 2 005', 
    kepsekTtd: '', 
    stempel: '' 
  });

  useEffect(() => {
    const fetchLembaga = async () => {
      try { 
        const docSnap = await getDoc(doc(db, "settings", "lembaga")); 
        if (docSnap.exists()) setLembaga(docSnap.data()); 
      } catch (error) { 
        console.error("Gagal memuat profil lembaga:", error); 
      }
    }; 
    fetchLembaga();
  }, []);

  const menuItems = [
    { id: 'ai-generator', label: 'AI Soal & Kisi-kisi', icon: BrainCircuit, adminOnly: false },
    { id: 'rpp-generator', label: 'AI RPP (PPM) Generator', icon: FileText, adminOnly: false },
    { id: 'referensi-buku', label: 'E-Library Buku (PDF)', icon: Library, adminOnly: false },
    { id: 'kelola-mapel', label: 'Kelola Teks & Link Buku', icon: Database, adminOnly: true },
    { id: 'pengaturan-lembaga', label: 'Profil & Stempel Sekolah', icon: Settings, adminOnly: true },
    { id: 'kelola-tutor', label: 'Kelola Data Tutor & TTD', icon: Users, adminOnly: true },
  ];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-50 to-emerald-50/20 flex flex-col md:flex-row font-sans relative overflow-hidden">
      
      {/* Sidebar Overlay Backdrop on Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden no-print" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      
      {/* Sidebar - responsive layout */}
      <aside 
        className={`fixed md:relative top-0 left-0 z-50 h-[100dvh] w-64 flex-shrink-0 bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white transition-transform duration-300 no-print flex flex-col shadow-2xl md:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Close X button */}
        <button 
          onClick={() => setSidebarOpen(false)} 
          className="absolute top-4 right-4 md:hidden text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
          title="Tutup Sidebar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 border-b border-emerald-800 text-center bg-emerald-950/80 relative">
          <div className="relative inline-block mb-3">
            {!imageError ? (
              <img 
                src={LOGO_URL} 
                alt="Logo" 
                className="h-16 w-auto mx-auto object-contain bg-white/10 p-2 rounded-xl border border-white/10" 
                onError={() => setImageError(true)} 
              />
            ) : (
              <div className="bg-emerald-100/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                <BookOpen className="text-emerald-100 w-6 h-6" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-2 px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-600 border border-emerald-500 shadow-sm">
              v1.0.0
            </span>
          </div>
          
          <h2 className="text-sm font-bold tracking-wide uppercase leading-tight">RPP & Soal Generator</h2>
          <p className="text-[10px] text-emerald-200/60 leading-normal mt-1 max-w-[180px] mx-auto font-semibold">
            Kurikulum Terintegrasi PKBM
          </p>
          
          <div className="mt-3.5 inline-block px-3 py-0.5 bg-emerald-700/80 rounded-full text-[10px] font-bold text-emerald-100 border border-emerald-600/50 shadow-inner">
            {user.role}
          </div>
        </div>
        
        <nav className="mt-4 px-3 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => {
            if (item.adminOnly && !isAdmin) return null;
            const isActive = activeMenu === item.id; 
            const Icon = item.icon;
            return (
              <button 
                key={item.id} 
                onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); }} 
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-md font-bold scale-[1.02]' 
                    : 'text-emerald-100 hover:bg-emerald-800/45 hover:text-white font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-emerald-200' : 'text-emerald-200/60'}`} /> 
                <span className="text-sm text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-3 border-t border-emerald-800/50 flex flex-col gap-2 bg-emerald-950/40">
          <button 
            onClick={() => signOut(auth)} 
            className="flex items-center w-full px-4 py-2.5 hover:bg-red-500/20 rounded-xl text-emerald-200 hover:text-red-200 cursor-pointer transition-colors font-semibold"
          >
            <LogOut className="w-4 h-4 mr-3 flex-shrink-0 text-emerald-200/60" /> 
            <span className="text-sm">Keluar Sistem</span>
          </button>
          
          <div className="text-center text-[9px] text-emerald-100/30 font-medium">
            PKBM Al Barakah v1.0.0 © 2026
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden">
        
        {/* Transparent glassmorphic header */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 flex-none no-print sticky top-0 z-20">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                className="mr-3.5 text-gray-500 hover:text-emerald-800 md:hidden cursor-pointer p-1 hover:bg-gray-100 rounded-lg transition-colors" 
                onClick={() => setSidebarOpen(true)}
                title="Buka Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold text-gray-800 tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-4 bg-emerald-600 rounded-full inline-block" />
                {menuItems.find(m => m.id === activeMenu)?.label}
              </h1>
            </div>
            
            <div className="flex items-center space-x-3 bg-white px-3.5 py-1.5 rounded-full border border-gray-200 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-800">{user.name}</span>
            </div>
          </div>
        </header>
        
        {/* Main scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 custom-scrollbar">
          {activeMenu === 'ai-generator' && <AiGenerator lembaga={lembaga} />}
          {activeMenu === 'rpp-generator' && <RppGenerator lembaga={lembaga} />}
          {activeMenu === 'referensi-buku' && <ReferensiPdfView />}
          {activeMenu === 'kelola-mapel' && <KelolaMapelView />}
          {activeMenu === 'pengaturan-lembaga' && <PengaturanLembagaView lembaga={lembaga} setLembaga={setLembaga} />}
          {activeMenu === 'kelola-tutor' && <KelolaTutorView />}
        </div>
      </main>
    </div>
  );
}
