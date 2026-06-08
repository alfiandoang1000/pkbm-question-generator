import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { BookOpen, Shield, Lock, Mail } from 'lucide-react';
import { auth } from '../config/firebase';
import { LOGO_URL } from '../config/constants';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [imageError, setImageError] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setErrorMsg("Gagal masuk. Periksa email dan password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-tr from-emerald-950 via-emerald-900 to-teal-950 flex items-center justify-center p-4 font-sans text-gray-900 relative overflow-hidden">
      {/* Background decorations for a premium look */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(4,47,31,0.3)] p-8 border border-white/20 relative z-10">
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            {!imageError ? (
              <img 
                src={LOGO_URL} 
                alt="Logo PKBM Al Barakah" 
                className="h-24 w-auto mx-auto object-contain bg-emerald-50/50 p-2 rounded-2xl border border-emerald-100/50" 
                onError={() => setImageError(true)} 
              />
            ) : (
              <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
                <BookOpen className="text-emerald-700 w-8 h-8" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-sm">
                v1.0.0
              </span>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">RPP & Soal Generator</h1>
          <p className="text-emerald-600 font-bold text-sm tracking-wide mt-0.5 uppercase">PKBM Al Barakah</p>
          
          <p className="text-gray-500 text-xs mt-3 leading-relaxed max-w-xs mx-auto border-t border-gray-100 pt-3">
            Sistem RPP & Soal Generator berbasis AI untuk membantu tutor mengintegrasikan kurikulum PKBM secara terstruktur, cepat, dan adaptif.
          </p>
        </div>
        
        {errorMsg && (
          <div className="mb-5 bg-red-50 text-red-600 p-3 rounded-xl text-xs border border-red-100 text-center font-bold animate-in fade-in duration-200">
            {errorMsg}
          </div>
        )}
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 text-left uppercase tracking-wider">Email Terdaftar</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input 
                type="email" 
                required 
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50 text-gray-900 font-medium text-sm transition-all focus:bg-white" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 text-left uppercase tracking-wider">Kata Sandi</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50 text-gray-900 font-medium text-sm transition-all focus:bg-white" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-emerald-950/10 cursor-pointer disabled:from-emerald-400 disabled:to-teal-400 disabled:cursor-not-allowed mt-2 active:scale-[0.99]" 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-1.5">
                <Shield className="w-4 h-4 animate-pulse" /> Memverifikasi...
              </span>
            ) : (
              'Masuk ke Sistem'
            )}
          </button>
        </form>
      </div>
      
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-[10px] font-medium z-10">
        PKBM Al Barakah RPP & Soal Generator v1.0.0 © 2026
      </div>
    </div>
  );
}
