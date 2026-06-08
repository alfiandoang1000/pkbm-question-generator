import React, { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { BookOpen, Library, CheckCircle, ExternalLink } from 'lucide-react';
import { db } from '../config/firebase';

export default function ReferensiPdfView() {
  const [mapelDB, setMapelDB] = useState([]); 
  const [isLoading, setIsLoading] = useState(true); 
  const [activeTab, setActiveTab] = useState('Paket A');

  useEffect(() => { 
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
    fetchMapel(); 
  }, []);

  const filteredMapel = mapelDB.filter(m => m.paket === activeTab && m.linkPdf && m.linkPdf.trim() !== '');

  if (isLoading) return <div className="p-10 text-center font-bold text-gray-500">Memuat Koleksi Buku PDF...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-emerald-200 flex justify-between items-center shadow-sm">
        <div className="text-left">
          <h3 className="text-lg font-bold text-emerald-900 flex items-center">
            <Library className="w-5 h-5 mr-2 text-emerald-700" /> E-Library Buku PDF Asli
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            Fasilitas khusus Tutor untuk melihat dan mempelajari buku asli tanpa perlu mencari di internet.
          </p>
        </div>
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
      
      {filteredMapel.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Belum ada link Buku PDF yang ditambahkan Super Admin untuk {activeTab}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMapel.map((m) => (
            <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between">
              <div className="bg-emerald-50 p-4 border-b border-emerald-100 text-left">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-md">{m.kelas}</span>
                </div>
                <h4 className="font-bold text-gray-900 mt-3 text-lg leading-tight">{m.subject}</h4>
              </div>
              <div className="p-4 bg-white flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-500" /> PDF Tersedia
                </span>
                <a 
                  href={m.linkPdf} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors cursor-pointer"
                >
                  Buka / Download <ExternalLink className="w-4 h-4 ml-1.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
