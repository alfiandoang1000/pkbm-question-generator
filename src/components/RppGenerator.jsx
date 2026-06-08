import React, { useState, useEffect } from 'react';
import html2pdf from "html2pdf.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { collection, getDocs } from "firebase/firestore";
import {
  Download, AlertCircle, Pencil, FileText, ChevronRight, Sparkles
} from 'lucide-react';
import { db } from '../config/firebase';
import { GEMINI_MODELS, DPL_OPTIONS } from '../config/constants';
import { callGeminiAI } from '../services/api';

export default function RppGenerator({ lembaga }) {
  const [mapelDB, setMapelDB] = useState([]);
  const [tutorsList, setTutorsList] = useState([]);
  const [selectedTutorId, setSelectedTutorId] = useState('');
  const [selectedModel, setSelectedModel] = useState(GEMINI_MODELS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);

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
        console.error("Gagal memuat data awal RPP:", error);
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
    semesterType: 'Ganjil',
    topic: '',
    jumlahPertemuan: '8',
    jp: '20',
    waktu: '8 x pertemuan (20 JP)',
    dpl: []
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

    setIsGenerating(true);
    setResult(null);
    try {
      const mapelTerkait = mapelDB.find(m => m.paket === formData.paket && m.kelas === formData.kelas && m.subject === formData.subject);
      const contextText = formData.semesterType === 'Ganjil' ? mapelTerkait?.txtGanjil : mapelTerkait?.txtGenap;

      if (!contextText || contextText.trim() === '') {
        alert(`Teks materi kosong. Hubungi Super Admin.`);
        setIsGenerating(false);
        return;
      }

      const dplString = formData.dpl.join(", ");

      const prompt = `
Anda adalah ahli penyusun RPP/PPM PKBM profesional.

TUGAS:
Buat RPP lengkap berdasarkan data berikut.

DATA:
- Mata Pelajaran: ${formData.subject}
- Kelas: ${formData.kelas}
- Semester: ${formData.semesterType}
- Topik: ${formData.topic}
- Jumlah Pertemuan: ${formData.jumlahPertemuan}
- Total JP: ${formData.jp}
- DPL: ${dplString}

ATURAN WAJIB:
1. Fokus hanya pada topik "${formData.topic}"
2. WAJIB membuat tepat ${formData.jumlahPertemuan} pertemuan
3. Setiap pertemuan wajib memiliki:
   - kegiatan_awal
   - kegiatan_inti
   - kegiatan_penutup
   - refleksi
   - lkpd
   - rubrik_penilaian
4. Gunakan bahasa formal dan realistis
5. Output HARUS JSON VALID
6. Jangan gunakan markdown
7. Jangan gunakan penjelasan tambahan
8. Jangan menulis selain JSON
9. LKPD wajib dibuat lengkap pada setiap pertemuan
10. Rubrik penilaian wajib dibuat pada setiap pertemuan
11. Instrumen observasi wajib dibuat pada setiap pertemuan
12. Semua array wajib terisi
13. Jangan mengosongkan object
14. lintas_disiplin wajib diisi
15. media wajib minimal 3 item
16. lkpd harus rinci dan panjang
17. rubrik_penilaian harus lengkap
18. setiap pertemuan minimal 5 kegiatan inti

FORMAT JSON WAJIB:

{
  "identifikasi": {
    "murid": "",
    "materi": "",
    "dpl": ""
  },

  "desain": {
    "cp": "",
    "lintas_disiplin": "",
    "tp": "",
    "indikator": [],
    "model": "",
    "media": [],
    "kemitraan": "",
    "lingkungan": "",
    "digital": ""
  },

  "pertemuan": [
    {
      "ke": 1,
      "durasi": "",
      "kegiatan_awal": [],
      "kegiatan_inti": [],
      "kegiatan_penutup": [],
      "refleksi_guru": [],
      "lkpd": {
        "judul": "",
        "tujuan": "",
        "petunjuk": [],
        "langkah_kerja": [],
        "tugas": [],
        "pertanyaan_refleksi": []
      },
      "rubrik_penilaian": [
        {
          "aspek": "",
          "kriteria": "",
          "skor_1": "",
          "skor_2": "",
          "skor_3": "",
          "skor_4": ""
        }
      ],
      "observasi": {
        "sikap": [],
        "keterampilan": [],
        "catatan": []
      }
    }
  ],

  "asesmen": {
    "awal": "",
    "formatif": "",
    "sumatif": ""
  },

  "lampiran": {
    "bahan_bacaan": [],
    "media_pembelajaran": [],
    "glosarium": [],
    "daftar_pustaka": []
  }
}

REFERENSI:
${contextText.substring(0, 100000)}
`;

      let responseText = await callGeminiAI(prompt, selectedModel);
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      let generatedJSON;

      try {
        generatedJSON = JSON.parse(responseText);
      } catch (err) {
        console.error(responseText);
        alert("AI menghasilkan JSON tidak valid.\n\nCoba ulang generate.");
        return;
      }

      setResult({ config: formData, data: generatedJSON, tutor: selectedTutor });
    } catch (error) {
      alert("Proses Generate Gagal!\nPesan: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintPDF = async () => {
    const element = document.querySelector("#rpp-print-area");
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
      console.error("Error creating print PDF:", error);
      alert("Gagal mencetak PDF.");
    }
  };

  const handleExportPDF = () => {
    const element = document.getElementById("rpp-print-area");
    const opt = {
      margin: 0.5,
      filename: `RPP-${result.config.subject}.pdf`,
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/60 overflow-hidden no-print">
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-left bg-white">

          {/* KOLOM KIRI */}
          <div className="space-y-5">
            <h4 className="font-bold text-sm text-emerald-800 border-b border-gray-100 pb-2.5 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold">1</span>
              Pengaturan Dasar
            </h4>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Tutor Penyusun (TTD)</label>
              <select
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-gray-900 transition-all"
                value={selectedTutorId}
                onChange={(e) => setSelectedTutorId(e.target.value)}
              >
                <option value="" disabled>-- Pilih Tutor --</option>
                {tutorsList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Jenjang</label>
                <select
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-gray-50 focus:bg-white text-gray-900 font-medium transition-all"
                  value={formData.paket}
                  onChange={(e) => setFormData({ ...formData, paket: e.target.value, kelas: kelasOptionsDict[e.target.value][0] })}
                >
                  <option value="Paket A">Paket A (SD)</option>
                  <option value="Paket B">Paket B (SMP)</option>
                  <option value="Paket C">Paket C (SMA)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Kelas</label>
                <select
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-gray-50 focus:bg-white text-gray-900 font-medium transition-all"
                  value={formData.kelas}
                  onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                >
                  {kelasOptionsDict[formData.paket].map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Pilih Mapel (Terdaftar)</label>
              <select
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none bg-gray-50 focus:bg-white text-gray-900 font-medium transition-all"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              >
                <option value="">-- Pilih Mapel --</option>
                {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex space-x-4 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
              <label className="text-xs font-bold text-amber-900 flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={formData.semesterType === 'Ganjil'}
                  onChange={() => setFormData({ ...formData, semesterType: 'Ganjil' })}
                  className="mr-1.5 cursor-pointer accent-emerald-600"
                /> Semester Ganjil
              </label>
              <label className="text-xs font-bold text-amber-900 flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={formData.semesterType === 'Genap'}
                  onChange={() => setFormData({ ...formData, semesterType: 'Genap' })}
                  className="mr-1.5 cursor-pointer accent-emerald-600"
                /> Semester Genap
              </label>
            </div>
          </div>

          {/* KOLOM KANAN */}
          <div className="space-y-5">
            <h4 className="font-bold text-sm text-emerald-800 border-b border-gray-100 pb-2.5 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold">2</span>
              Fokus Bab & DPL Pembelajaran
            </h4>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Judul Bab / Topik Materi (Wajib Diisi)</label>
              <input
                type="text"
                required
                placeholder="Contoh: Bab 1: Sistem Organisasi Kehidupan"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white text-gray-900 font-medium transition-all"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              />
              <p className="text-[9px] text-gray-400 mt-1 leading-relaxed">AI hanya akan membaca dan merangkum RPP khusus untuk Judul Bab yang Anda ketik di atas.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Jumlah Pertemuan</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Contoh: 3"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white text-gray-900 transition-all"
                  value={formData.jumlahPertemuan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      jumlahPertemuan: e.target.value,
                      waktu: `${e.target.value} x pertemuan (${formData.jp} JP)`
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Total JP</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Contoh: 9"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white text-gray-900 transition-all"
                  value={formData.jp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      jp: e.target.value,
                      waktu: `${formData.jumlahPertemuan} x pertemuan (${e.target.value} JP)`
                    })
                  }
                />
              </div>
            </div>

            <div className="bg-gray-50/50 p-3.5 rounded-xl border border-gray-150">
              <label className="block text-xs font-bold text-gray-800 mb-2">Pilih Dimensi Profil Lulusan (DPL) Yang Ingin Dilatih</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-1 text-left">
                {DPL_OPTIONS.map(opt => {
                  const labelVal = `${opt.id} (${opt.label})`;
                  return (
                    <label key={opt.id} className="flex items-start space-x-2 text-[11px] text-gray-700 cursor-pointer hover:bg-emerald-50 p-1.5 rounded-lg border border-transparent hover:border-emerald-100 transition-all">
                      <input
                        type="checkbox"
                        className="mt-0.5 cursor-pointer accent-emerald-600"
                        checked={formData.dpl.includes(labelVal)}
                        onChange={() => handleDplToggle(labelVal)}
                      />
                      <span className="leading-tight break-words"><strong>{opt.id}</strong><br />{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className={`md:col-span-2 w-full font-bold py-3.5 rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 ${isGenerating
              ? 'bg-emerald-100 text-emerald-700 cursor-wait'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-700/10 active:scale-[0.99]'
              }`}
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" /> AI Sedang Membuat RPP Kurikulum PPM...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Mulai Generate RPP
              </>
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-white shadow-xl border border-gray-200 rounded-2xl overflow-hidden animate-in fade-in duration-500 relative">
          <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center no-print">
            <div className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Dokumen RPP Siap Cetak
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleExportPDF}
                className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center justify-center shadow-sm cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4 mr-1.5" /> Export PDF
              </button>
              <button
                onClick={handlePrintPDF}
                className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center justify-center shadow-sm cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4 mr-1.5" /> Cetak PDF
              </button>
            </div>
          </div>

          <div id="rpp-print-area" className="printable-area p-[15mm] font-sans text-[13px] leading-relaxed text-black bg-white text-left shadow-inner">
            {/* IDENTITAS */}
            <h2 className="text-center font-bold text-lg mb-6 underline">PERENCANAAN PEMBELAJARAN MENDALAM (PPM)</h2>
            <table className="w-full mb-6 font-medium">
              <tbody>
                <tr><td className="w-40 py-1">Nama Lembaga</td><td>: PKBM Al Barakah</td></tr>
                <tr><td className="py-1">Nama Tutor</td><td>: {result.tutor.name}</td></tr>
                <tr><td className="py-1">Mata Pelajaran</td><td>: {result.config.subject}</td></tr>
                <tr><td className="py-1">Fase/Kelas/Smt</td><td>: {result.config.kelas} / {result.config.semesterType}</td></tr>
                <tr><td className="py-1">Alokasi Waktu</td><td>: <span>{result.config.waktu}</span></td></tr>
                <tr><td className="py-1">Judul Bab / Topik</td><td>: <span className="font-bold uppercase">{result.config.topic}</span></td></tr>
              </tbody>
            </table>

            {/* I. IDENTIFIKASI */}
            <h3 className="font-bold text-[14px] mt-6 mb-2">I. IDENTIFIKASI</h3>
            <div className="pl-4 space-y-3">
              <div>
                <strong>1. Murid:</strong><br />
                <div>{result.data.identifikasi?.murid}</div>
              </div>
              <div>
                <strong>2. Materi Pembelajaran:</strong><br />
                <div>{result.data.identifikasi?.materi}</div>
              </div>
              <div>
                <strong>3. Dimensi Profil Lulusan (DPL):</strong><br />
                <div className="font-bold">{result.data.identifikasi?.dpl}</div>
              </div>
            </div>

            {/* II. DESAIN PEMBELAJARAN */}
            <h3 className="font-bold text-[14px] mt-8 mb-2">II. DESAIN PEMBELAJARAN</h3>
            <div className="pl-4 space-y-3">
              <div><strong>1. Capaian Pembelajaran:</strong><div>{result.data.desain?.cp}</div></div>
              <div><strong>2. Lintas Disiplin Ilmu:</strong><div>{result.data.desain?.lintas_disiplin}</div></div>
              <div><strong>3. Tujuan Pembelajaran:</strong><div>{result.data.desain?.tp}</div>
                <div className="mt-1"><strong>Indikator:</strong>
                  <ul className="list-disc pl-5 mt-1">
                    {result.data.desain?.indikator?.map((ind, i) => <li key={i}>{ind}</li>)}
                  </ul>
                </div>
              </div>
              <div><strong>4. Praktek Pedagogis:</strong><div>{result.data.desain?.model}</div></div>
              <div><strong>5. Kemitraan Pembelajaran:</strong><div>{result.data.desain?.kemitraan}</div></div>
              <div><strong>6. Lingkungan Pembelajaran:</strong><div>{result.data.desain?.lingkungan}</div></div>
              <div><strong>7. Media Pembelajaran:</strong><div>{result.data.desain?.media?.join(", ")}</div></div>
              <div><strong>8. Pemanfaatan Digital:</strong><div>{result.data.desain?.digital}</div></div>
            </div>

            {/* III. PENGALAMAN BELAJAR */}
            <h3 className="font-bold text-[14px] mt-8 mb-4">III. PENGALAMAN BELAJAR</h3>
            <div className="pl-4 space-y-6">
              {result.data.pertemuan?.map((p, i) => (
                <div key={i} className="border border-gray-300 p-4 rounded-lg bg-gray-50/50">
                  <h4 className="font-bold border-b border-gray-300 pb-1 mb-2">Pertemuan {p.ke} ({p.durasi})</h4>
                  <div className="mb-2">
                    <strong>Kegiatan Awal:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      {p.kegiatan_awal?.map((x, j) => <li key={j}>{x}</li>)}
                    </ul>
                  </div>
                  <div className="mb-2">
                    <strong>Kegiatan Inti:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      {p.kegiatan_inti?.map((x, j) => <li key={j}>{x}</li>)}
                    </ul>
                  </div>
                  <div>
                    <strong>Kegiatan Penutup:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      {p.kegiatan_penutup?.map((x, j) => <li key={j}>{x}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* IV. ASESMEN */}
            <h3 className="font-bold text-[14px] mt-8 mb-2">IV. ASESMEN PEMBELAJARAN</h3>
            <div className="pl-4 space-y-2">
              <div><strong>1. Asesmen Awal:</strong> <span>{result.data.asesmen?.awal}</span></div>
              <div><strong>2. Asesmen Proses:</strong> <span>{result.data.asesmen?.formatif}</span></div>
              <div><strong>3. Asesmen Akhir:</strong> <span>{result.data.asesmen?.sumatif}</span></div>
            </div>

            {/* TANDA TANGAN */}
            <div className="mt-16 pt-8 border-t border-gray-400 flex justify-between text-center relative break-inside-avoid">
              {lembaga.stempel && <img src={lembaga.stempel} alt="Stempel" className="absolute left-[20%] top-4 h-32 opacity-80 mix-blend-multiply pointer-events-none object-contain" />}
              <div className="w-64 z-10 relative">
                <p className="mb-2">Mengetahui,</p>
                <p className="font-bold">Kepala PKBM Al Barakah</p>
                <div className="h-24 flex items-center justify-center relative">
                  {lembaga.kepsekTtd ? <img src={lembaga.kepsekTtd} alt="TTD Kepsek" className="max-h-full max-w-full mix-blend-multiply object-contain" /> : <div className="text-gray-300 italic text-xs">TTD Belum Diset</div>}
                </div>
                <p className="font-bold underline uppercase">{lembaga.kepsekName}</p>
                <p className="text-xs">NIP. {lembaga.kepsekNip}</p>
              </div>

              <div className="w-64 z-10 relative">
                <p className="mb-2">Madiun, {getTanggal()}</p>
                <p className="font-bold">Tutor Mata Pelajaran</p>
                <div className="h-24 flex items-center justify-center relative">
                  {result.tutor.ttdUrl ? <img src={result.tutor.ttdUrl} alt="TTD Tutor" className="max-h-full max-w-full mix-blend-multiply object-contain" /> : <div className="text-gray-300 italic text-xs">TTD Belum Diset</div>}
                </div>
                <p className="font-bold underline uppercase">{result.tutor.name}</p>
                <p className="text-xs">NIP. {result.tutor.nip}</p>
              </div>
            </div>

            {/* ======================= LKPD ======================= */}
            <div className="page-break"></div>
            <div className="mt-10">
              <h2 className="text-center text-2xl font-bold mb-10">LAMPIRAN LKPD</h2>
              {result.data.pertemuan?.map((item, idx) => (
                <div key={idx} className="mb-16 border border-gray-400 p-6 rounded-lg avoid-break">
                  <h3 className="text-xl font-bold mb-4 border-b pb-2">LKPD PERTEMUAN {item.ke}</h3>
                  <div className="space-y-4 text-[13px]">
                    <div>
                      <strong>Judul LKPD:</strong>
                      <div className="mt-1">{item.lkpd?.judul}</div>
                    </div>
                    <div>
                      <strong>Tujuan Pembelajaran:</strong>
                      <div className="mt-1">{item.lkpd?.tujuan}</div>
                    </div>
                    <div>
                      <strong>Petunjuk Pengerjaan:</strong>
                      <ul className="list-disc pl-6 mt-2 space-y-1">
                        {item.lkpd?.petunjuk?.map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    </div>
                    <div>
                      <strong>Langkah Kerja:</strong>
                      <ol className="list-decimal pl-6 mt-2 space-y-1">
                        {item.lkpd?.langkah_kerja?.map((x, i) => <li key={i}>{x}</li>)}
                      </ol>
                    </div>
                    <div>
                      <strong>Tugas Peserta Didik:</strong>
                      <ul className="list-disc pl-6 mt-2 space-y-1">
                        {item.lkpd?.tugas?.map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    </div>
                    <div>
                      <strong>Jawaban Peserta Didik:</strong>
                      <div className="border border-gray-400 mt-3 h-40 rounded"></div>
                    </div>
                    <div>
                      <strong>Pertanyaan Refleksi:</strong>
                      <ul className="list-disc pl-6 mt-2 space-y-1">
                        {item.lkpd?.pertanyaan_refleksi?.map((x, i) => <li key={i}>{x}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ======================= RUBRIK ======================= */}
            <div className="page-break"></div>
            <div className="mt-10">
              <h2 className="text-center text-2xl font-bold mb-10">RUBRIK PENILAIAN</h2>
              {result.data.pertemuan?.map((item, idx) => (
                <div key={idx} className="mb-16 avoid-break">
                  <h3 className="text-xl font-bold mb-4">RUBRIK PERTEMUAN {item.ke}</h3>
                  <table className="w-full border-collapse border border-black text-[12px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black p-2">Aspek</th>
                        <th className="border border-black p-2">Kriteria</th>
                        <th className="border border-black p-2">Skor 1</th>
                        <th className="border border-black p-2">Skor 2</th>
                        <th className="border border-black p-2">Skor 3</th>
                        <th className="border border-black p-2">Skor 4</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.rubrik_penilaian?.map((r, i) => (
                        <tr key={i}>
                          <td className="border border-black p-2 align-top">{r.aspek}</td>
                          <td className="border border-black p-2 align-top">{r.kriteria}</td>
                          <td className="border border-black p-2 align-top">{r.skor_1}</td>
                          <td className="border border-black p-2 align-top">{r.skor_2}</td>
                          <td className="border border-black p-2 align-top">{r.skor_3}</td>
                          <td className="border border-black p-2 align-top">{r.skor_4}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
