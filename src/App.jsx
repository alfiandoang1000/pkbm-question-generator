import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { 
  Menu, X, BrainCircuit, LogOut, ShieldCheck, 
  Download, FileSpreadsheet, AlertCircle, 
  Database, Users, Edit, Trash2, Plus, CheckCircle, FolderOpen, Pencil, BookOpen, Library, ExternalLink, Settings, FileText
} from 'lucide-react';

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAENW2kadJc6GydbsuUXsabKSZTdyXP8Qw",
  authDomain: "generator-soal-2232b.firebaseapp.com",
  projectId: "generator-soal-2232b",
  storageBucket: "generator-soal-2232b.firebasestorage.app",
  messagingSenderId: "860611577077",
  appId: "1:860611577077:web:669f20d09172d8d87f31bc",
  measurementId: "G-1NBBPGLRMM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- OPENROUTER API KEY & CONFIG ---
const API_KEY = import.meta.env.OPENROUTER_API_KEY;
const LOGO_URL = "https://lh3.googleusercontent.com/d/1NVCS-ir_F9kwYP5Dxpfg6dSiyhhKAXD2";

// DAFTAR MODEL AI DARI OPENROUTER
const OPENROUTER_MODELS = [
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Cepat & Stabil)' },
  { id: 'google/gemini-1.5-pro', label: 'Gemini 1.5 Pro (Sangat Cerdas)' },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B (Alternatif Pintar)' },
  { id: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B (Bagus untuk Logika)' },
  { id: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (Eksperimen Gratis)' },
  { id: 'meta-llama/llama-3-8b-instruct:free', label: 'Llama 3 8B (Gratis Terbatas)' }
];

// OPSI DIMENSI PROFIL LULUSAN (DPL)
const DPL_OPTIONS = [
  { id: 'DPL 1', label: 'Keimanan dan Ketaqwaan' },
  { id: 'DPL 2', label: 'Kewarganegaraan' },
  { id: 'DPL 3', label: 'Penalaran Kritis' },
  { id: 'DPL 4', label: 'Kreativitas' },
  { id: 'DPL 5', label: 'Kolaborasi' },
  { id: 'DPL 6', label: 'Kemandirian' },
  { id: 'DPL 7', label: 'Kesehatan' },
  { id: 'DPL 8', label: 'Komunikasi' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.email);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUser({ uid: currentUser.uid, email: currentUser.email, name: data.name, role: data.role, unit: data.unit });
          } else {
            if (currentUser.email.includes('admin')) {
              await setDoc(userDocRef, { email: currentUser.email, name: 'Super Admin', role: 'Super Admin', unit: 'Pusat', createdAt: new Date().toISOString() });
              setUser({ uid: currentUser.uid, email: currentUser.email, name: 'Super Admin', role: 'Super Admin', unit: 'Pusat' });
            } else {
              await setDoc(userDocRef, { email: currentUser.email, name: 'Akun Tutor Bersama', role: 'Tutor', unit: 'PKBM Al Barakah', createdAt: new Date().toISOString() });
              setUser({ uid: currentUser.uid, email: currentUser.email, name: 'Akun Tutor Bersama', role: 'Tutor', unit: 'PKBM Al Barakah' });
            }
          }
        } catch (error) { console.error("Kesalahan otentikasi:", error); await signOut(auth); }
      } else { setUser(null); }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (loadingAuth) return <div className="min-h-screen flex items-center justify-center bg-emerald-50 text-emerald-800 font-bold">Memverifikasi Keamanan Sistem...</div>;
  if (!user) return <LoginPage />;
  return <Dashboard user={user} />;
}

// --- KOMPONEN: LOGIN PAGE ---
function LoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); const [errorMsg, setErrorMsg] = useState('');
  const [imageError, setImageError] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault(); setIsLoading(true); setErrorMsg('');
    try { await signInWithEmailAndPassword(auth, email, password); } 
    catch (error) { setErrorMsg("Gagal masuk. Periksa email dan password."); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4 font-sans text-gray-900">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
        <div className="text-center mb-8">
          {!imageError ? <img src={LOGO_URL} alt="Logo PKBM Al Barakah" className="h-28 w-auto mx-auto mb-4 object-contain" onError={() => setImageError(true)} /> : <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><BookOpen className="text-emerald-700 w-8 h-8" /></div>}
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Question Generator</h1>
          <p className="text-emerald-600 font-medium text-sm mt-1">PKBM Al Barakah</p>
        </div>
        {errorMsg && <div className="mb-5 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 text-center font-medium">{errorMsg}</div>}
        <form onSubmit={handleAuth} className="space-y-5">
          <div><label className="block text-sm font-bold text-gray-700 mb-1 text-left">Email Terdaftar</label><input type="email" required className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 text-gray-900" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><label className="block text-sm font-bold text-gray-700 mb-1 text-left">Kata Sandi</label><input type="password" required className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 text-gray-900" value={password} onChange={e => setPassword(e.target.value)} /></div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md" disabled={isLoading}>{isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</button>
        </form>
      </div>
    </div>
  );
}

