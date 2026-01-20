
import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    // Uygulama zaten "standalone" (yüklü) modda mı?
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // Platform tespiti
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    setPlatform(isIos ? 'ios' : 'android');

    // Android/Chrome için install prompt olayını dinle
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Bir kez reddettiyse bu oturumda tekrar hemen gösterme (isteğe bağlı)
      const dismissed = sessionStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS için otomatik gösterim (Safari'de prompt olayı yoktur)
    if (isIos) {
      const dismissed = sessionStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        // iOS'ta 3 saniye sonra göster ki sayfa yüklenmiş olsun
        const timer = setTimeout(() => setIsVisible(true), 3000);
        return () => clearTimeout(timer);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const dismissPrompt = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[999] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white rounded-[2rem] shadow-2xl border border-blue-100 p-6 relative overflow-hidden">
        {/* Dekoratif Arkaplan */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-remax-blue/5 rounded-full -mr-12 -mt-12"></div>
        
        <button 
          onClick={dismissPrompt}
          className="absolute top-4 right-4 p-1 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-remax-blue rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-100">
            <Smartphone size={28} />
          </div>
          
          <div className="flex-1 pr-6">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">ReData'yı Yükleyin</h4>
            <p className="text-[11px] font-bold text-slate-500 leading-relaxed mt-1 italic">
              {platform === 'ios' 
                ? "Daha hızlı erişim için ana ekrana ekleyin." 
                : "Hızlı kullanım ve çevrimdışı erişim için uygulamayı cihazınıza kurun."}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-50 pt-4">
          {platform === 'android' ? (
            <button 
              onClick={handleInstallClick}
              className="w-full bg-remax-blue text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Download size={16} /> Hemen Yükle
            </button>
          ) : (
            <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-4 border border-blue-100">
              <div className="flex flex-col items-center gap-1">
                <div className="p-1.5 bg-white rounded-lg shadow-sm text-remax-blue"><Share size={16} /></div>
                <span className="text-[8px] font-black uppercase text-slate-400">Paylaş</span>
              </div>
              <div className="h-8 w-[1px] bg-blue-200"></div>
              <div className="flex flex-col items-center gap-1">
                <div className="p-1.5 bg-white rounded-lg shadow-sm text-remax-blue"><PlusSquare size={16} /></div>
                <span className="text-[8px] font-black uppercase text-slate-400">Ekle</span>
              </div>
              <div className="flex-1 text-[9px] font-black text-remax-blue uppercase leading-tight pl-2">
                Safari'de alt menüden <span className="underline">Paylaş</span> ve ardından <span className="underline">Ana Ekrana Ekle</span>'ye dokunun.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
