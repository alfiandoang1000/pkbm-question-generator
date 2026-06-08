import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { FolderOpen, Plus, Edit, Trash2, X, ExternalLink, Library } from 'lucide-react';
import { db } from '../config/firebase';
import { callGeminiAI } from '../services/api';

export default function KelolaMapelView() {
  const [mapelDB, setMapelDB] = useState([]); 
  const [isLoading, setIsLoading] = useState(true); 
  const [activeTab, setActiveTab] = useState('Paket A'); 
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [modalMode, setModalMode] = useState('add'); 
  const [isSaving, setIsSaving] = useState(false); 
  const [isExtracting, setIsExtracting] = useState(false);
  const initialForm = { paket: 'Paket A', kelas: 'Kelas 1', subject: '', txtGanjil: '', txtGenap: '', linkPdf: '' }; 
  const [formData, setFormData] = useState(initialForm);

  const handleExtractMarkdown = async () => {
    if (!formData.linkPdf || !formData.linkPdf.includes("drive.google.com")) {
      alert("Masukkan link Google Drive yang valid terlebih dahulu.");
      return;
    }

    // Minta user memasukkan URL Hugging Face mereka (atau ambil dari env)
    const hfUrl = import.meta.env.VITE_HF_API_URL || prompt("Masukkan URL API Hugging Face Anda:\nContoh: https://username-pdf-to-markdown.hf.space", "");
    if (!hfUrl) return;

    setIsExtracting(true);
    try {
      // 1. Ekstrak dari GDrive ke Markdown via Hugging Face
      const hfEndpoint = hfUrl.endsWith('/') ? hfUrl + 'convert-gdrive' : hfUrl + '/convert-gdrive';
      const response = await fetch(hfEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: formData.linkPdf })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error((errData && errData.detail) ? errData.detail : "Gagal mengekstrak dari Hugging Face.");
      }

      const data = await response.json();
      const fullMarkdown = data.markdown;

      if (!fullMarkdown) {
        throw new Error("Hasil markdown kosong.");
      }

      // 2. Gunakan Gemini AI untuk membagi dua berdasarkan semester
      const prompt = `Saya memiliki isi teks dari sebuah buku pelajaran dalam format markdown.
Tolong bagi isi teks ini menjadi dua bagian: "Semester Ganjil" (Semester 1) dan "Semester Genap" (Semester 2).
Jika tidak ada penanda semester secara eksplisit, bagilah secara proporsional berdasarkan bab (tengah-tengah buku).
Jangan hilangkan materi penting. 

Format keluaran WAJIB berupa JSON murni dengan format seperti ini:
{
  "ganjil": "isi markdown untuk semester ganjil...",
  "genap": "isi markdown untuk semester genap..."
}

Berikut adalah teks bukunya:
${fullMarkdown}`;

      const aiResponse = await callGeminiAI(prompt, "gemini-1.5-flash-latest");
      let parsed;
      try {
        // Membersihkan string jika Gemini mengembalikan format markdown block
        const cleanJsonStr = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleanJsonStr);
      } catch (parseErr) {
        console.error("Gagal memparsing JSON dari Gemini:", aiResponse);
        // Fallback jika gagal parse, masukkan semuanya ke ganjil
        setFormData(prev => ({ ...prev, txtGanjil: fullMarkdown }));
        alert("Gagal membagi semester secara otomatis. Semua teks dimasukkan ke Semester Ganjil.");
        return;
      }

      setFormData(prev => ({
        ...prev,
        txtGanjil: parsed.ganjil || '',
        txtGenap: parsed.genap || ''
      }));

      alert("Berhasil mengekstrak dan membagi materi ke Ganjil & Genap!");

    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const fetchMapel = async () => { 
    try { 
      const querySnapshot = await getDocs(collection(db, "materi_pelajaran")); 
      setMapelDB(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); 
    } catch (error) { 
      alert("Gagal memuat."); 
    } finally { 
      setIsLoading(false); 
    } 
  };

  useEffect(() => { 
    fetchMapel(); 
  }, []);

  const groupedByKelas = mapelDB.filter(m => m.paket === activeTab).reduce((acc, curr) => { 
    if (!acc[curr.kelas]) acc[curr.kelas] = []; 
    acc[curr.kelas].push(curr); 
    return acc; 
  }, {});

  const kelasOptions = { 
    'Paket A': ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'], 
    'Paket B': ['Kelas 7', 'Kelas 8', 'Kelas 9'], 
    'Paket C': ['Kelas 10', 'Kelas 11', 'Kelas 12'] 
  };

  const handleOpenModal = (mode, data = null) => { 
    setModalMode(mode); 
    if (mode === 'edit' && data) {
      setFormData({...initialForm, ...data}); 
    } else {
      setFormData({ ...initialForm, paket: activeTab, kelas: kelasOptions[activeTab][0] }); 
    }
    setIsModalOpen(true); 
  };

  const handleSave = async (e) => { 
    e.preventDefault(); 
    setIsSaving(true); 
    try { 
      if (modalMode === 'add') {
        await addDoc(collection(db, "materi_pelajaran"), { ...formData }); 
      } else {
        await updateDoc(doc(db, "materi_pelajaran", formData.id), { ...formData }); 
      }
      setIsModalOpen(false); 
      fetchMapel(); 
    } catch (error) { 
      alert("Gagal menyimpan."); 
    } finally { 
      setIsSaving(false); 
    } 
  };

  const handleDelete = async (id) => { 
    if (confirm('Hapus Mapel ini?')) { 
      try { 
        await deleteDoc(doc(db, "materi_pelajaran", id)); 
        fetchMapel(); 
      } catch (error) { 
        alert("Gagal menghapus."); 
      } 
    } 
  };

  if (isLoading) return <div className="p-10 text-center font-bold text-gray-500">Memuat Database...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-emerald-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div className="text-left">
          <h3 className="text-lg font-bold text-emerald-900 flex items-center">
            <FolderOpen className="w-5 h-5 mr-2 text-emerald-700" /> Kelola Teks & Link Buku
          </h3>
          <p className="text-gray-600 text-sm mt-1">Hierarki: Paket → Kelas → Mata Pelajaran</p>
        </div>
        <button 
          onClick={() => handleOpenModal('add')} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg flex items-center shadow-sm whitespace-nowrap cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Tambah Mapel
        </button>
      </div>
      
      {/* Scrollable Tabs on Mobile */}
      <div className="flex space-x-2 border-b border-gray-200 overflow-x-auto custom-scrollbar whitespace-nowrap">
        {['Paket A', 'Paket B', 'Paket C'].map(paket => (
          <button 
            key={paket} 
            onClick={() => setActiveTab(paket)} 
            className={`px-6 py-3 font-bold text-sm rounded-t-lg transition-colors cursor-pointer ${
              activeTab === paket 
                ? 'bg-white text-emerald-700 border-t border-x border-gray-200 shadow-[0_4px_0_0_white]' 
                : 'bg-gray-100 text-gray-500 border border-transparent hover:bg-gray-200'
            }`}
          >
            {paket}
          </button>
        ))}
      </div>
      
      <div className="space-y-6">
        {kelasOptions[activeTab].map(kelasStr => {
          const mapelDiKelasIni = groupedByKelas[kelasStr] || [];
          if (mapelDiKelasIni.length === 0) return null;
          return (
            <div key={kelasStr} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex justify-between items-center shadow-sm">
                <h4 className="font-bold text-gray-800 text-lg">{kelasStr}</h4>
              </div>
              <div className="overflow-x-auto w-full"> 
                <table className="w-full text-sm text-left text-gray-600 min-w-[700px]">
                  <thead className="text-xs text-gray-500 uppercase border-b bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 w-1/4">Mata Pelajaran</th>
                      <th className="px-5 py-3 text-center">Status Teks MD</th>
                      <th className="px-5 py-3 text-center">Link PDF Asli</th>
                      <th className="px-5 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mapelDiKelasIni.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-4 font-bold text-gray-800 text-left">{m.subject}</td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex flex-col gap-1 items-center">
                            {m.txtGanjil ? (
                              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Ganjil: Ada</span>
                            ) : (
                              <span className="text-red-500 text-[10px] font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100">Ganjil: Kosong</span>
                            )}
                            {m.txtGenap ? (
                              <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Genap: Ada</span>
                            ) : (
                              <span className="text-red-500 text-[10px] font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100">Genap: Kosong</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {m.linkPdf ? (
                            <a href={m.linkPdf} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs font-bold inline-flex items-center">
                              <ExternalLink className="w-3 h-3 mr-1" /> Buka PDF
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Belum Ada</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex justify-center space-x-2">
                            <button 
                              onClick={() => handleOpenModal('edit', m)} 
                              className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors cursor-pointer" 
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(m.id)} 
                              className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors cursor-pointer" 
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center text-white shadow-md">
              <h3 className="font-bold text-lg">{modalMode === 'add' ? 'Tambah Mata Pelajaran' : 'Edit Mata Pelajaran & Teks'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="cursor-pointer hover:text-emerald-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 text-left">Paket Pendidikan</label>
                  <select 
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 font-medium" 
                    value={formData.paket} 
                    onChange={(e) => setFormData({...formData, paket: e.target.value, kelas: kelasOptions[e.target.value][0]})}
                  >
                    <option value="Paket A">Paket A</option>
                    <option value="Paket B">Paket B</option>
                    <option value="Paket C">Paket C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 text-left">Kelas Spesifik</label>
                  <select 
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg bg-gray-50 text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 font-medium" 
                    value={formData.kelas} 
                    onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                  >
                    {kelasOptions[formData.paket].map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 text-left">Nama Mata Pelajaran</label>
                <input 
                  type="text" 
                  required 
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 font-medium" 
                  value={formData.subject} 
                  onChange={(e) => setFormData({...formData, subject: e.target.value})} 
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <label className="block text-xs font-bold text-blue-900 mb-1 text-left flex items-center">
                  <Library className="w-3.5 h-3.5 mr-1" /> Link Buku Asli (Google Drive / Opsional)
                </label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder="https://drive.google.com/file/d/..." 
                    className="w-full border border-blue-200 px-3 py-2 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900" 
                    value={formData.linkPdf || ''} 
                    onChange={(e) => setFormData({...formData, linkPdf: e.target.value})} 
                  />
                  <button 
                    type="button"
                    disabled={isExtracting || !formData.linkPdf}
                    onClick={handleExtractMarkdown}
                    className="whitespace-nowrap px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center cursor-pointer"
                  >
                    {isExtracting ? (
                      <span className="flex items-center"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Memproses...</span>
                    ) : (
                      "Tarik & Bagi Otomatis"
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-blue-700 mt-1 text-left">Tempelkan link buku, lalu klik tombol untuk mengekstrak dan membagi isi ke semester ganjil & genap secara otomatis.</p>
              </div>

              <div className="border-t pt-4 text-left">
                <label className="block text-xs font-bold text-gray-700 mb-1">Isi Markdown (.txt) - Semester Ganjil</label>
                <textarea 
                  rows="4" 
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm font-mono bg-white text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500" 
                  value={formData.txtGanjil} 
                  onChange={(e) => setFormData({...formData, txtGanjil: e.target.value})} 
                />
              </div>
              <div className="text-left">
                <label className="block text-xs font-bold text-gray-700 mb-1">Isi Markdown (.txt) - Semester Genap</label>
                <textarea 
                  rows="4" 
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm font-mono bg-white text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500" 
                  value={formData.txtGenap} 
                  onChange={(e) => setFormData({...formData, txtGenap: e.target.value})} 
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-md cursor-pointer disabled:bg-emerald-400"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
