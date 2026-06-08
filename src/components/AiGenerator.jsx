import React, { useState, useEffect } from 'react';
import html2pdf from "html2pdf.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { collection, getDocs } from "firebase/firestore";
import { 
  Download, FileSpreadsheet, AlertCircle, Sparkles, Pencil 
} from 'lucide-react';
import { db } from '../config/firebase';
import { GEMINI_MODELS } from '../config/constants';
import { callGeminiAI } from '../services/api';

export default function AiGenerator({ lembaga }) {
  const [mapelDB, setMapelDB] = useState([]);
  const [tutorsList, setTutorsList] = useState([]);
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [selectedModel, setSelectedModel] = useState(GEMINI_MODELS[0].id); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('soal'); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "materi_pelajaran"));
        setMapelDB(querySnapshot.docs.map(doc => doc.data()));
        const tutorSnap = await getDocs(collection(db, "tutors"));
        const tutors = tutorSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTutorsList(tutors);
        if (tutors.length > 0) setSelectedTutorId(tutors[0].id);
      } catch (error) {
        console.error("Gagal memuat data awal generator soal:", error);
      }
    }; 
    fetchData();
  }, []);

  const kelasOptionsDict = { 
    'Paket A': ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'], 
    'Paket B': ['Kelas 7', 'Kelas 8', 'Kelas 9'], 
    'Paket C': ['Kelas 10', 'Kelas 11', 'Kelas 12'] 
  };
  
  const [formData, setFormData] = useState({ 
    paket: 'Paket B', 
    kelas: 'Kelas 8', 
    subject: '', 
    examType: 'SAS (Sumatif Akhir Semester)', 
    semesterType: 'Ganjil', 
    topic: '', 
    count: '5' 
  });
  
  const availableSubjects = [...new Set(mapelDB.filter(m => m.paket === formData.paket && m.kelas === formData.kelas).map(m => m.subject))];
  const selectedTutor = tutorsList.find(t => t.id === selectedTutorId) || { name: 'Pilih Tutor', nip: '-', ttdUrl: '' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject) { alert("Pilih Mata Pelajaran!"); return; }
    if (!selectedTutorId) { alert("Pilih Tutor Penyusun terlebih dahulu!"); return; }
    
    setIsGenerating(true); 
    setResult(null);
    const numOptions = formData.paket === 'Paket C' ? 5 : 4;

    try {
      const mapelTerkait = mapelDB.find(m => m.paket === formData.paket && m.kelas === formData.kelas && m.subject === formData.subject);
      let contextText = ""; 
      let cakupanMateri = "";

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

      if (!contextText || contextText.trim() === '') { 
        alert(`Teks materi kosong.`); 
        setIsGenerating(false); 
        return; 
      }

      const prompt = `Buatlah ${formData.count} butir soal pilihan ganda murni berdasarkan teks materi di bawah ini.
Jenjang: ${formData.paket} (${formData.kelas}), Mapel: ${formData.subject}. Tingkat kesulitan: SEDANG (relatif MUDAH).
PENTING: OUTPUT WAJIB FORMAT JSON ARRAY MURNI SEPERTI STRUKTUR DIBAWAH INI. Jangan sertakan format \`\`\`json.
Format JSON: [{"no":1,"soal":"...","jawaban_benar":"Opsi A","pengecoh_1":"Opsi B","pengecoh_2":"Opsi C","pengecoh_3":"Opsi D",${numOptions===5?'"pengecoh_4":"Opsi E",':''}"bab":"Nama Bab","indikator":"Siswa mampu..."}]
TEKS: ${contextText.substring(0, 100000)}`;

      let responseText = await callGeminiAI(prompt, selectedModel);
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      setResult({ 
        title: `${formData.examType} - ${formData.subject}`, 
        cakupan: cakupanMateri, 
        numOptions, 
        tutor: selectedTutor, 
        data: JSON.parse(responseText) 
      });
    } catch (error) { 
      alert("Generate Gagal!\n" + error.message); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handlePrintPDF = async () => {
    const element = document.querySelector("#printable-kisi");
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = 210;
      const pageHeight = 297;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const blobUrl = pdf.output("bloburl");
      window.open(blobUrl, "_blank");
    } catch (error) {
      console.error("Error printing PDF:", error);
      alert("Gagal mencetak PDF.");
    }
  };

  const handleExportPDF = () => {
    const element = document.getElementById("printable-kisi");
    const opt = {
      margin: 0.5,
      filename: `Kisi-Kisi.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        ignoreElements: (el) => {
          return el.classList?.contains("no-print");
        }
      },
      jsPDF: {
        unit: 'in',
        format: 'a4',
        orientation: 'portrait'
      }
    };

    html2pdf().set(opt).from(element).save();
  };

  const getTanggal = () => {
    const tgl = new Date(); 
    const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${tgl.getDate()} ${bulan[tgl.getMonth()]} ${tgl.getFullYear()}`;
  };

  const exportExcelColumn = () => {
    let tableHTML = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><thead><tr><th style="background-color: #d1fae5;">No</th><th style="background-color: #d1fae5;">Butir Soal</th><th style="background-color: #a7f3d0; font-weight: bold;">A : Jawaban Benar</th><th style="background-color: #f3f4f6;">B</th><th style="background-color: #f3f4f6;">C</th><th style="background-color: #f3f4f6;">D</th>${result.numOptions === 5 ? '<th style="background-color: #f3f4f6;">E</th>' : ''}</tr></thead><tbody>`;
    result.data.forEach(row => { 
      tableHTML += `<tr><td>${row.no}</td><td>${row.soal}</td><td>${row.jawaban_benar}</td><td>${row.pengecoh_1}</td><td>${row.pengecoh_2}</td><td>${row.pengecoh_3}</td>${result.numOptions === 5 ? `<td>${row.pengecoh_4}</td>` : ''}</tr>`; 
    });
    tableHTML += `</tbody></table></body></html>`;
    const blob = new Blob([tableHTML], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a'); 
    link.href = URL.createObjectURL(blob); 
    link.download = `Soal_PKBM.xls`; 
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="bg-blue-50/70 border-l-4 border-blue-500 p-4 rounded-r-2xl shadow-sm mx-4 sm:mx-0 text-left flex items-start">
        <div className="flex-shrink-0"><AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" /></div>
        <div className="ml-3">
          <h3 className="text-sm font-bold text-blue-800">Peringatan Penting untuk Tutor</h3>
          <div className="mt-1 text-xs text-blue-700 leading-relaxed">
            <p>Aplikasi ini adalah alat bantu berbasis AI. Harap selalu lakukan <strong>cross-check ulang</strong> terhadap soal yang dihasilkan. Gunakan fitur <strong>Live Edit</strong> pada tabel di bawah untuk merevisi teks (klik langsung pada tabel) sebelum mendownload dokumen.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/60 overflow-hidden no-print">
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-left bg-white">
          <div className="space-y-5">
            <h4 className="font-bold text-sm text-emerald-800 border-b border-gray-100 pb-2.5 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold">1</span>
              Konfigurasi Evaluasi
            </h4>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Tutor Penyusun (TTD)</label>
              <select 
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-gray-900 transition-all animate-none" 
                value={selectedTutorId} 
                onChange={(e) => setSelectedTutorId(e.target.value)}
              >
                <option value="" disabled>-- Pilih Tutor --</option>
                {tutorsList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Jenjang Paket</label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-gray-50 focus:bg-white text-gray-900 font-medium transition-all" 
                  value={formData.paket} 
                  onChange={(e) => setFormData({...formData, paket: e.target.value, kelas: kelasOptionsDict[e.target.value][0]})}
                >
                  <option value="Paket A">Paket A (SD)</option>
                  <option value="Paket B">Paket B (SMP)</option>
                  <option value="Paket C">Paket C (SMA)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Kelas Spesifik</label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-gray-50 focus:bg-white text-gray-900 font-medium transition-all" 
                  value={formData.kelas} 
                  onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                >
                  {kelasOptionsDict[formData.paket].map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Jenis Evaluasi</label>
              <select 
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white text-gray-900 outline-none font-medium transition-all" 
                value={formData.examType} 
                onChange={(e) => setFormData({...formData, examType: e.target.value})}
              >
                <option>Ulangan Harian (Topik Spesifik)</option>
                <option>SAS (Sumatif Akhir Semester)</option>
                <option>UPK (Ujian Kelulusan Paket)</option>
              </select>
            </div>
            {formData.examType.includes('SAS') && (
              <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100">
                <div className="flex space-x-4">
                  <label className="text-xs font-bold text-amber-850 flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      checked={formData.semesterType === 'Ganjil'} 
                      onChange={() => setFormData({...formData, semesterType: 'Ganjil'})} 
                      className="mr-1.5 accent-emerald-600 cursor-pointer" 
                    /> Semester Ganjil
                  </label>
                  <label className="text-xs font-bold text-amber-850 flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      checked={formData.semesterType === 'Genap'} 
                      onChange={() => setFormData({...formData, semesterType: 'Genap'})} 
                      className="mr-1.5 accent-emerald-600 cursor-pointer" 
                    /> Semester Genap
                  </label>
                </div>
              </div>
            )}
            {formData.examType.includes('Ulangan Harian') && (
              <div>
                <input 
                  type="text" 
                  placeholder="Topik spesifik..." 
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white text-gray-900 outline-none transition-all" 
                  value={formData.topic} 
                  onChange={(e) => setFormData({...formData, topic: e.target.value})} 
                />
              </div>
            )}
          </div>
          
          <div className="space-y-5">
            <h4 className="font-bold text-sm text-emerald-800 border-b border-gray-100 pb-2.5 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold">2</span>
              Pengaturan Mata Pelajaran
            </h4>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Pilih Mapel (Terdaftar)</label>
              <select 
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white text-gray-900 outline-none font-medium transition-all" 
                value={formData.subject} 
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
              >
                <option value="" disabled>-- Pilih Mapel --</option>
                {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Jumlah Butir Soal</label>
              <input 
                type="number" 
                min="1" 
                max="40" 
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white text-gray-900 outline-none transition-all" 
                value={formData.count} 
                onChange={(e) => setFormData({...formData, count: e.target.value})} 
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isGenerating} 
            className={`md:col-span-2 w-full font-bold py-3.5 rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 ${
              isGenerating 
                ? 'bg-emerald-100 text-emerald-750 cursor-wait' 
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-700/10 active:scale-[0.99]'
            }`}
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" /> AI Sedang Membuat Soal & Kisi-kisi...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Generate Soal & Kisi-kisi
              </>
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in duration-500">
          <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center no-print">
            <div className="flex space-x-1 bg-gray-200/60 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('soal')} 
                className={`px-5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  activeTab === 'soal' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-650 hover:text-gray-900'
                }`}
              >
                1. Spreadsheet Soal
              </button>
              <button 
                onClick={() => setActiveTab('kisi')} 
                className={`px-5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  activeTab === 'kisi' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-650 hover:text-gray-900'
                }`}
              >
                2. Download Kisi-kisi PDF
              </button>
            </div>
            
            {activeTab === 'soal' ? (
              <button
                onClick={exportExcelColumn}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center shadow-sm cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Export Excel (.xls)
              </button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportPDF}
                  className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center shadow-sm cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4 mr-1.5" /> Export PDF
                </button>
                <button
                  onClick={handlePrintPDF}
                  className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center shadow-sm cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4 mr-1.5" /> Cetak PDF
                </button>
              </div>
            )}
          </div>

          {activeTab === 'soal' && (
            <div className="p-4 w-full overflow-x-auto no-print">
              <div className="text-left mb-2 text-xs text-gray-505 flex items-center gap-1">
                <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tips: Klik langsung pada teks soal atau opsi pilihan di bawah untuk mengedit secara langsung (Live Edit).</span>
              </div>
              <table className="w-full text-xs text-left border border-gray-200 min-w-[800px] text-gray-900 mt-1 rounded-lg overflow-hidden">
                <thead className="bg-gray-100/80 uppercase">
                  <tr>
                    <th className="p-3 border w-10 text-center">No</th>
                    <th className="p-3 border min-w-[200px]">Butir Soal</th>
                    <th className="p-3 border bg-green-50/50 min-w-[150px]">A (Kunci)</th>
                    <th className="p-3 border min-w-[150px]">B</th>
                    <th className="p-3 border min-w-[150px]">C</th>
                    <th className="p-3 border min-w-[150px]">D</th>
                    {result.numOptions === 5 && <th className="p-3 border min-w-[150px]">E</th>}
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((r, idx) => (
                    <tr key={r.no} className="border-b hover:bg-gray-50/35 transition-colors">
                      <td className="p-3 border font-bold align-top text-center">{r.no}</td>
                      <td className="border p-0 align-top text-left">
                        <div contentEditable suppressContentEditableWarning className="p-3 min-h-[50px] outline-none focus:bg-emerald-50/25 transition-all">{r.soal}</div>
                      </td>
                      <td className="border p-0 align-top bg-green-50/20 text-left">
                        <div contentEditable suppressContentEditableWarning className="p-3 min-h-[50px] outline-none font-medium text-green-800 focus:bg-green-50 transition-all">{r.jawaban_benar}</div>
                      </td>
                      <td className="border p-0 align-top text-left">
                        <div contentEditable suppressContentEditableWarning className="p-3 min-h-[50px] outline-none focus:bg-emerald-50/25 transition-all">{r.pengecoh_1}</div>
                      </td>
                      <td className="border p-0 align-top text-left">
                        <div contentEditable suppressContentEditableWarning className="p-3 min-h-[50px] outline-none focus:bg-emerald-50/25 transition-all">{r.pengecoh_2}</div>
                      </td>
                      <td className="border p-0 align-top text-left">
                        <div contentEditable suppressContentEditableWarning className="p-3 min-h-[50px] outline-none focus:bg-emerald-50/25 transition-all">{r.pengecoh_3}</div>
                      </td>
                      {result.numOptions === 5 && (
                        <td className="border p-0 align-top text-left">
                          <div contentEditable suppressContentEditableWarning className="p-3 min-h-[50px] outline-none focus:bg-emerald-50/25 transition-all">{r.pengecoh_4}</div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'kisi' && (
            <div id="printable-kisi" className="printable-area p-10 bg-white text-black font-serif w-full max-w-4xl mx-auto shadow-inner">
              <div className="text-center mb-6">
                <h3 className="text-base font-bold uppercase tracking-wide">KISI-KISI PENULISAN SOAL EVALUASI</h3>
                <h4 className="text-sm font-bold uppercase mt-1">PKBM AL BARAKAH</h4>
                <div className="text-xs text-left grid grid-cols-2 gap-2 max-w-xl mx-auto mt-5 font-sans border border-gray-800 p-3 bg-white">
                  <div>Mata Pelajaran: <strong>{formData.subject}</strong></div>
                  <div>Jenjang / Kelas: <strong>{formData.paket} - {formData.kelas}</strong></div>
                  <div>Jenis Evaluasi: <strong>{formData.examType}</strong></div>
                  <div>Bentuk Evaluasi: <strong>Pilihan Ganda</strong></div>
                </div>
              </div>
              <table className="w-full text-xs border-collapse border border-black text-left mb-10 bg-white">
                <thead>
                  <tr className="bg-gray-100 text-center uppercase">
                    <th className="p-2 border border-black font-bold w-12 text-center">No</th>
                    <th className="p-2 border border-black font-bold w-48">Materi Acuan / Bab</th>
                    <th className="p-2 border border-black font-bold">Indikator Pencapaian Kompetensi (IPK)</th>
                    <th className="p-2 border border-black font-bold w-20 text-center">Bentuk</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((r, idx) => (
                    <tr key={r.no}>
                      <td className="p-2 border border-black text-center font-bold align-top">{r.no}</td>
                      <td className="border border-black p-0 align-top text-left">
                        <div contentEditable suppressContentEditableWarning className="p-2 outline-none min-h-[40px] focus:bg-gray-50">{r.bab}</div>
                      </td>
                      <td className="border border-black p-0 align-top text-left">
                        <div contentEditable suppressContentEditableWarning className="p-2 outline-none min-h-[40px] focus:bg-gray-50">{r.indikator}</div>
                      </td>
                      <td className="p-2 border border-black text-center font-bold align-top">PG</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* TANDA TANGAN KISI-KISI */}
              <div className="flex justify-between text-center relative text-[13px] break-inside-avoid mt-8 border-t border-gray-400 pt-8 bg-white">
                {lembaga.stempel && <img src={lembaga.stempel} alt="Stempel" className="absolute left-[15%] top-4 h-28 opacity-80 mix-blend-multiply pointer-events-none object-contain" />}
                <div className="w-64 z-10 relative">
                  <p className="mb-1">Mengetahui,</p>
                  <p className="font-bold">Kepala PKBM Al Barakah</p>
                  <div className="h-20 flex items-center justify-center">
                    {lembaga.kepsekTtd ? <img src={lembaga.kepsekTtd} alt="TTD Kepsek" className="max-h-full max-w-full mix-blend-multiply object-contain" /> : <div className="text-gray-300 italic text-xs">TTD Belum Diset</div>}
                  </div>
                  <p className="font-bold underline uppercase">{lembaga.kepsekName}</p>
                  <p className="text-xs">NIP. {lembaga.kepsekNip}</p>
                </div>

                <div className="w-64 z-10 relative">
                  <p className="mb-1">Madiun, {getTanggal()}</p>
                  <p className="font-bold">Penyusun Soal</p>
                  <div className="h-20 flex items-center justify-center">
                    {result.tutor.ttdUrl ? <img src={result.tutor.ttdUrl} alt="TTD Tutor" className="max-h-full max-w-full mix-blend-multiply object-contain" /> : <div className="text-gray-300 italic text-xs">TTD Belum Diset</div>}
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
