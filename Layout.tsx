
import React from 'react';
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  History, 
  Bell,
  Database,
  LogOut,
  Map as MapIcon
} from 'lucide-react';
import { auth } from '../services/firebase';
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, currentUser }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Panel', icon: <LayoutDashboard size={20} /> },
    { id: 'portfolio', label: 'Portföy Bankası', icon: <Home size={20} /> },
    { id: 'demand', label: 'Talep Havuzu', icon: <Users size={20} /> },
    { id: 'valuation', label: 'Emsal/Değerleme', icon: <History size={20} /> },
    { id: 'tapu-analysis', label: 'Tapu Analizi', icon: <MapIcon size={20} /> },
  ];

  const getHeaderTitle = (tab: string) => {
    switch(tab) {
      case 'dashboard': return 'Panel';
      case 'portfolio': return 'Portföy Bankası';
      case 'demand': return 'Talep Havuzu';
      case 'valuation': return 'Emsal/Değerleme';
      case 'tapu-analysis': return 'Tapu Analizi';
      default: return 'Sistem';
    }
  };

  const getInitial = (name: string) => name ? name[0].toUpperCase() : 'RE';

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0054A6] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Database size={24} />
          </div>
          <div>
            <span className="font-black text-2xl tracking-tighter text-[#0054A6]">ReData</span>
            <p className="text-[8px] font-bold text-[#E11B22] uppercase tracking-[0.2em] -mt-1">Real Estate Data</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
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
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-[#0054A6] text-white p-4 rounded-2xl flex items-center gap-3 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#E11B22] rounded-full -mr-8 -mt-8 opacity-20"></div>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0054A6] text-sm font-bold shrink-0 shadow-inner">
              {getInitial(currentUser)}
            </div>
            <div className="overflow-hidden z-10 flex-1">
              <p className="text-xs font-bold truncate">{currentUser.split('@')[0]}</p>
              <p className="text-[9px] text-blue-100 font-medium uppercase">Danışman</p>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="z-10 text-white/50 hover:text-white transition-colors"
              title="Çıkış"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <div className="w-1 h-6 bg-[#E11B22] rounded-full"></div>
            {getHeaderTitle(activeTab)}
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-[#E11B22] relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E11B22] rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
            <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               Sistem: <span className="text-[#0054A6] font-black">BULUT (SYNC)</span>
            </span>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
