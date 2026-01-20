// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import Layout, { ReDataLogo } from './components/Layout';
import TapuAnalysisView from './components/TapuAnalysisView';
import ReportView from './components/ReportView';
import MarketTrendChart from './components/MarketTrendChart';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { RealEstateRecord, RecordType, CATEGORY_TREE, PropertyCategory, RoomCount } from './types';
import { LocationService } from './services/locationService';
import { 
  Plus as PlusIcon, 
  Target as TargetIcon, 
  History as HistoryIconLucide, 
  Home as HomeIcon, 
  Loader2 as Loader2Icon, 
  Sparkles as SparklesIcon, 
  X as XIcon, 
  CheckCircle as CheckCircleIcon, 
  Check,
  Trash2 as Trash2Icon, 
  Edit3 as Edit3Icon,
  Eye as EyeIcon,
  AlertCircle as AlertCircleIcon, 
  Building as BuildingIcon,
  Phone as PhoneIcon,
  Clock as ClockIcon,
  ChevronRight as ChevronRightIcon,
  Layers as LayersIcon,
  ClipboardCheck as ClipboardCheckIcon,
  FileText as FileTextIcon,
  AlertTriangle as AlertTriangleIcon,
  Filter as FilterIcon,
  RotateCcw as RotateCcwIcon,
  MapPin as MapPinIcon,
  Zap as ZapIcon, 
  BarChart3 as BarChartIcon,
  Calendar as CalendarIcon,
  User as UserIcon,
  Map as MapIcon,
  FileBarChart as FileBarChartIcon,
  Mail,
  Archive as ArchiveIcon,
  Power as PowerIcon,
  Timer as TimerIcon,
  ShoppingBag as ShoppingBagIcon,
  Tag as TagIcon,
  Key as KeyIcon,
  Users2 as MemberIcon,
  Maximize2,
  Fence,
  ShieldCheck,
  BrainCircuit,
  DatabaseZap,
  LineChart,
  Globe,
  MessageCircle,
  FileCheck2,
  ShieldAlert,
  ShieldQuestion
} from 'lucide-react';
import { db, auth } from './services/firebase';
import { 
  collection, addDoc, onSnapshot, query, Timestamp, doc, deleteDoc, updateDoc, getDoc, where, setDoc 
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  User, 
  signOut,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { extractListingFromText } from './services/geminiService';

const AGE_OPTIONS = ['Sıfır', '1-5', '6-10', '11-20', '21-30', '30 üzeri'];

const cleanNumeric = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
  let s = String(val).trim().toLowerCase();
  let multiplier = 1;
  if (s.includes('milyon')) { multiplier = 1000000; s = s.replace('milyon', ''); }
  else if (s.includes('bin')) { multiplier = 1000; s = s.replace('bin', ''); }
  if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  const result = parseFloat(s.replace(/[^\d.]/g, ''));
  return isNaN(result) ? 0 : Math.round(result * multiplier);
};

const sanitizeForFirestore = (obj: any) => {
  const cleaned: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined && obj[key] !== null) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
};

// --- ÖZEL BİLEŞENLER ---

const CustomAlert = ({ message, type = 'error', onClose }: { message: string, type?: 'error' | 'success', onClose: () => void }) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    <div className="bg-white w-full max-sm:max-w-xs max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in duration-300">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${type === 'error' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
        {type === 'error' ? <AlertCircleIcon size={32} /> : <CheckCircleIcon size={32} />}
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-2">{type === 'error' ? 'İşlem Başarısız' : 'Başarılı!'}</h3>
      <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed whitespace-pre-wrap">{message}</p>
      <button onClick={onClose} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-colors uppercase text-xs tracking-widest">Tamam</button>
    </div>
  </div>
);

