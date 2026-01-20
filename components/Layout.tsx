import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  History, 
  Database,
  LogOut,
  Map as MapIcon,
  ShieldCheck as ShieldCheckIcon,
  Bell,
  Menu as MenuIcon,
  X as XIcon,
  Users2 as MemberIcon
} from 'lucide-react';
import { auth } from '../services/firebase';
import { signOut } from "firebase/auth";

// Özel Tasarlanmış ReData Logosu
export const ReDataLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <div className={`${className} relative`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
      <path 
        d="M20 45 L50 20 L80 45 L80 85 C80 88 78 90 75 90 L25 90 C22 90 20 88 20 85 Z" 
        fill="#0054A6" 
      />
      <path 
        d="M35 75 L50 55 L65 75" 
        stroke="white" 
        strokeWidth="4" 
        fill="none" 
        strokeLinecap="round" 
      />
      <circle cx="50" cy="55" r="8" fill="#E11B22" />
      <circle cx="35" cy="75" r="5" fill="white" />
      <circle cx="65" cy="75" r="5" fill="white" />
    </svg>
  </div>
);

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: any;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, userProfile }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Panel', icon: <LayoutDashboard size={20} /> },
    { id: 'portfolio', label: 'Portföy Bankası', icon: <Home size={20} /> },
    { id: 'demand', label: 'Talep Havuzu', icon: <Users size={20} /> },
    { id: 'valuation', label: 'Emsal/Değerleme', icon: <History size={20} /> },
    { id: 'tapu-analysis', label: 'Tapu Analizi', icon: <MapIcon size={20} /> },
  ];

  const canManageMembers = userProfile?.isAdmin || userProfile?.role === 'Broker';
  if (canManageMembers) {
    menuItems.push({ id: 'member-management', label: 'Üye Yönetimi', icon: <MemberIcon size={20} /> });
  }

  const getHeaderTitle = (tab: string) => {
    switch(tab) {
      case 'dashboard': return 'Genel Bakış';
      case 'portfolio': return 'Portföy Bankası';
      case 'demand': return 'Talep Havuzu';
      case 'valuation': return 'Emsal/Değerleme';
      case 'tapu-analysis': return 'Tapu Analizi';
      case 'member-management': return 'Üye Yönetimi';
      default: return 'ReData';
    }
  };

  const getInitial = (name: string) => name ? name[0].toUpperCase() : 'RE';

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-4/5 h-full bg-white shadow-2xl p-6 animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <ReDataLogo className="w-10 h-10" />
                <span className="font-black text-xl tracking-tighter text-remax-blue">ReData</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><XIcon size={24} /></button>
            </div>
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${
                    activeTab === item.id 
                    ? 'bg-remax-blue text-white font-bold shadow-lg shadow-blue-100' 
                    : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="absolute bottom-8 left-6 right-6 pt-6 border-t border-slate-100">
               <button 
                  onClick={() => signOut(auth)}
                  className="w-full flex items-center justify-center gap-3 py-4 text-remax-red font-black uppercase text-xs tracking-widest bg-red-50 rounded-2xl"
                >
                  <LogOut size={18} /> Çıkış Yap
                </button>
            </div>
          </div>
        </div>
      )}

      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <ReDataLogo className="w-12 h-12" />
          <div>
            <span className="font-black text-2xl tracking-tighter text-[#0054A6]">Re<span className="text-[#E11B22]">Data</span></span>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] -mt-1">Corporate Memory</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-[#0054A6] text-white font-semibold shadow-md' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-[#0054A6]'
              }`}
            >
              <span className={activeTab === item.id ? 'text-white' : 'text-slate-400'}>
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className={`p-4 rounded-2xl flex items-center gap-3 group relative overflow-hidden transition-all ${userProfile?.isAdmin ? 'bg-slate-900 text-white' : 'bg-[#0054A6] text-white'}`}>
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -mr-8 -mt-8 opacity-20 ${userProfile?.isAdmin ? 'bg-emerald-50' : 'bg-[#E11B22]'}`}></div>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0054A6] text-sm font-bold shrink-0 shadow-inner">
              {getInitial(userProfile?.fullName)}
            </div>
            <div className="overflow-hidden z-10 flex-1">
              <p className="text-xs font-bold truncate">{userProfile?.fullName || 'Danışman'}</p>
              <p className="text-[9px] text-blue-100 font-medium uppercase tracking-tighter truncate">{userProfile?.officeName || 'ReData Office'}</p>
            </div>
            <button onClick={() => signOut(auth)} className="z-10 text-white/50 hover:text-white transition-colors"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-500 hover:text-remax-blue"><MenuIcon size={24} /></button>
            <h1 className="text-sm md:text-lg font-bold text-slate-800 flex items-center gap-2">
              <div className={`w-1 h-6 rounded-full hidden md:block ${userProfile?.isAdmin ? 'bg-emerald-500' : 'bg-[#E11B22]'}`}></div>
              {getHeaderTitle(activeTab)}
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 max-w-[150px] md:max-w-none">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0"></span>
                <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase truncate">{userProfile?.officeName}</span>
             </div>
          </div>
        </header>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;