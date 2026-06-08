import React, { useState } from 'react';
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Settings, UploadCloud } from 'lucide-react';
import { db, storage } from '../config/firebase';

export default function PengaturanLembagaView({ lembaga, setLembaga }) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault(); 
    setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "lembaga"), lembaga);
      alert("Profil Sekolah & Tanda Tangan berhasil disimpan!");
    } catch (error) { 
      alert("Gagal menyimpan pengaturan."); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 2MB!");
      return;
    }

    setIsSaving(true);
    try {
      const fileRef = ref(storage, `lembaga/${field}_${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setLembaga(prev => ({ ...prev, [field]: url }));
    } catch (error) {
      console.error(error);
      alert("Gagal mengupload gambar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm text-left">
        <h3 className="text-lg font-bold text-emerald-900 flex items-center mb-2">
          <Settings className="w-5 h-5 mr-2" /> Profil & Tanda Tangan Lembaga
        </h3>
        <p className="text-sm text-gray-600 mb-6">Data ini akan otomatis ditempelkan pada bagian bawah cetakan Kisi-kisi dan RPP.</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nama Kepala Sekolah</label>
              <input 
                type="text" 
                required 
                className="w-full border border-gray-300 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900" 
                value={lembaga.kepsekName} 
                onChange={(e) => setLembaga({...lembaga, kepsekName: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">NIP Kepala Sekolah</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900" 
                value={lembaga.kepsekNip} 
                onChange={(e) => setLembaga({...lembaga, kepsekNip: e.target.value})} 
              />
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <label className="block text-xs font-bold text-blue-900 mb-1">Upload Tanda Tangan Kepsek (PNG Transparan)</label>
              <label className="w-full flex items-center justify-center border-2 border-dashed border-blue-300 px-3 py-4 rounded-lg bg-white cursor-pointer hover:bg-blue-50 transition-colors text-sm text-blue-700 font-medium">
                <UploadCloud className="w-5 h-5 mr-2" /> Pilih Gambar TTD
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg" 
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, 'kepsekTtd')} 
                />
              </label>
              {lembaga.kepsekTtd && (
                <img 
                  src={lembaga.kepsekTtd} 
                  alt="TTD Kepsek" 
                  className="h-16 mt-3 border border-dashed border-blue-300 bg-white p-1 object-contain" 
                />
              )}
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <label className="block text-xs font-bold text-blue-900 mb-1">Upload Stempel Sekolah (PNG Transparan)</label>
              <label className="w-full flex items-center justify-center border-2 border-dashed border-blue-300 px-3 py-4 rounded-lg bg-white cursor-pointer hover:bg-blue-50 transition-colors text-sm text-blue-700 font-medium">
                <UploadCloud className="w-5 h-5 mr-2" /> Pilih Gambar Stempel
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg" 
                  className="hidden" 
                  onChange={(e) => handleFileUpload(e, 'stempel')} 
                />
              </label>
              {lembaga.stempel && (
                <img 
                  src={lembaga.stempel} 
                  alt="Stempel" 
                  className="h-16 mt-3 border border-dashed border-blue-300 bg-white p-1 object-contain" 
                />
              )}
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isSaving} 
            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg transition-all shadow-md cursor-pointer disabled:bg-emerald-400 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </form>
      </div>
    </div>
  );
}