const CustomConfirmModal = ({ title, message, onConfirm, onCancel, confirmText = "Kalıcı Olarak Sil" }: { title: string, message: string, onConfirm: () => void, onCancel: () => void, confirmText?: string }) => (
  <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    <div className="bg-white w-full max-sm:max-w-xs max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center animate-in zoom-in duration-200">
      <div className="w-16 h-16 rounded-2xl bg-[#E11B22] flex items-center justify-center mx-auto mb-6">
        <AlertTriangleIcon size={32} className="text-white" />
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
      <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">{message}</p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onCancel} className="py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black rounded-2xl transition-colors uppercase text-[10px] tracking-widest">Vazgeç</button>
        <button onClick={onConfirm} className="py-4 bg-[#E11B22] hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-100 uppercase text-[10px] tracking-widest">{confirmText}</button>
      </div>
    </div>
  </div>
);

const WhatsAppFab = () => {
  const openWhatsApp = () => {
    const phoneNumber = '905497849576';
    const message = encodeURIComponent('Merhaba ReData Destek Ekibi, sistem hakkında bilgi almak istiyorum.');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };
  return (
    <button onClick={openWhatsApp} className="fixed bottom-8 right-8 z-[999] flex items-center gap-3 bg-[#25D366] text-white p-4 rounded-full shadow-2xl shadow-green-200 hover:scale-110 active:scale-90 transition-all group">
      <span className="max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-500 whitespace-nowrap text-xs font-black uppercase tracking-widest">Destek Hattı</span>
      <MessageCircle size={28} />
    </button>
  );
};

