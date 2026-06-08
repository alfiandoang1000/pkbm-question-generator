import React, { useState, useEffect } from 'react';
import { Download, X, AppWindow } from 'lucide-react';
import { LOGO_URL } from '../config/constants';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Show the prompt for the user to see the UI locally
    const timer = setTimeout(() => {
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowPrompt(true);
      }
    }, 1500);

    const handleBeforeInstallPrompt = (e) => {
      // Prevent default browser install prompt
      e.preventDefault();
      // Store the event for triggering later
      setDeferredPrompt(e);
      // Show the custom banner
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Browser Anda belum siap untuk instalasi langsung, silakan gunakan menu 'Add to Home Screen' di browser.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Installation Outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 max-w-sm w-[calc(100vw-32px)] bg-white/95 backdrop-blur-md border border-emerald-100 shadow-2xl rounded-2xl flex items-start gap-3.5 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex-shrink-0">
        {!imageError ? (
          <img 
            src={LOGO_URL} 
            alt="PKBM Logo" 
            className="w-12 h-12 object-contain bg-emerald-50 rounded-xl p-1 border border-emerald-100"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center border border-emerald-200">
            <AppWindow className="w-6 h-6" />
          </div>
        )}
      </div>
      <div className="flex-1 text-left">
        <h4 className="font-bold text-gray-900 text-sm">Instal Aplikasi PKBM</h4>
        <p className="text-gray-600 text-xs mt-1 leading-relaxed">
          Instal RPP & Soal Generator di layar utama untuk akses instan dan performa lebih cepat.
        </p>
        <div className="flex gap-2 mt-3.5">
          <button 
            onClick={handleInstallClick} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Instal
          </button>
          <button 
            onClick={handleDismiss} 
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            Nanti Saja
          </button>
        </div>
      </div>
      <button 
        onClick={handleDismiss} 
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-0.5 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
        title="Tutup"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
