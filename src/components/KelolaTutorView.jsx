import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Users, Plus, Edit, Trash2, X, UploadCloud } from 'lucide-react';
import { db, storage } from '../config/firebase';

export default function KelolaTutorView() {
  const [tutorsList, setTutorsList] = useState([]); 
  const [isLoading, setIsLoading] = useState(true); 
  const [isUpdating, setIsUpdating] = useState(false); 
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [formData, setFormData] = useState({ id: '', name: '', nip: '', ttdUrl: '' });

  const fetchTutors = async () => { 
    try { 
      const querySnapshot = await getDocs(collection(db, "tutors")); 
      setTutorsList(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); 
    } catch (error) { 
      alert("Gagal memuat daftar tutor."); 
    } finally { 
      setIsLoading(false); 
    } 
  };
  
  useEffect(() => { 
    fetchTutors(); 
  }, []);

  const handleSave = async (e) => {
    e.preventDefault(); 
    setIsUpdating(true);
    try { 
      if (formData.id) {
        await updateDoc(doc(db, "tutors", formData.id), { 
          name: formData.name, 
          nip: formData.nip, 
          ttdUrl: formData.ttdUrl 
        }); 
      } else {
        await addDoc(collection(db, "tutors"), { 
          name: formData.name, 
          nip: formData.nip, 
          ttdUrl: formData.ttdUrl, 
          createdAt: new Date().toISOString() 
        }); 
      }
      setIsModalOpen(false); 
      setFormData({ id: '', name: '', nip: '', ttdUrl: '' }); 
      fetchTutors(); 
    } catch (error) { 
      alert("Gagal menyimpan data."); 
    } finally { 
      setIsUpdating(false); 
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 2MB!");
      return;
    }

    setIsUpdating(true);
    try {
      const fileRef = ref(storage, `tutors/ttd_${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setFormData(prev => ({ ...prev, ttdUrl: url }));
    } catch (error) {
      console.error(error);
      alert("Gagal mengupload gambar.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Yakin ingin menghapus profil tutor ini?')) {
      try { 
        await deleteDoc(doc(db, "tutors", id)); 
        fetchTutors(); 
      } catch(e) { 
        alert("Gagal menghapus."); 
      }
    }
  };

  if (isLoading) return <div className="text-center p-10 font-bold text-gray-500">Memuat Daftar Tutor...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-emerald-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div className="text-left">
          <h3 className="text-lg font-bold text-emerald-900 flex items-center">
            <Users className="w-5 h-5 mr-2 text-emerald-700" /> Kelola Data & TTD Tutor
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            Daftar nama tutor di sini akan muncul pada opsi Dropdown saat mencetak RPP dan Kisi-kisi.
          </p>
        </div>
        <button 
          onClick={() => { setFormData({ id: '', name: '', nip: '', ttdUrl: '' }); setIsModalOpen(true); }} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg flex items-center shadow-sm whitespace-nowrap cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Tambah Tutor
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600 min-w-[700px]">
          <thead className="text-xs text-gray-500 uppercase border-b bg-gray-50">
            <tr>
              <th className="px-5 py-3">Nama Tutor</th>
              <th className="px-5 py-3">NIP / Identitas</th>
              <th className="px-5 py-3 text-center">Tanda Tangan (PNG)</th>
              <th className="px-5 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tutorsList.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-400">Belum ada data tutor terdaftar.</td>
              </tr>
            )}
            {tutorsList.map((tutor) => (
              <tr key={tutor.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-4 font-bold text-gray-800 text-left">{tutor.name}</td>
                <td className="px-5 py-4 text-gray-700 text-left">{tutor.nip || '-'}</td>
                <td className="px-5 py-4 text-center">
                  {tutor.ttdUrl ? (
                    <img 
                      src={tutor.ttdUrl} 
                      alt="TTD" 
                      className="h-8 mx-auto border border-dashed border-gray-300 p-0.5 bg-white object-contain" 
                    />
                  ) : (
                    <span className="text-[10px] text-red-500 italic bg-red-50 px-2 py-0.5 rounded border border-red-100 font-bold">Belum Ada TTD</span>
                  )}
                </td>
                <td className="px-5 py-4 text-center">
                  <div className="flex justify-center space-x-2">
                    <button 
                      onClick={() => { setFormData(tutor); setIsModalOpen(true); }} 
                      className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded cursor-pointer transition-colors" 
                      title="Edit Profil"
                    >
                      <Edit className="w-4 h-4"/>
                    </button>
                    <button 
                      onClick={() => handleDelete(tutor.id)} 
                      className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded cursor-pointer transition-colors" 
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden my-8">
            <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg">Profil TTD Tutor</h3>
              <button onClick={() => setIsModalOpen(false)} className="cursor-pointer hover:text-emerald-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 text-left">Nama Lengkap & Gelar</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900" 
                    placeholder="Ahmad Dahlan, S.Pd" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 text-left">NIP / NUPTK</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-900" 
                    placeholder="Opsional" 
                    value={formData.nip} 
                    onChange={(e) => setFormData({...formData, nip: e.target.value})} 
                  />
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <label className="block text-xs font-bold text-blue-900 mb-1 text-left">Upload Tanda Tangan (PNG Transparan)</label>
                <label className="w-full flex items-center justify-center border-2 border-dashed border-blue-300 px-3 py-4 rounded-lg bg-white cursor-pointer hover:bg-blue-50 transition-colors text-sm text-blue-700 font-medium mt-1">
                  <UploadCloud className="w-5 h-5 mr-2" /> Pilih Gambar TTD
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                  />
                </label>
                {formData.ttdUrl && (
                  <img 
                    src={formData.ttdUrl} 
                    alt="Preview TTD" 
                    className="h-16 mt-3 mx-auto border border-dashed border-blue-300 bg-white p-1 object-contain" 
                  />
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating} 
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 cursor-pointer transition-colors disabled:bg-emerald-400"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Profil Tutor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