// --- KOMPONEN: DASHBOARD ---
function Dashboard({ user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); const [activeMenu, setActiveMenu] = useState('rpp-generator');
  const [imageError, setImageError] = useState(false); const isAdmin = user.role === 'Super Admin';
  const [lembaga, setLembaga] = useState({ kepsekName: 'MINARTI, S.Pd, M.Pd', kepsekNip: '19711118 199903 2 005', kepsekTtd: '', stempel: '' });

  useEffect(() => {
    const fetchLembaga = async () => {
      try { const docSnap = await getDoc(doc(db, "settings", "lembaga")); if (docSnap.exists()) setLembaga(docSnap.data()); } 
      catch (error) { console.error(error); }
    }; fetchLembaga();
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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      <style>{`@media print { body * { visibility: hidden; } .printable-area, .printable-area * { visibility: visible; } .printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; margin: 0; } .no-print { display: none !important; } }`}</style>
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden no-print" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed md:sticky top-0 left-0 z-30 h-screen w-64 bg-emerald-900 text-white transition-transform duration-300 no-print ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col`}>
        <div className="p-6 border-b border-emerald-800 text-center bg-emerald-950">
          {!imageError ? <img src={LOGO_URL} alt="Logo" className="h-16 w-auto mx-auto mb-3 object-contain bg-white/10 p-2 rounded-lg" onError={() => setImageError(true)} /> : <div className="bg-emerald-100/20 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"><BookOpen className="text-emerald-100 w-6 h-6" /></div>}
          <h2 className="text-sm font-bold tracking-wide uppercase leading-tight">Question Generator</h2>
          <div className="mt-3 inline-block px-3 py-1 bg-emerald-700 rounded-full text-xs font-bold text-emerald-100 border border-emerald-600 shadow-inner">{user.role}</div>
        </div>
        <nav className="mt-4 px-3 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => {
            if (item.adminOnly && !isAdmin) return null;
            const isActive = activeMenu === item.id; const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-emerald-700 text-white shadow-md' : 'text-emerald-100 hover:bg-emerald-800/50'}`}>
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-emerald-300' : ''}`} /> <span className="font-semibold text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-emerald-800"><button onClick={() => signOut(auth)} className="flex items-center w-full px-4 py-3 hover:bg-red-500/20 rounded-xl text-emerald-100 hover:text-red-100 transition-colors"><LogOut className="w-5 h-5 mr-3" /> <span className="font-semibold text-sm">Keluar Sistem</span></button></div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 flex-none no-print">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center"><button className="mr-4 text-gray-500 hover:text-emerald-700 md:hidden" onClick={() => setSidebarOpen(true)}><Menu className="w-6 h-6" /></button><h1 className="text-xl font-bold text-gray-800">{menuItems.find(m => m.id === activeMenu)?.label}</h1></div>
            <div className="flex items-center space-x-3 bg-gray-50 px-4 py-1.5 rounded-full border"><span className="text-sm font-bold text-emerald-800">{user.name}</span></div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
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

// --- KOMPONEN: PENGATURAN LEMBAGA (TTD & STEMPEL) ---
function PengaturanLembagaView({ lembaga, setLembaga }) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault(); setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "lembaga"), lembaga);
      alert("Profil Sekolah & Tanda Tangan berhasil disimpan!");
    } catch (error) { alert("Gagal menyimpan pengaturan."); } 
    finally { setIsSaving(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm text-left">
        <h3 className="text-lg font-bold text-emerald-900 flex items-center mb-2"><Settings className="w-5 h-5 mr-2" /> Profil & Tanda Tangan Lembaga</h3>
        <p className="text-sm text-gray-600 mb-6">Data ini akan otomatis ditempelkan pada bagian bawah cetakan Kisi-kisi dan RPP.</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="block text-xs font-bold text-gray-700 mb-1">Nama Kepala Sekolah</label><input type="text" required className="w-full border border-gray-300 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" value={lembaga.kepsekName} onChange={(e) => setLembaga({...lembaga, kepsekName: e.target.value})} /></div>
            <div><label className="block text-xs font-bold text-gray-700 mb-1">NIP Kepala Sekolah</label><input type="text" className="w-full border border-gray-300 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" value={lembaga.kepsekNip} onChange={(e) => setLembaga({...lembaga, kepsekNip: e.target.value})} /></div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <label className="block text-xs font-bold text-blue-900 mb-1">Link Tanda Tangan Kepsek (PNG Transparan)</label>
              <input type="url" placeholder="https://..." className="w-full border border-blue-200 px-3 py-2 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={lembaga.kepsekTtd} onChange={(e) => setLembaga({...lembaga, kepsekTtd: e.target.value})} />
              {lembaga.kepsekTtd && <img src={lembaga.kepsekTtd} alt="TTD Kepsek" className="h-16 mt-3 border border-dashed border-blue-300 bg-white p-1" />}
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <label className="block text-xs font-bold text-blue-900 mb-1">Link Stempel Sekolah (PNG Transparan)</label>
              <input type="url" placeholder="https://..." className="w-full border border-blue-200 px-3 py-2 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={lembaga.stempel} onChange={(e) => setLembaga({...lembaga, stempel: e.target.value})} />
              {lembaga.stempel && <img src={lembaga.stempel} alt="Stempel" className="h-16 mt-3 border border-dashed border-blue-300 bg-white p-1" />}
            </div>
          </div>
          <button type="submit" disabled={isSaving} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg transition-all shadow-md">{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</button>
        </form>
      </div>
    </div>
  );
}