const RecordListRow = ({ record, userProfile, onDeleteRequest, onEdit, onView, onReportRequest, onStatusToggle }: any) => {
  const isOwner = record.consultant?.trim().toLowerCase() === userProfile?.email?.trim().toLowerCase();
  const isBrokerInOffice = userProfile?.role === 'Broker' && record.officeName === userProfile?.officeName;
  const canModify = isOwner || isBrokerInOffice || userProfile?.isAdmin;
  
  const isDemand = record.type === RecordType.DEMAND;
  const isPassive = record.status === 'PASSIVE';
  const unitPrice = record.pricePerSqm || (record.price && record.area ? Math.round(record.price / record.area) : 0);
  
  const formatDate = (ts: any) => {
    if (!ts) return '-';
    try { const date = ts.toDate ? ts.toDate() : new Date(ts); return date.toLocaleDateString('tr-TR'); } 
    catch (e) { return '-'; }
  };

  return (
    <div className={`group flex flex-col md:flex-row items-center gap-4 p-4 border-b border-slate-50 transition-all ${record.isSold ? 'bg-emerald-50/30' : isPassive ? 'bg-slate-50/50 grayscale-[0.5] opacity-80' : 'bg-white hover:bg-slate-50/50'}`}>
       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPassive ? 'bg-slate-100 text-slate-400' : isDemand ? 'bg-red-50 text-remax-red' : 'bg-blue-50 text-remax-blue'} shadow-sm relative`}>
         {isDemand ? <TargetIcon size={14} /> : <HomeIcon size={14} />}
         {record.isSold && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white"></div>}
       </div>
       <div className={`flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-3 ${isDemand ? 'md:grid-cols-8' : 'md:grid-cols-11'} gap-x-4 gap-y-3 items-center w-full`}>
         <div className="overflow-hidden">
           <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest mb-0.5">Alt Tip</span>
           <span className={`text-[11px] font-bold truncate block ${isPassive ? 'text-slate-400' : 'text-slate-700'}`}>{record.subCategory}</span>
           <div className="flex flex-wrap gap-1 mt-0.5">
             {record.isWithinSite && <span className="text-[8px] font-black bg-remax-blue text-white px-1.5 py-0.5 rounded-full uppercase">Site</span>}
             {record.age && <span className="text-[8px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded-full uppercase">Yaş: {record.age}</span>}
           </div>
         </div>
         <div className="overflow-hidden"><span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest mb-0.5">Konum</span><span className={`text-[11px] font-bold truncate block ${isPassive ? 'text-slate-400' : 'text-slate-700'}`}>{record.city} - {record.district}</span></div>
         <div className="overflow-hidden"><span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest mb-0.5">Danışman</span><span className={`text-[10px] font-bold truncate ${isPassive ? 'text-slate-400' : 'text-slate-500'}`}>{record.consultantName || record.consultant?.split('@')[0]}</span></div>
         <div className="overflow-hidden hidden sm:block md:col-span-1"><span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest mb-0.5">Tarih</span><span className={`text-[11px] font-bold ${isPassive ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(record.createdAt)}</span></div>
         {!isDemand && (<div className="overflow-hidden"><span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest mb-0.5">Alan</span><span className={`text-[11px] font-black ${isPassive ? 'text-slate-400' : 'text-slate-800'}`}>{record.area} m²</span></div>)}
         {!isDemand && (<div className="overflow-hidden"><span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest mb-0.5">m²/TL</span><span className={`text-[11px] font-black ${isPassive ? 'text-slate-400' : 'text-[#0054A6]'}`}>{unitPrice.toLocaleString('tr-TR')} TL</span></div>)}
         <div className="overflow-hidden"><span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest mb-0.5">Toplam Fiyat</span><span className={`text-[11px] font-black ${isDemand ? 'text-remax-red' : 'text-remax-blue'}`}>{Number(record.price).toLocaleString('tr-TR')} TL</span></div>
         <div className="col-span-full md:col-span-2 flex justify-end items-center gap-2">
           {isDemand && canModify && (<button onClick={() => onStatusToggle(record)} className={`p-1.5 rounded-lg transition-all flex items-center gap-1 font-black text-[9px] uppercase ${isPassive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{isPassive ? <PowerIcon size={12} /> : <ArchiveIcon size={12} />}</button>)}
           <button onClick={() => onView(record)} className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg"><EyeIcon size={16} /></button>
           {canModify && (
             <><button onClick={() => onEdit(record)} className="p-1.5 text-slate-400 hover:text-remax-blue rounded-lg"><Edit3Icon size={16} /></button>
               <button onClick={() => onDeleteRequest(record.id)} className="p-1.5 text-slate-400 hover:text-remax-red rounded-lg"><Trash2Icon size={16} /></button></>
           )}
         </div>
       </div>
    </div>
  );
};

const GenericModule = ({ title, type, records, onAdd, onUpdate, userProfile, onDeleteRequest, icon: Icon, themeColor, showSmartImport = false }: any) => {
  const [showModal, setShowModal] = useState(false);
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  
  const filtered = records.filter(r => r.type === type);

  const toggleStatus = async (record: any) => {
    const newStatus = record.status === 'PASSIVE' ? 'ACTIVE' : 'PASSIVE';
    try { await updateDoc(doc(db, "records", record.id), { status: newStatus, updatedAt: Timestamp.now() }); } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div><h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Icon style={{ color: themeColor }} size={32}/> {title}</h2><p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Ofis: {userProfile?.officeName || '-'} | {filtered.length} Kayıt</p></div>
        <div className="flex gap-3">
          {showSmartImport && <button onClick={() => setShowSmartModal(true)} className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all text-sm"><SparklesIcon size={18} /> Akıllı Aktarım</button>}
          <button onClick={() => setShowModal(true)} style={{ backgroundColor: themeColor }} className="text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all text-sm"><PlusIcon size={18} /> Yeni Kayıt</button>
        </div>
      </div>
      {showModal && <ManualRecordModal type={type} onClose={() => {setShowModal(false); setEditingRecord(null);}} onSave={editingRecord ? onUpdate : onAdd} initialData={editingRecord} />}
      {showSmartImport && showSmartModal && <SmartImportModal onClose={() => setShowSmartModal(false)} onImport={(data) => onAdd({...data, type})} />}
      {viewingRecord && <RecordDetailModal record={viewingRecord} onClose={() => setViewingRecord(null)} />}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[400px]">
        <div className="divide-y divide-slate-50">{filtered.map((r: any) => <RecordListRow key={r.id} record={r} userProfile={userProfile} onDeleteRequest={onDeleteRequest} onEdit={(rec) => {setEditingRecord(rec); setShowModal(true);}} onView={(rec) => setViewingRecord(rec)} onStatusToggle={toggleStatus} />)}</div>
        {filtered.length === 0 && (<div className="py-32 text-center text-slate-400 font-bold italic">Kayıt bulunamadı.</div>)}
      </div>
    </div>
  );
};

const Dashboard = ({ records, onQuickAction, userProfile }: any) => (
  <div className="space-y-10 animate-in fade-in duration-700">
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden">
      <h2 className="text-3xl font-black mb-2 text-slate-800 tracking-tight">Merhaba, {userProfile?.fullName?.split(' ')[0] || 'Kullanıcı'}</h2>
      <p className="text-slate-400 font-bold mb-8 uppercase text-[10px] tracking-[0.3em]">{userProfile?.officeName} Ofis Hafızası</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button onClick={() => onQuickAction('portfolio')} className="p-8 bg-blue-50/50 hover:bg-blue-100/50 border border-blue-100 rounded-[2rem] flex flex-col items-center text-center gap-4 transition-all group shadow-sm"><div className="p-5 bg-[#0054A6] text-white rounded-2xl shadow-lg group-hover:rotate-12 transition-transform"><HomeIcon size={28} /></div><div><span className="block font-black text-slate-800 text-lg">Portföy Ekle</span><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bankaya Ekle</span></div></button>
        <button onClick={() => onQuickAction('demand')} className="p-8 bg-red-50/50 hover:bg-red-100/50 border border-red-100 rounded-[2rem] flex flex-col items-center text-center gap-4 transition-all group shadow-sm"><div className="p-5 bg-[#E11B22] text-white rounded-2xl shadow-lg group-hover:rotate-12 transition-transform"><TargetIcon size={28} /></div><div><span className="block font-black text-slate-800 text-lg">Talep Girişi</span><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Müşteri Talebi</span></div></button>
        <button onClick={() => onQuickAction('valuation')} className="p-8 bg-emerald-50/50 hover:bg-emerald-100/50 border border-emerald-100 rounded-[2rem] flex flex-col items-center text-center gap-4 transition-all group shadow-sm"><div className="p-5 bg-emerald-600 text-white rounded-2xl shadow-lg group-hover:rotate-12 transition-transform"><ClipboardCheckIcon size={28} /></div><div><span className="block font-black text-slate-800 text-lg">Emsal Girişi</span><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Değerleme Verisi</span></div></button>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <StatCard label="Portföyler" value={records.filter(r => r.type === RecordType.PORTFOLIO).length} color="#0054A6" />
      <StatCard label="Talepler" value={records.filter(r => r.type === RecordType.DEMAND && r.status !== 'PASSIVE').length} color="#E11B22" subLabel="Aktif" />
      <StatCard label="Emsaller" value={records.filter(r => r.type === RecordType.VALUATION).length} color="#10b981" />
      <StatCard label="Sistem Modu" value={userProfile?.isAdmin ? 'Yönetici' : 'Ofis'} color="#64748b" />
    </div>
    <MarketTrendChart records={records} />
  </div>
);

const StatCard = ({ label, value, color, subLabel }: { label: string, value: string | number, color: string, subLabel?: string }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col gap-2 group">
    <div className="flex justify-between items-start"><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>{subLabel && <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full border border-emerald-100">{subLabel}</span>}</div>
    <div className="flex items-center gap-3"><div className="w-1.5 h-8 rounded-full group-hover:scale-y-125 transition-transform" style={{ backgroundColor: color }}></div><span className="text-3xl font-black text-slate-800 tracking-tighter" style={{ color }}>{value}</span></div>
  </div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0054A6]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-[#E11B22]/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <header className="px-8 lg:px-24 h-24 lg:h-32 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <ReDataLogo className="w-12 h-12 lg:w-16 lg:h-16" />
          <div><h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-[#0054A6] leading-none">Re<span className="text-[#E11B22]">Data</span></h1><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corporate Memory</p></div>
        </div>
      </header>

      <main className="flex-1 px-8 lg:px-24 py-10 relative z-10 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-20 animate-in fade-in duration-1000 pb-20">
          <div className="text-center space-y-6">
            <span className="inline-block px-4 py-2 bg-blue-50 text-remax-blue text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-blue-100">Gayrimenkulde Dijital Dönüşüm</span>
            <h2 className="text-5xl lg:text-7xl font-black text-slate-800 tracking-tighter leading-tight max-w-4xl mx-auto">"En Değerli Veri, <br/><span className="text-remax-blue italic">Kurumsal Hafızanızdır.</span>"</h2>
            <div className="h-1.5 w-24 bg-remax-red mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-50 text-remax-blue rounded-xl flex items-center justify-center"><ShieldCheck size={24} /></div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">ReData Nedir?</h3></div>
              <p className="text-lg font-medium text-slate-600 leading-relaxed italic border-l-4 border-remax-blue pl-6">ReData; bir gayrimenkul ofisinin en büyük varlığı olan "bilgiyi" korumak, işlemek ve kazanca dönüştürmek için tasarlanmış akıllı bir veri ekosistemidir.</p>
            </div>
            <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 relative group">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-remax-red rounded-full flex items-center justify-center text-white shadow-xl animate-bounce"><ZapIcon size={32} /></div>
              <div className="space-y-4">
                <div className="h-4 w-2/3 bg-slate-50 rounded-full"></div><div className="h-4 w-full bg-slate-50 rounded-full"></div><div className="h-4 w-1/2 bg-slate-50 rounded-full"></div>
                <div className="pt-4 grid grid-cols-3 gap-2">
                  <div className="h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-remax-blue"><LineChart size={24}/></div>
                  <div className="h-20 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500"><DatabaseZap size={24}/></div>
                  <div className="h-20 bg-red-50 rounded-2xl flex items-center justify-center text-remax-red"><BrainCircuit size={24}/></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="px-8 lg:px-24 py-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center bg-white/50 backdrop-blur-sm z-50 gap-6">
        <div className="flex items-center gap-3"><ReDataLogo className="w-8 h-8" /><div className="flex flex-col"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© 2026 ReData • Kurumsal Ofis Hafızası</p></div></div>
        <a href="https://www.redata.tr" target="_blank" className="flex items-center gap-2 text-remax-blue font-black text-[10px] uppercase tracking-widest"><Globe size={14} /> www.redata.tr</a>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState<RealEstateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Auth durumu ve verilerin yüklenmesi Firebase standart SDK'sı ile gerçekleştirilir.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) setUserProfile(userDoc.data());
      } else { setCurrentUser(null); setUserProfile(null); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser || !userProfile || (!userProfile.isApproved && !userProfile.isAdmin)) return;
    const q = userProfile.isAdmin ? collection(db, "records") : query(collection(db, "records"), where("officeName", "==", userProfile.officeName));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: RealEstateRecord[] = [];
      snapshot.forEach((docSnap) => docs.push({ ...docSnap.data(), id: docSnap.id } as RealEstateRecord));
      setRecords(docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    return () => unsubscribe();
  }, [currentUser, userProfile]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2Icon className="animate-spin text-remax-blue" size={48} /></div>;
  if (!currentUser) return <LandingPage />;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} userProfile={userProfile}>
      {activeTab === 'dashboard' && <Dashboard records={records} onQuickAction={setActiveTab} userProfile={userProfile} />}
      {activeTab === 'portfolio' && <GenericModule title="Portföy Bankası" type={RecordType.PORTFOLIO} records={records} userProfile={userProfile} icon={HomeIcon} themeColor="#0054A6" />}
      {activeTab === 'demand' && <GenericModule title="Talep Havuzu" type={RecordType.DEMAND} records={records} userProfile={userProfile} icon={TargetIcon} themeColor="#E11B22" />}
      {activeTab === 'valuation' && <GenericModule title="Emsal/Değerleme" type={RecordType.VALUATION} records={records} userProfile={userProfile} icon={HistoryIconLucide} themeColor="#10b981" />}
      {activeTab === 'tapu-analysis' && <TapuAnalysisView />}
      <WhatsAppFab />
      <PWAInstallPrompt />
    </Layout>
  );
};
export default App;