// --- KOMPONEN: KELOLA DATA TUTOR & TTD ---
function KelolaTutorView() {
  const [tutorsList, setTutorsList] = useState([]); 
  const [isLoading, setIsLoading] = useState(true); 
  const [isUpdating, setIsUpdating] = useState(false); 
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [formData, setFormData] = useState({ id: '', name: '', nip: '', ttdUrl: '' });

  const fetchTutors = async () => { 
    try { 
      const querySnapshot = await getDocs(collection(db, "tutors")); 
      setTutorsList(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); 
    } catch (error) { alert("Gagal memuat daftar tutor."); } 
    finally { setIsLoading(false); } 
  };
  
  useEffect(() => { fetchTutors(); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setIsUpdating(true);
    try { 
      if (formData.id) {
        await updateDoc(doc(db, "tutors", formData.id), { name: formData.name, nip: formData.nip, ttdUrl: formData.ttdUrl }); 
      } else {
        await addDoc(collection(db, "tutors"), { name: formData.name, nip: formData.nip, ttdUrl: formData.ttdUrl, createdAt: new Date().toISOString() }); 
      }
      setIsModalOpen(false); setFormData({ id: '', name: '', nip: '', ttdUrl: '' }); fetchTutors(); 
    } catch (error) { alert("Gagal menyimpan data."); } 
    finally { setIsUpdating(false); }
  };

  const handleDelete = async (id) => {
    if(confirm('Yakin ingin menghapus profil tutor ini?')) {
      try { await deleteDoc(doc(db, "tutors", id)); fetchTutors(); } catch(e) { alert("Gagal menghapus."); }
    }
  };

  if (isLoading) return <div className="text-center p-10 font-bold text-gray-500">Memuat Daftar Tutor...</div>;
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-emerald-200 flex justify-between items-center shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-emerald-900 flex items-center text-left"><Users className="w-5 h-5 mr-2 text-left" /> Kelola Data & TTD Tutor</h3>
          <p className="text-gray-600 text-sm mt-1 text-left">Daftar nama tutor di sini akan muncul pada opsi Dropdown saat mencetak RPP dan Kisi-kisi.</p>
        </div>
        <button onClick={() => {setFormData({ id: '', name: '', nip: '', ttdUrl: '' }); setIsModalOpen(true)}} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg flex items-center shadow-sm whitespace-nowrap"><Plus className="w-4 h-4 mr-1.5" /> Tambah Tutor</button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600 min-w-[700px]">
          <thead className="text-xs text-gray-500 uppercase border-b bg-gray-50"><tr><th className="px-5 py-3">Nama Tutor</th><th className="px-5 py-3">NIP / Identitas</th><th className="px-5 py-3 text-center">Tanda Tangan (PNG)</th><th className="px-5 py-3 text-center">Aksi</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {tutorsList.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-400">Belum ada data tutor terdaftar.</td></tr>}
            {tutorsList.map((tutor) => (
              <tr key={tutor.id} className="hover:bg-gray-50">
                <td className="px-5 py-4 font-bold text-gray-800">{tutor.name}</td>
                <td className="px-5 py-4 text-gray-700">{tutor.nip || '-'}</td>
                <td className="px-5 py-4 text-center">
                  {tutor.ttdUrl ? <img src={tutor.ttdUrl} alt="TTD" className="h-8 mx-auto border border-dashed border-gray-300 p-0.5 bg-white" /> : <span className="text-[10px] text-red-500 italic">Belum Ada TTD</span>}
                </td>
                <td className="px-5 py-4 text-center flex justify-center space-x-2">
                  <button onClick={() => {setFormData(tutor); setIsModalOpen(true)}} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded" title="Edit Profil"><Edit className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete(tutor.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded" title="Hapus"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center text-white"><h3 className="font-bold text-lg">Profil TTD Tutor</h3><button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 hover:text-emerald-200" /></button></div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-700 mb-1 text-left">Nama Lengkap & Gelar</label><input type="text" required className="w-full border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ahmad Dahlan, S.Pd" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1 text-left">NIP / NUPTK</label><input type="text" className="w-full border px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Opsional" value={formData.nip} onChange={(e) => setFormData({...formData, nip: e.target.value})} /></div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <label className="block text-xs font-bold text-blue-900 mb-1 text-left">Link Tanda Tangan (PNG Transparan)</label>
                <input type="url" className="w-full border border-blue-200 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" placeholder="https://..." value={formData.ttdUrl} onChange={(e) => setFormData({...formData, ttdUrl: e.target.value})} />
                <p className="text-[10px] text-blue-700 mt-1">Disarankan menggunakan Imgur atau Google Drive.</p>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">Batal</button><button type="submit" disabled={isUpdating} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700">Simpan Profil Tutor</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- KOMPONEN: E-LIBRARY ---
function ReferensiPdfView() {
  const [mapelDB, setMapelDB] = useState([]); const [isLoading, setIsLoading] = useState(true); const [activeTab, setActiveTab] = useState('Paket A');

  useEffect(() => { const fetchMapel = async () => { try { const querySnapshot = await getDocs(collection(db, "materi_pelajaran")); setMapelDB(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); } catch (error) { alert("Gagal memuat."); } finally { setIsLoading(false); } }; fetchMapel(); }, []);
  const filteredMapel = mapelDB.filter(m => m.paket === activeTab && m.linkPdf && m.linkPdf.trim() !== '');

  if (isLoading) return <div className="p-10 text-center font-bold text-gray-500">Memuat Koleksi Buku PDF...</div>;
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-emerald-200 flex justify-between items-center shadow-sm">
        <div><h3 className="text-lg font-bold text-emerald-900 flex items-center text-left"><Library className="w-5 h-5 mr-2" /> E-Library Buku PDF Asli</h3><p className="text-gray-600 text-sm mt-1 text-left">Fasilitas khusus Tutor untuk melihat dan mempelajari buku asli tanpa perlu mencari di internet.</p></div>
      </div>
      <div className="flex space-x-2 border-b border-gray-200">
        {['Paket A', 'Paket B', 'Paket C'].map(paket => (
          <button key={paket} onClick={() => setActiveTab(paket)} className={`px-6 py-3 font-bold text-sm rounded-t-lg transition-colors ${activeTab === paket ? 'bg-white text-emerald-700 border-t border-x border-gray-200 shadow-[0_4px_0_0_white]' : 'bg-gray-100 text-gray-500 border border-transparent hover:bg-gray-200'}`}>{paket}</button>
        ))}
      </div>
      {filteredMapel.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300"><BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-medium">Belum ada link Buku PDF yang ditambahkan Super Admin untuk {activeTab}.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMapel.map((m) => (
            <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-emerald-50 p-4 border-b border-emerald-100"><div className="flex justify-between items-start"><span className="text-xs font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-md">{m.kelas}</span></div><h4 className="font-bold text-gray-900 mt-3 text-lg leading-tight">{m.subject}</h4></div>
              <div className="p-4 bg-white flex items-center justify-between"><span className="text-sm font-medium text-gray-500 flex items-center"><CheckCircle className="w-4 h-4 mr-1.5 text-emerald-500" /> PDF Tersedia</span><a href={m.linkPdf} target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors">Buka / Download <ExternalLink className="w-4 h-4 ml-1.5" /></a></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- KOMPONEN: KELOLA MAPEL ---
function KelolaMapelView() {
  const [mapelDB, setMapelDB] = useState([]); const [isLoading, setIsLoading] = useState(true); const [activeTab, setActiveTab] = useState('Paket A'); const [isModalOpen, setIsModalOpen] = useState(false); const [modalMode, setModalMode] = useState('add'); const [isSaving, setIsSaving] = useState(false); 
  const initialForm = { paket: 'Paket A', kelas: 'Kelas 1', subject: '', txtGanjil: '', txtGenap: '', linkPdf: '' }; 
  const [formData, setFormData] = useState(initialForm);

  const fetchMapel = async () => { try { const querySnapshot = await getDocs(collection(db, "materi_pelajaran")); setMapelDB(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); } catch (error) { alert("Gagal memuat."); } finally { setIsLoading(false); } };
  useEffect(() => { fetchMapel(); }, []);

  const groupedByKelas = mapelDB.filter(m => m.paket === activeTab).reduce((acc, curr) => { if (!acc[curr.kelas]) acc[curr.kelas] = []; acc[curr.kelas].push(curr); return acc; }, {});
  const kelasOptions = { 'Paket A': ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'], 'Paket B': ['Kelas 7', 'Kelas 8', 'Kelas 9'], 'Paket C': ['Kelas 10', 'Kelas 11', 'Kelas 12'] };

  const handleOpenModal = (mode, data = null) => { setModalMode(mode); if (mode === 'edit' && data) setFormData({...initialForm, ...data}); else setFormData({ ...initialForm, paket: activeTab, kelas: kelasOptions[activeTab][0] }); setIsModalOpen(true); };
  const handleSave = async (e) => { e.preventDefault(); setIsSaving(true); try { if (modalMode === 'add') await addDoc(collection(db, "materi_pelajaran"), { ...formData }); else await updateDoc(doc(db, "materi_pelajaran", formData.id), { ...formData }); setIsModalOpen(false); fetchMapel(); } catch (error) { alert("Gagal menyimpan."); } finally { setIsSaving(false); } };
  const handleDelete = async (id) => { if (confirm('Hapus Mapel ini?')) { try { await deleteDoc(doc(db, "materi_pelajaran", id)); fetchMapel(); } catch (error) { alert("Gagal menghapus."); } } };

  if (isLoading) return <div className="p-10 text-center font-bold text-gray-500">Memuat Database...</div>;
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-emerald-200 flex justify-between items-center shadow-sm">
        <div><h3 className="text-lg font-bold text-emerald-900 flex items-center text-left"><FolderOpen className="w-5 h-5 mr-2" /> Kelola Teks & Link Buku</h3><p className="text-gray-600 text-sm mt-1 text-left text-gray-900">Hierarki: Paket → Kelas → Mata Pelajaran</p></div>
        <button onClick={() => handleOpenModal('add')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg flex items-center shadow-sm whitespace-nowrap"><Plus className="w-4 h-4 mr-1.5" /> Tambah Mapel</button>
      </div>
      <div className="flex space-x-2 border-b border-gray-200">
        {['Paket A', 'Paket B', 'Paket C'].map(paket => (
          <button key={paket} onClick={() => setActiveTab(paket)} className={`px-6 py-3 font-bold text-sm rounded-t-lg transition-colors ${activeTab === paket ? 'bg-white text-emerald-700 border-t border-x border-gray-200 shadow-[0_4px_0_0_white]' : 'bg-gray-100 text-gray-500 border border-transparent hover:bg-gray-200'}`}>{paket}</button>
        ))}
      </div>
      <div className="space-y-6">
        {kelasOptions[activeTab].map(kelasStr => {
          const mapelDiKelasIni = groupedByKelas[kelasStr] || [];
          if (mapelDiKelasIni.length === 0) return null;
          return (
            <div key={kelasStr} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex justify-between items-center shadow-sm"><h4 className="font-bold text-gray-800 text-lg">{kelasStr}</h4></div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left text-gray-600 min-w-[700px]">
                  <thead className="text-xs text-gray-500 uppercase border-b bg-gray-50"><tr><th className="px-5 py-3 w-1/4">Mata Pelajaran</th><th className="px-5 py-3 text-center">Status Teks MD</th><th className="px-5 py-3 text-center">Link PDF Asli</th><th className="px-5 py-3 text-center">Aksi</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {mapelDiKelasIni.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-4 font-bold text-gray-800">{m.subject}</td>
                        <td className="px-5 py-4 text-center"><div className="flex flex-col gap-1 items-center">{m.txtGanjil ? <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Ganjil: Ada</span> : <span className="text-red-500 text-[10px] font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100">Ganjil: Kosong</span>}{m.txtGenap ? <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Genap: Ada</span> : <span className="text-red-500 text-[10px] font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100">Genap: Kosong</span>}</div></td>
                        <td className="px-5 py-4 text-center">{m.linkPdf ? <a href={m.linkPdf} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs font-bold flex justify-center items-center"><ExternalLink className="w-3 h-3 mr-1" /> Buka PDF</a> : <span className="text-gray-400 text-xs italic">Belum Ada</span>}</td>
                        <td className="px-5 py-4 flex justify-center space-x-2"><button onClick={() => handleOpenModal('edit', m)} className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(m.id)} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center text-white shadow-md"><h3 className="font-bold text-lg">{modalMode === 'add' ? 'Tambah Mata Pelajaran' : 'Edit Mata Pelajaran & Teks'}</h3><button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 hover:text-emerald-200" /></button></div>
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-700 mb-1 text-left">Paket Pendidikan</label><select className="w-full border px-3 py-2 rounded-lg bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.paket} onChange={(e) => setFormData({...formData, paket: e.target.value, kelas: kelasOptions[e.target.value][0]})}><option value="Paket A">Paket A</option><option value="Paket B">Paket B</option><option value="Paket C">Paket C</option></select></div>
                <div><label className="block text-xs font-bold text-gray-700 mb-1 text-left">Kelas Spesifik</label><select className="w-full border px-3 py-2 rounded-lg bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.kelas} onChange={(e) => setFormData({...formData, kelas: e.target.value})}>{kelasOptions[formData.paket].map(k => <option key={k} value={k}>{k}</option>)}</select></div>
              </div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1 text-left">Nama Mata Pelajaran</label><input type="text" required className="w-full border border-gray-300 px-3 py-2 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} /></div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <label className="block text-xs font-bold text-blue-900 mb-1 text-left flex items-center"><Library className="w-3.5 h-3.5 mr-1" /> Link Buku Asli (Google Drive / Opsional)</label>
                <input type="url" placeholder="https://drive.google.com/file/d/..." className="w-full border border-blue-200 px-3 py-2 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={formData.linkPdf || ''} onChange={(e) => setFormData({...formData, linkPdf: e.target.value})} />
                <p className="text-[10px] text-blue-700 mt-1">Tempelkan link buku agar Tutor bisa membacanya di menu E-Library.</p>
              </div>

              <div className="border-t pt-4"><label className="block text-xs font-bold text-gray-700 mb-1 text-left">Isi Markdown (.txt) - Semester Ganjil</label><textarea rows="4" className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm font-mono bg-white text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.txtGanjil} onChange={(e) => setFormData({...formData, txtGanjil: e.target.value})} /></div>
              <div><label className="block text-xs font-bold text-gray-700 mb-1 text-left">Isi Markdown (.txt) - Semester Genap</label><textarea rows="4" className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm font-mono bg-white text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500" value={formData.txtGenap} onChange={(e) => setFormData({...formData, txtGenap: e.target.value})} /></div>
              <div className="flex justify-end space-x-3 pt-4 border-t"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">Batal</button><button type="submit" disabled={isSaving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-md">{isSaving ? 'Menyimpan...' : 'Simpan Data'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- FUNGSI GLOBAL PEMANGGILAN API OPENROUTER ---
async function callOpenRouterAI(prompt, modelId) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin, 
        "X-Title": "PKBM Question Generator" 
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP Error ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    throw new Error("Koneksi API Gagal: " + error.message);
  }
}

// --- KOMPONEN: RPP (PPM) GENERATOR ---
function RppGenerator({ lembaga }) {
  const [mapelDB, setMapelDB] = useState([]);
  const [tutorsList, setTutorsList] = useState([]);
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [selectedModel, setSelectedModel] = useState(OPENROUTER_MODELS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "materi_pelajaran"));
      setMapelDB(querySnapshot.docs.map(doc => doc.data()));
      const tutorSnap = await getDocs(collection(db, "tutors"));
      const tutors = tutorSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTutorsList(tutors);
      if(tutors.length > 0) setSelectedTutorId(tutors[0].id);
    }; fetchData();
  }, []);

  const kelasOptionsDict = { 'Paket A': ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'], 'Paket B': ['Kelas 7', 'Kelas 8', 'Kelas 9'], 'Paket C': ['Kelas 10', 'Kelas 11', 'Kelas 12'] };
  
  // PERBAIKAN: DPL sekarang menggunakan Array agar bisa memilih lebih dari satu
  const [formData, setFormData] = useState({ 
    paket: 'Paket B', kelas: 'Kelas 8', subject: '', semesterType: 'Ganjil', 
    topic: '', waktu: '8 x pertemuan (20 JP)', dpl: [] 
  });
  
  const availableSubjects = [...new Set(mapelDB.filter(m => m.paket === formData.paket && m.kelas === formData.kelas).map(m => m.subject))];
  const selectedTutor = tutorsList.find(t => t.id === selectedTutorId) || { name: 'Pilih Tutor', nip: '-', ttdUrl: '' };

  const handleDplToggle = (dplLabel) => {
    setFormData(prev => {
      if (prev.dpl.includes(dplLabel)) return { ...prev, dpl: prev.dpl.filter(d => d !== dplLabel) };
      return { ...prev, dpl: [...prev.dpl, dplLabel] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.topic) { alert("Pilih Mapel dan isi Judul Bab Pembelajaran!"); return; }
    if (!selectedTutorId) { alert("Pilih Tutor Penyusun terlebih dahulu!"); return; }
    if (formData.dpl.length === 0) { alert("Mohon pilih setidaknya satu Dimensi Profil Lulusan (DPL)!"); return; }
    if (!OPENROUTER_API_KEY) { alert("API KEY KOSONG!"); return; }
    
    setIsGenerating(true); setResult(null);
    try {
      const mapelTerkait = mapelDB.find(m => m.paket === formData.paket && m.kelas === formData.kelas && m.subject === formData.subject);
      const contextText = formData.semesterType === 'Ganjil' ? mapelTerkait?.txtGanjil : mapelTerkait?.txtGenap;
      
      if (!contextText || contextText.trim() === '') { alert(`Teks materi kosong. Hubungi Super Admin.`); setIsGenerating(false); return; }

      const dplString = formData.dpl.join(", ");
      
      const prompt = `Anda adalah ahli pembuat RPP/PPM (Perencanaan Pembelajaran Mendalam) untuk PKBM. Buat RPP berdasarkan teks berikut. 
Mata Pelajaran: ${formData.subject}, Kelas: ${formData.kelas}.

PENTING (STRICT RULE): 
1. Fokuskan RPP INI HANYA PADA MATERI DI BAB / TOPIK: "${formData.topic}". Abaikan bab lain yang ada di teks referensi di bawah ini.
2. Terapkan Dimensi Profil Lulusan (DPL) berikut dalam aktivitas pembelajaran: ${dplString}. Pastikan langkah-langkah di kegiatan inti melatih keterampilan tersebut.
3. HASIL WAJIB DALAM FORMAT JSON ARRAY/OBJECT MURNI tanpa blok kode markdown seperti \`\`\`json. Output harus langsung berwujud JSON seperti struktur ini (buat 2-3 pertemuan):
{
  "identifikasi": {
    "murid": "Kondisi awal dan karakteristik murid terkait materi bab ini",
    "materi": "Deskripsi singkat materi dari bab tersebut",
    "dpl": "${dplString}"
  },
  "desain": {
    "cp": "Capaian Pembelajaran spesifik materi ini",
    "lintas_disiplin": "Keterkaitan dengan disiplin ilmu lain",
    "tp": "Tujuan Pembelajaran utama bab ini",
    "indikator": ["Indikator 1", "Indikator 2", "Indikator 3"],
    "praktek": "Model, Strategi, dan Metode",
    "kemitraan": "Kemitraan pembelajaran",
    "lingkungan": "Ruang fisik dan virtual",
    "digital": "Pemanfaatan digital",
    "tugas": ["Tugas 1", "Tugas 2"]
  },
  "pertemuan": [
    {
      "ke": 1,
      "durasi": "2 x 40 menit",
      "awal": ["Langkah 1", "Langkah 2"],
      "inti": ["Langkah inti 1 mencerminkan DPL", "Langkah inti 2"],
      "penutup": ["Langkah penutup 1", "Langkah penutup 2"]
    }
  ],
  "asesmen": {
    "awal": "Deskripsi asesmen awal",
    "proses": "Deskripsi asesmen formatif",
    "akhir": "Deskripsi asesmen sumatif"
  }
}

TEKS MATERI KESELURUHAN (Cari hanya Bab: ${formData.topic}):
${contextText.substring(0, 15000)}`;

      let responseText = await callOpenRouterAI(prompt, selectedModel);
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const generatedJSON = JSON.parse(responseText);
      
      setResult({ config: formData, data: generatedJSON, tutor: selectedTutor });
    } catch (error) {
      alert("Proses Generate Gagal!\nPesan: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const getTanggal = () => {
    const tgl = new Date();
    const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${tgl.getDate()} ${bulan[tgl.getMonth()]} ${tgl.getFullYear()}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden no-print">
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          
          {/* KOLOM KIRI */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-emerald-800 border-b pb-2">1. Pengaturan Dasar</h4>
            
            <div className="flex space-x-4 mb-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-blue-900 mb-1">Tutor Penyusun (TTD)</label>
                <select className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={selectedTutorId} onChange={(e) => setSelectedTutorId(e.target.value)}>
                  <option value="" disabled>-- Pilih Tutor --</option>
                  {tutorsList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-purple-900 mb-1">Pilihan Model AI (OpenRouter)</label>
                <select className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm bg-purple-50 outline-none focus:ring-2 focus:ring-purple-500 font-bold" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                  {OPENROUTER_MODELS.map(model => <option key={model.id} value={model.id}>{model.label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1"><label className="block text-xs font-bold text-gray-700 mb-1">Jenjang</label><select className="w-full px-3 py-2 border rounded-lg text-sm outline-none bg-gray-50" value={formData.paket} onChange={(e) => setFormData({...formData, paket: e.target.value, kelas: kelasOptionsDict[e.target.value][0]})}><option value="Paket A">Paket A (SD)</option><option value="Paket B">Paket B (SMP)</option><option value="Paket C">Paket C (SMA)</option></select></div>
              <div className="flex-1"><label className="block text-xs font-bold text-gray-700 mb-1">Kelas</label><select className="w-full px-3 py-2 border rounded-lg text-sm outline-none bg-gray-50" value={formData.kelas} onChange={(e) => setFormData({...formData, kelas: e.target.value})}>{kelasOptionsDict[formData.paket].map(k => <option key={k} value={k}>{k}</option>)}</select></div>
            </div>
            
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Mapel (Terdaftar)</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm outline-none bg-gray-50" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})}>
                  <option value="">-- Pilih Mapel --</option>{availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex space-x-4 bg-amber-50 p-2 rounded-lg border border-amber-200">
              <label className="text-xs font-medium text-amber-900 flex items-center cursor-pointer"><input type="radio" checked={formData.semesterType === 'Ganjil'} onChange={() => setFormData({...formData, semesterType: 'Ganjil'})} className="mr-1.5" /> File Smt Ganjil</label>
              <label className="text-xs font-medium text-amber-900 flex items-center cursor-pointer"><input type="radio" checked={formData.semesterType === 'Genap'} onChange={() => setFormData({...formData, semesterType: 'Genap'})} className="mr-1.5" /> File Smt Genap</label>
            </div>
          </div>

          {/* KOLOM KANAN */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-emerald-800 border-b pb-2">2. Fokus Bab & DPL Pembelajaran</h4>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Judul Bab / Topik Materi (Wajib Diisi)</label>
              <input type="text" required placeholder="Contoh: Bab 1: Sistem Organisasi Kehidupan" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} />
              <p className="text-[10px] text-gray-500 mt-1">AI hanya akan membaca dan merangkum RPP khusus untuk Judul Bab yang Anda ketik di atas.</p>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Alokasi Waktu Keseluruhan</label>
              <input type="text" required placeholder="Contoh: 8 x pertemuan (20 JP)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white" value={formData.waktu} onChange={(e) => setFormData({...formData, waktu: e.target.value})} />
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <label className="block text-xs font-bold text-gray-800 mb-2">Pilih Dimensi Profil Lulusan (DPL) Yang Ingin Dilatih</label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                {DPL_OPTIONS.map(opt => {
                  const labelVal = `${opt.id} (${opt.label})`;
                  return (
                    <label key={opt.id} className="flex items-start space-x-2 text-[11px] text-gray-700 cursor-pointer hover:bg-emerald-50 p-1 rounded">
                      <input type="checkbox" className="mt-0.5" checked={formData.dpl.includes(labelVal)} onChange={() => handleDplToggle(labelVal)} />
                      <span className="leading-tight break-words"><strong>{opt.id}</strong><br/>{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
          <button type="submit" disabled={isGenerating} className={`md:col-span-2 w-full font-bold py-3.5 rounded-xl text-sm transition-all shadow-sm ${isGenerating ? 'bg-emerald-200 text-emerald-800 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:translate-y-1'}`}>
            {isGenerating ? 'AI Sedang Merumuskan RPP Per Bab...' : 'Generate RPP (PPM)'}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-white shadow-xl border border-gray-300 animate-in fade-in duration-500 relative">
          <div className="bg-gray-100 p-4 border-b flex justify-between items-center no-print">
            <div className="text-sm font-bold text-gray-700 flex items-center"><Pencil className="w-4 h-4 mr-2" /> Live Edit Aktif (Klik teks untuk merubah)</div>
            <button onClick={() => window.print()} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2 rounded-md flex items-center shadow-sm"><Download className="w-4 h-4 mr-1.5" /> Print RPP / PDF</button>
          </div>

          <div className="printable-area p-10 font-serif text-[13px] leading-relaxed text-black bg-white text-left mx-auto max-w-[800px]">
            {/* IDENTITAS */}
            <h2 className="text-center font-bold text-lg mb-6 underline">PERENCANAAN PEMBELAJARAN MENDALAM (PPM)</h2>
            <table className="w-full mb-6 font-medium">
              <tbody>
                <tr><td className="w-40 py-1">Nama Lembaga</td><td>: PKBM Al Barakah</td></tr>
                <tr><td className="py-1">Nama Tutor</td><td>: {result.tutor.name}</td></tr>
                <tr><td className="py-1">Mata Pelajaran</td><td>: {result.config.subject}</td></tr>
                <tr><td className="py-1">Fase/Kelas/Smt</td><td>: {result.config.kelas} / {result.config.semesterType}</td></tr>
                <tr><td className="py-1">Alokasi Waktu</td><td>: <span contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-100">{result.config.waktu}</span></td></tr>
                <tr><td className="py-1">Judul Bab / Topik</td><td>: <span contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-100 font-bold uppercase">{result.config.topic}</span></td></tr>
              </tbody>
            </table>

            {/* I. IDENTIFIKASI */}
            <h3 className="font-bold text-[14px] mt-6 mb-2">I. IDENTIFIKASI</h3>
            <div className="pl-4 space-y-3">
              <div>
                <strong>1. Murid:</strong><br/>
                <div contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-50">{result.data.identifikasi.murid}</div>
              </div>
              <div>
                <strong>2. Materi Pembelajaran:</strong><br/>
                <div contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-50">{result.data.identifikasi.materi}</div>
              </div>
              <div>
                <strong>3. Dimensi Profil Lulusan (DPL):</strong><br/>
                <div contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-50 font-bold">{result.data.identifikasi.dpl}</div>
              </div>
            </div>

            {/* II. DESAIN PEMBELAJARAN */}
            <h3 className="font-bold text-[14px] mt-8 mb-2">II. DESAIN PEMBELAJARAN</h3>
            <div className="pl-4 space-y-3">
              <div><strong>1. Capaian Pembelajaran:</strong><div contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-50">{result.data.desain.cp}</div></div>
              <div><strong>2. Lintas Disiplin Ilmu:</strong><div contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-50">{result.data.desain.lintas_disiplin}</div></div>
              <div><strong>3. Tujuan Pembelajaran:</strong><div contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-50">{result.data.desain.tp}</div>
                <div className="mt-1"><strong>Indikator:</strong>
                  <ul className="list-disc pl-5 mt-1">
                    {result.data.desain.indikator.map((ind, i) => <li key={i} contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-50">{ind}</li>)}
                  </ul>
                </div>
              </div>
              <div><strong>4. Praktek Pedagogis:</strong><div contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-50">{result.data.desain.praktek}</div></div>
              <div><strong>5. Kemitraan & Lingkungan:</strong><div contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-50">{result.data.desain.kemitraan} | {result.data.desain.lingkungan}</div></div>
              <div><strong>6. Pemanfaatan Digital:</strong><div contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-50">{result.data.desain.digital}</div></div>
              <div><strong>7. Tugas Ko Kurikuler:</strong>
                <ul className="list-disc pl-5 mt-1">
                  {result.data.desain.tugas.map((t, i) => <li key={i} contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-50">{t}</li>)}
                </ul>
              </div>
            </div>

            {/* III. PENGALAMAN BELAJAR */}
            <h3 className="font-bold text-[14px] mt-8 mb-4">III. PENGALAMAN BELAJAR</h3>
            <div className="pl-4 space-y-6">
              {result.data.pertemuan.map((p, i) => (
                <div key={i} className="border border-gray-300 p-4 rounded-lg bg-gray-50/50">
                  <h4 className="font-bold border-b border-gray-300 pb-1 mb-2">Pertemuan {p.ke} ({p.durasi})</h4>
                  <div className="mb-2"><strong>Kegiatan Awal:</strong><ul className="list-disc pl-5 mt-1">{p.awal.map((x, j) => <li key={j} contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-100">{x}</li>)}</ul></div>
                  <div className="mb-2"><strong>Kegiatan Inti:</strong><ul className="list-disc pl-5 mt-1">{p.inti.map((x, j) => <li key={j} contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-100">{x}</li>)}</ul></div>
                  <div><strong>Kegiatan Penutup:</strong><ul className="list-disc pl-5 mt-1">{p.penutup.map((x, j) => <li key={j} contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-100">{x}</li>)}</ul></div>
                </div>
              ))}
            </div>

            {/* IV. ASESMEN */}
            <h3 className="font-bold text-[14px] mt-8 mb-2">IV. ASESMEN PEMBELAJARAN</h3>
            <div className="pl-4 space-y-2">
              <div><strong>1. Asesmen Awal:</strong> <span contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-50">{result.data.asesmen.awal}</span></div>
              <div><strong>2. Asesmen Proses:</strong> <span contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-50">{result.data.asesmen.proses}</span></div>
              <div><strong>3. Asesmen Akhir:</strong> <span contentEditable suppressContentEditableWarning className="outline-emerald-300 hover:bg-gray-50">{result.data.asesmen.akhir}</span></div>
            </div>

            {/* TANDA TANGAN */}
            <div className="mt-16 pt-8 border-t border-gray-400 flex justify-between text-center relative break-inside-avoid">
              {lembaga.stempel && <img src={lembaga.stempel} alt="Stempel" className="absolute left-[20%] top-4 h-32 opacity-80 mix-blend-multiply pointer-events-none" />}
              <div className="w-64 z-10 relative">
                <p className="mb-2">Mengetahui,</p>
                <p className="font-bold">Kepala PKBM Al Barakah</p>
                <div className="h-24 flex items-center justify-center relative">
                  {lembaga.kepsekTtd ? <img src={lembaga.kepsekTtd} alt="TTD Kepsek" className="max-h-full max-w-full mix-blend-multiply" /> : <div className="text-gray-300 italic text-xs">TTD Belum Diset</div>}
                </div>
                <p className="font-bold underline uppercase">{lembaga.kepsekName}</p>
                <p className="text-xs">NIP. {lembaga.kepsekNip}</p>
              </div>

              <div className="w-64 z-10 relative">
                <p className="mb-2">Madiun, {getTanggal()}</p>
                <p className="font-bold">Tutor Mata Pelajaran</p>
                <div className="h-24 flex items-center justify-center relative">
                  {result.tutor.ttdUrl ? <img src={result.tutor.ttdUrl} alt="TTD Tutor" className="max-h-full max-w-full mix-blend-multiply" /> : <div className="text-gray-300 italic text-xs">TTD Belum Diset</div>}
                </div>
                <p className="font-bold underline uppercase">{result.tutor.name}</p>
                <p className="text-xs">NIP. {result.tutor.nip}</p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// --- KOMPONEN: AI GENERATOR SOAL (DENGAN TTD KISI-KISI) ---
function AiGenerator({ lembaga }) {
  const [mapelDB, setMapelDB] = useState([]);
  const [tutorsList, setTutorsList] = useState([]);
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [selectedModel, setSelectedModel] = useState(OPENROUTER_MODELS[0].id); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('soal'); 

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "materi_pelajaran"));
      setMapelDB(querySnapshot.docs.map(doc => doc.data()));
      const tutorSnap = await getDocs(collection(db, "tutors"));
      const tutors = tutorSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTutorsList(tutors);
      if(tutors.length > 0) setSelectedTutorId(tutors[0].id);
    }; fetchData();
  }, []);

  const kelasOptionsDict = { 'Paket A': ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'], 'Paket B': ['Kelas 7', 'Kelas 8', 'Kelas 9'], 'Paket C': ['Kelas 10', 'Kelas 11', 'Kelas 12'] };
  const [formData, setFormData] = useState({ paket: 'Paket B', kelas: 'Kelas 8', subject: '', examType: 'SAS (Sumatif Akhir Semester)', semesterType: 'Ganjil', topic: '', count: '5' });
  const availableSubjects = [...new Set(mapelDB.filter(m => m.paket === formData.paket && m.kelas === formData.kelas).map(m => m.subject))];

  const selectedTutor = tutorsList.find(t => t.id === selectedTutorId) || { name: 'Pilih Tutor', nip: '-', ttdUrl: '' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject) { alert("Pilih Mata Pelajaran!"); return; }
    if (!selectedTutorId) { alert("Pilih Tutor Penyusun terlebih dahulu!"); return; }
    if (!OPENROUTER_API_KEY) { alert("API KEY KOSONG!"); return; }
    
    setIsGenerating(true); setResult(null);
    const numOptions = formData.paket === 'Paket C' ? 5 : 4;

    try {
      const mapelTerkait = mapelDB.find(m => m.paket === formData.paket && m.kelas === formData.kelas && m.subject === formData.subject);
      let contextText = ""; let cakupanMateri = "";

      if (formData.examType.includes('SAS')) {
        contextText = formData.semesterType === 'Ganjil' ? mapelTerkait?.txtGanjil : mapelTerkait?.txtGenap;
        cakupanMateri = `Semester ${formData.semesterType === 'Ganjil' ? '1' : '2'} (${formData.kelas})`;
      } else if (formData.examType.includes('UPK')) {
        contextText = (mapelTerkait?.txtGanjil || '') + "\n\n" + (mapelTerkait?.txtGenap || '');
        cakupanMateri = `Seluruh Buku (${formData.kelas})`;
      } else {
        contextText = (mapelTerkait?.txtGanjil || '') + "\n\n" + (mapelTerkait?.txtGenap || '');
        cakupanMateri = `Topik: ${formData.topic}`;
      }

      if (!contextText || contextText.trim() === '') { alert(`Teks materi kosong.`); setIsGenerating(false); return; }

      const prompt = `Buatlah ${formData.count} butir soal pilihan ganda murni berdasarkan teks materi di bawah ini.
Jenjang: ${formData.paket} (${formData.kelas}), Mapel: ${formData.subject}. Tingkat kesulitan: SEDANG (relatif MUDAH).
PENTING: OUTPUT WAJIB FORMAT JSON ARRAY MURNI SEPERTI STRUKTUR DIBAWAH INI. Jangan sertakan format \`\`\`json.
Format JSON: [{"no":1,"soal":"...","jawaban_benar":"Opsi A","pengecoh_1":"Opsi B","pengecoh_2":"Opsi C","pengecoh_3":"Opsi D",${numOptions===5?'"pengecoh_4":"Opsi E",':''}"bab":"Nama Bab","indikator":"Siswa mampu..."}]
TEKS: ${contextText.substring(0, 15000)}`;

      let responseText = await callOpenRouterAI(prompt, selectedModel);
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      setResult({ title: `${formData.examType} - ${formData.subject}`, cakupan: cakupanMateri, numOptions, tutor: selectedTutor, data: JSON.parse(responseText) });
    } catch (error) { alert("Generate Gagal!\n" + error.message); } finally { setIsGenerating(false); }
  };

  const getTanggal = () => {
    const tgl = new Date(); const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${tgl.getDate()} ${bulan[tgl.getMonth()]} ${tgl.getFullYear()}`;
  };

  const exportExcelColumn = () => {
    let tableHTML = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><thead><tr><th style="background-color: #d1fae5;">No</th><th style="background-color: #d1fae5;">Butir Soal</th><th style="background-color: #a7f3d0; font-weight: bold;">A : Jawaban Benar</th><th style="background-color: #f3f4f6;">B</th><th style="background-color: #f3f4f6;">C</th><th style="background-color: #f3f4f6;">D</th>${result.numOptions === 5 ? '<th style="background-color: #f3f4f6;">E</th>' : ''}</tr></thead><tbody>`;
    result.data.forEach(row => { tableHTML += `<tr><td>${row.no}</td><td>${row.soal}</td><td>${row.jawaban_benar}</td><td>${row.pengecoh_1}</td><td>${row.pengecoh_2}</td><td>${row.pengecoh_3}</td>${result.numOptions === 5 ? `<td>${row.pengecoh_4}</td>` : ''}</tr>`; });
    tableHTML += `</tbody></table></body></html>`;
    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Soal_PKBM.xls`; link.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl shadow-sm mx-4 sm:mx-0">
        <div className="flex items-start">
          <div className="flex-shrink-0"><AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" /></div>
          <div className="ml-3 text-left">
            <h3 className="text-sm font-bold text-blue-800">Peringatan Penting untuk Tutor</h3>
            <div className="mt-1 text-xs text-blue-700 leading-relaxed">
              <p>Aplikasi ini adalah alat bantu berbasis AI. Harap selalu lakukan <strong>cross-check ulang</strong> terhadap soal yang dihasilkan. Gunakan fitur <strong>Live Edit</strong> pada tabel di bawah untuk merevisi teks (klik langsung pada tabel) sebelum mendownload dokumen.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden no-print">
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="space-y-5">
            <h4 className="font-bold text-sm text-emerald-800 border-b pb-2 flex items-center">1. Konfigurasi Evaluasi</h4>
            
            <div className="flex space-x-4 mb-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-blue-900 mb-1">Tutor Penyusun (TTD)</label>
                <select className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={selectedTutorId} onChange={(e) => setSelectedTutorId(e.target.value)}>
                  <option value="" disabled>-- Pilih Tutor --</option>
                  {tutorsList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-purple-900 mb-1">Pilihan AI (OpenRouter)</label>
                <select className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm bg-purple-50 outline-none focus:ring-2 focus:ring-purple-500 font-bold" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                  {OPENROUTER_MODELS.map(model => <option key={model.id} value={model.id}>{model.label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1"><label className="block text-xs font-bold text-gray-700 mb-1">Jenjang Paket</label><select className="w-full px-3 py-2 border rounded-lg text-sm outline-none" value={formData.paket} onChange={(e) => setFormData({...formData, paket: e.target.value, kelas: kelasOptionsDict[e.target.value][0]})}><option value="Paket A">Paket A (SD)</option><option value="Paket B">Paket B (SMP)</option><option value="Paket C">Paket C (SMA)</option></select></div>
              <div className="flex-1"><label className="block text-xs font-bold text-gray-700 mb-1">Kelas Spesifik</label><select className="w-full px-3 py-2 border rounded-lg text-sm outline-none" value={formData.kelas} onChange={(e) => setFormData({...formData, kelas: e.target.value})}>{kelasOptionsDict[formData.paket].map(k => <option key={k} value={k}>{k}</option>)}</select></div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Evaluasi</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none" value={formData.examType} onChange={(e) => setFormData({...formData, examType: e.target.value})}><option>Ulangan Harian (Topik Spesifik)</option><option>SAS (Sumatif Akhir Semester)</option><option>UPK (Ujian Kelulusan Paket)</option></select>
            </div>
            {formData.examType.includes('SAS') && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex space-x-4">
                  <label className="text-xs font-medium text-amber-800 flex items-center cursor-pointer"><input type="radio" checked={formData.semesterType === 'Ganjil'} onChange={() => setFormData({...formData, semesterType: 'Ganjil'})} className="mr-1.5" /> Semester Ganjil</label>
                  <label className="text-xs font-medium text-amber-800 flex items-center cursor-pointer"><input type="radio" checked={formData.semesterType === 'Genap'} onChange={() => setFormData({...formData, semesterType: 'Genap'})} className="mr-1.5" /> Semester Genap</label>
                </div>
              </div>
            )}
            {formData.examType.includes('Ulangan Harian') && (
              <div><input type="text" placeholder="Topik spesifik..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} /></div>
            )}
          </div>
          <div className="space-y-5">
            <h4 className="font-bold text-sm text-emerald-800 border-b pb-2 flex items-center">2. Pengaturan Mata Pelajaran</h4>
            <div><label className="block text-xs font-bold text-gray-700 mb-1">Pilih Mapel (Terdaftar)</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})}><option value="" disabled>-- Pilih Mapel --</option>{availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs font-bold text-gray-700 mb-1">Jumlah Butir Soal</label><input type="number" min="1" max="40" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none" value={formData.count} onChange={(e) => setFormData({...formData, count: e.target.value})} /></div>
          </div>
          <button type="submit" disabled={isGenerating} className={`md:col-span-2 w-full font-bold py-3.5 rounded-xl text-sm transition-all shadow-sm ${isGenerating ? 'bg-emerald-200 text-emerald-800 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:translate-y-1'}`}>
            {isGenerating ? 'Menghubungi OpenRouter AI...' : 'Generate Soal dan Kisi-kisi'}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-500">
          <div className="bg-gray-50 p-4 border-b flex justify-between items-center no-print">
            <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
              <button onClick={() => setActiveTab('soal')} className={`px-5 py-2 rounded-md text-xs font-bold ${activeTab === 'soal' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600'}`}>1. Spreadsheet Soal</button>
              <button onClick={() => setActiveTab('kisi')} className={`px-5 py-2 rounded-md text-xs font-bold ${activeTab === 'kisi' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600'}`}>2. Cetak Kisi-kisi PDF</button>
            </div>
            {activeTab === 'soal' ? (
              <button onClick={exportExcelColumn} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-md flex items-center shadow-sm"><FileSpreadsheet className="w-4 h-4 mr-1.5" /> Export Excel (.xls)</button>
            ) : (
              <button onClick={() => window.print()} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-md flex items-center shadow-sm"><Download className="w-4 h-4 mr-1.5" /> Print PDF Rapi</button>
            )}
          </div>

          {activeTab === 'soal' && (
            <div className="p-4 w-full overflow-x-auto no-print">
              <table className="w-full text-xs text-left border border-gray-200 min-w-[800px] text-gray-900 mt-2">
                <thead className="bg-gray-100 uppercase">
                  <tr><th className="p-3 border w-10">No</th><th className="p-3 border min-w-[200px]">Butir Soal</th><th className="p-3 border bg-green-50 min-w-[150px]">A (Kunci)</th><th className="p-3 border min-w-[150px]">B</th><th className="p-3 border min-w-[150px]">C</th><th className="p-3 border min-w-[150px]">D</th>{result.numOptions === 5 && <th className="p-3 border min-w-[150px]">E</th>}</tr>
                </thead>
                <tbody>
                  {result.data.map((r, idx) => (
                    <tr key={r.no} className="border-b">
                      <td className="p-3 border font-bold align-top">{r.no}</td>
                      <td className="border p-0 align-top"><div contentEditable suppressContentEditableWarning className="p-3 min-h-[50px] outline-none">{r.soal}</div></td>
                      <td className="border p-0 align-top bg-green-50/30"><div contentEditable suppressContentEditableWarning className="p-3 min-h-[50px] outline-none font-medium text-green-800">{r.jawaban_benar}</div></td>
                      <td className="border p-0 align-top"><div contentEditable suppressContentEditableWarning className="p-3 min-h-[50px] outline-none">{r.pengecoh_1}</div></td>
                      <td className="border p-0 align-top"><div contentEditable suppressContentEditableWarning className="p-3 min-h-[50px] outline-none">{r.pengecoh_2}</div></td>
                      <td className="border p-0 align-top"><div contentEditable suppressContentEditableWarning className="p-3 min-h-[50px] outline-none">{r.pengecoh_3}</div></td>
                      {result.numOptions === 5 && <td className="border p-0 align-top"><div contentEditable suppressContentEditableWarning className="p-3 min-h-[50px] outline-none">{r.pengecoh_4}</div></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'kisi' && (
            <div id="printable-kisi" className="printable-area p-10 bg-white text-black font-serif w-full max-w-4xl mx-auto shadow-sm">
              <div className="text-center mb-6">
                <h3 className="text-base font-bold uppercase tracking-wide">KISI-KISI PENULISAN SOAL EVALUASI</h3>
                <h4 className="text-sm font-bold uppercase mt-1">PKBM AL BARAKAH</h4>
                <div className="text-xs text-left grid grid-cols-2 gap-2 max-w-xl mx-auto mt-5 font-sans border border-gray-800 p-3">
                  <div>Mata Pelajaran: <strong>{formData.subject}</strong></div><div>Jenjang / Kelas: <strong>{formData.paket} - {formData.kelas}</strong></div>
                  <div>Jenis Evaluasi: <strong>{formData.examType}</strong></div><div>Bentuk Evaluasi: <strong>Pilihan Ganda</strong></div>
                </div>
              </div>
              <table className="w-full text-xs border-collapse border border-black text-left mb-10">
                <thead>
                  <tr className="bg-gray-100 text-center uppercase">
                    <th className="p-2 border border-black font-bold w-12">No</th>
                    <th className="p-2 border border-black font-bold w-48">Materi Acuan / Bab</th>
                    <th className="p-2 border border-black font-bold">Indikator Pencapaian Kompetensi (IPK)</th>
                    <th className="p-2 border border-black font-bold w-20">Bentuk</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((r, idx) => (
                    <tr key={r.no}>
                      <td className="p-2 border border-black text-center font-bold align-top">{r.no}</td>
                      <td className="border border-black p-0 align-top"><div contentEditable suppressContentEditableWarning className="p-2 outline-none min-h-[40px]">{r.bab}</div></td>
                      <td className="border border-black p-0 align-top"><div contentEditable suppressContentEditableWarning className="p-2 outline-none min-h-[40px]">{r.indikator}</div></td>
                      <td className="p-2 border border-black text-center font-bold align-top">PG</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* TANDA TANGAN KISI-KISI */}
              <div className="flex justify-between text-center relative text-[13px] break-inside-avoid mt-8 border-t border-gray-400 pt-8">
                {lembaga.stempel && <img src={lembaga.stempel} alt="Stempel" className="absolute left-[15%] top-4 h-28 opacity-80 mix-blend-multiply pointer-events-none" />}
                <div className="w-64 z-10 relative">
                  <p className="mb-1">Mengetahui,</p>
                  <p className="font-bold">Kepala PKBM Al Barakah</p>
                  <div className="h-20 flex items-center justify-center">
                    {lembaga.kepsekTtd ? <img src={lembaga.kepsekTtd} alt="TTD Kepsek" className="max-h-full max-w-full mix-blend-multiply" /> : <div className="text-gray-300 italic text-xs">TTD Belum Diset</div>}
                  </div>
                  <p className="font-bold underline uppercase">{lembaga.kepsekName}</p>
                  <p className="text-xs">NIP. {lembaga.kepsekNip}</p>
                </div>

                <div className="w-64 z-10 relative">
                  <p className="mb-1">Madiun, {getTanggal()}</p>
                  <p className="font-bold">Penyusun Soal</p>
                  <div className="h-20 flex items-center justify-center">
                    {result.tutor.ttdUrl ? <img src={result.tutor.ttdUrl} alt="TTD Tutor" className="max-h-full max-w-full mix-blend-multiply" /> : <div className="text-gray-300 italic text-xs">TTD Belum Diset</div>}
                  </div>
                  <p className="font-bold underline uppercase">{result.tutor.name}</p>
                  <p className="text-xs">NIP. {result.tutor.nip}</p>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}