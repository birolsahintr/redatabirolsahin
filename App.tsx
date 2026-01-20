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
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  User, 
  signOut,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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
    <button 
      onClick={openWhatsApp}
      className="fixed bottom-8 right-8 z-[999] flex items-center gap-3 bg-[#25D366] text-white p-4 rounded-full shadow-2xl shadow-green-200 hover:scale-110 active:scale-90 transition-all group"
      title="WhatsApp Destek"
    >
      <span className="max-w-0 overflow-hidden group-hover:max-w-[120px] transition-all duration-500 whitespace-nowrap text-xs font-black uppercase tracking-widest">Destek Hattı</span>
      <MessageCircle size={28} />
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-ping"></div>
    </button>
  );
};

const RecordDetailModal = ({ record, onClose }: { record: any, onClose: () => void }) => {
  const unitPrice = record.pricePerSqm || (record.price && record.area ? Math.round(record.price / record.area) : 0);
  const isPortfolio = record.type === RecordType.PORTFOLIO;
  const isDemand = record.type === RecordType.DEMAND;
  const isValuation = record.type === RecordType.VALUATION;

  const formatDate = (ts: any) => {
    if (!ts) return '-';
    try { const date = ts.toDate ? ts.toDate() : new Date(ts); return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } 
    catch (e) { return '-'; }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${isPortfolio ? 'bg-remax-blue' : isDemand ? 'bg-remax-red' : 'bg-emerald-500'}`}>
              {isPortfolio ? <HomeIcon size={24} /> : isDemand ? <TargetIcon size={24} /> : <ClipboardCheckIcon size={24} />}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 leading-none">Kayıt Detayları</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {record.id?.substring(0,8)} • {record.subCategory}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><XIcon size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-4 border-remax-blue pl-3">Konum Bilgileri</h4>
              <div className="space-y-3">
                <DetailRow label="Şehir" value={record.city} icon={<MapPinIcon size={14}/>} />
                <DetailRow label="İlçe" value={record.district} icon={<MapPinIcon size={14}/>} />
                <DetailRow label="Mahalle" value={record.neighborhood} icon={<MapPinIcon size={14}/>} />
                {!isDemand && <DetailRow label="Ada / Parsel" value={`${record.block || '-'} / ${record.parcel || '-'}`} icon={<LayersIcon size={14}/>} />}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-4 border-remax-red pl-3">Mülk Detayları</h4>
              <div className="space-y-3">
                <DetailRow label="Kategori" value={`${record.category} - ${record.subCategory}`} />
                <DetailRow label="Alan" value={record.area ? `${record.area} m²` : '-'} icon={<Maximize2 size={14}/>} />
                <DetailRow label="Fiyat" value={`${Number(record.price).toLocaleString('tr-TR')} TL`} highlight />
                {!isDemand && <DetailRow label="Birim Fiyat" value={`${unitPrice.toLocaleString('tr-TR')} TL/m²`} />}
                {record.category !== 'Arsa' && record.rooms && <DetailRow label="Oda Sayısı" value={record.rooms} />}
                {record.category !== 'Arsa' && record.age && <DetailRow label="Bina Yaşı" value={record.age} />}
                {record.category === 'Konut' && <DetailRow label="Site Durumu" value={record.isWithinSite ? 'Site İçerisinde' : 'Site Dışı / Bağımsız'} icon={<Fence size={14} />} />}
                {record.zoningRate && <DetailRow label="İmar Durumu" value={`Emsal: ${record.zoningRate}`} />}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-wrap gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100"><UserIcon size={20}/></div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sorumlu Danışman</p>
                <p className="text-xs font-bold text-slate-700">{record.consultantName || record.consultant}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100"><CalendarIcon size={20}/></div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kayıt Tarihi</p>
                <p className="text-xs font-bold text-slate-700">{formatDate(record.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-4 border-amber-400 pl-3">Açıklama ve Notlar</h4>
            <div className="bg-amber-50/30 p-6 rounded-[2rem] border border-amber-100/50 min-h-[120px] text-sm font-medium text-slate-600 leading-relaxed italic whitespace-pre-wrap">
              {record.description || "Bu kayıt için girilmiş bir açıklama bulunmuyor."}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-50 text-center">
          <button onClick={onClose} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-xl">Kapat</button>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, icon, highlight = false }: any) => (
  <div className="flex items-center justify-between gap-4 group">
    <div className="flex items-center gap-2 text-slate-400">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <span className={`text-[12px] font-bold ${highlight ? 'text-remax-blue font-black' : 'text-slate-700'}`}>{value}</span>
  </div>
);

const UserEditModal = ({ user, onClose, onSave, isSuperAdmin }: { user: any, onClose: () => void, onSave: (data: any) => void, isSuperAdmin: boolean }) => {
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    phone: user.phone || '',
    role: user.role || 'Danışman',
    officeName: user.officeName || '',
    tempPassword: '' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: user.id });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <Edit3Icon className="text-remax-blue" size={24} /> Üye Düzenle
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><XIcon size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">İsim Soyisim</label>
            <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 font-bold focus:border-remax-blue" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefon</label>
            <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 font-bold focus:border-remax-blue" required />
          </div>
          {isSuperAdmin && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ofis Adı</label>
              <input type="text" value={formData.officeName} onChange={e => setFormData({...formData, officeName: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 font-bold focus:border-remax-blue" required />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol</label>
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 font-bold focus:border-remax-blue">
              <option value="Danışman">Danışman</option>
              <option value="Broker">Broker</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-remax-red uppercase tracking-widest ml-1 flex items-center gap-1"><KeyIcon size={10} /> Yeni Şifre (Opsiyonel)</label>
            <input type="password" value={formData.tempPassword} onChange={e => setFormData({...formData, tempPassword: e.target.value})} placeholder="Değiştirmek istemiyorsanız boş bırakın" className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 font-bold focus:border-remax-blue" />
            <p className="text-[8px] text-slate-400 italic px-1">* Şifre değişikliği üyenin sonraki girişinde geçerli olacaktır.</p>
          </div>
          <button type="submit" className="w-full bg-remax-blue text-white py-5 rounded-2xl font-black shadow-xl hover:bg-blue-800 transition-all uppercase text-xs tracking-widest mt-4">Güncelle</button>
        </form>
      </div>
    </div>
  );
};

const MemberManagement = ({ userProfile, onAlert, onConfirmRequest }: { userProfile: any, onAlert: (msg: string, type: 'success' | 'error') => void, onConfirmRequest: (cfg: any) => void }) => {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState<'pending' | 'active'>('active');
  const [editUser, setEditUser] = useState<any>(null);

  const isSuperAdmin = userProfile?.isAdmin === true;
  const currentOffice = userProfile?.officeName;

  useEffect(() => {
    const q = isSuperAdmin 
      ? collection(db, "users") 
      : query(collection(db, "users"), where("officeName", "==", currentOffice));

    return onSnapshot(q, (snapshot) => {
      const users: any[] = [];
      snapshot.forEach(doc => users.push({ ...doc.data(), id: doc.id }));
      setAllUsers(users);
      setLoading(false);
    });
  }, [currentOffice, isSuperAdmin]);

  const handleUpdateUser = async (data: any) => {
    try {
      const userRef = doc(db, "users", data.id);
      const updateData: any = {
        fullName: data.fullName,
        phone: data.phone,
        role: data.role,
        updatedAt: Timestamp.now()
      };
      if (isSuperAdmin) updateData.officeName = data.officeName;
      if (data.tempPassword) updateData.tempPassword = data.tempPassword;

      await updateDoc(userRef, updateData);
      onAlert("Üye bilgileri güncellendi.", "success");
    } catch (e) {
      onAlert("Güncelleme hatası.", "error");
    }
  };

  const approveUser = async (uid: string) => { 
    try { 
      await updateDoc(doc(db, "users", uid), { isApproved: true }); 
      onAlert("Üye onaylandı.", "success"); 
    } catch (e) { 
      onAlert("Onay hatası.", "error"); 
    } 
  };

  const removeUser = (user: any) => {
    const message = !user.isApproved 
      ? `${user.fullName} isimli üyelik isteğini reddetmek istediğinize emin misiniz?` 
      : `DİKKAT: ${user.fullName} sistemden kalıcı olarak silinecektir. Bu işlem geri alınamaz. Emin misiniz?`;
    
    onConfirmRequest({ 
      title: !user.isApproved ? "İsteği Reddet" : "Üyeyi Sil", 
      message, 
      onConfirm: async () => { 
        try { 
          await deleteDoc(doc(db, "users", user.id)); 
          onAlert("Üye sistemden silindi.", "success"); 
        } catch (e) { 
          onAlert("Silme hatası.", "error"); 
        } 
      } 
    });
  };

  if (loading) return <div className="py-20 text-center"><Loader2Icon className="animate-spin mx-auto text-remax-blue" size={32} /></div>;

  const filtered = allUsers.filter(u => viewTab === 'pending' ? !u.isApproved : u.isApproved);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {editUser && (
        <UserEditModal 
          user={editUser} 
          isSuperAdmin={isSuperAdmin} 
          onClose={() => setEditUser(null)} 
          onSave={handleUpdateUser} 
        />
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <MemberIcon size={32} className="text-remax-blue" /> Üye Yönetimi
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            {isSuperAdmin ? "Tüm Sistem Üyeleri" : `${currentOffice} Ofis Kadrosu`}
          </p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          <button 
            onClick={() => setViewTab('active')} 
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewTab === 'active' ? 'bg-[#0054A6] text-white' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Aktif Üyeler ({allUsers.filter(u => u.isApproved).length})
          </button>
          <button 
            onClick={() => setViewTab('pending')} 
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewTab === 'pending' ? 'bg-[#E11B22] text-white' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Onay Bekleyen ({allUsers.filter(u => !u.isApproved).length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(user => (
          <div key={user.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl group hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#0054A6] font-black text-xl shadow-inner border border-slate-100">
                {user.fullName?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-800 truncate">{user.fullName}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${user.role === 'Broker' ? 'bg-red-50 text-remax-red border border-red-100' : 'bg-blue-50 text-remax-blue border border-blue-100'}`}>
                    {user.role}
                  </span>
                  {user.isAdmin && <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-slate-900 text-white uppercase">Sistem Admin</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setEditUser(user)} className="p-2 text-slate-400 hover:text-remax-blue hover:bg-blue-50 rounded-xl transition-all">
                  <Edit3Icon size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-3 mb-8 text-[11px] font-bold text-slate-500">
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <BuildingIcon size={14} className="text-slate-400" /> 
                <span className="truncate">{user.officeName}</span>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <PhoneIcon size={14} className="text-slate-400" /> 
                <span>{user.phone}</span>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <Mail size={14} className="text-slate-400" /> 
                <span className="truncate lowercase">{user.email}</span>
              </div>
              {user.tempPassword && (
                <div className="flex items-center gap-3 bg-red-50 p-3 rounded-2xl border border-red-100 text-remax-red">
                  <KeyIcon size={14} /> 
                  <span className="font-black">Şifre: {user.tempPassword}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
              {viewTab === 'pending' ? (
                <>
                  <button onClick={() => approveUser(user.id)} className="py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all">Onayla</button>
                  <button onClick={() => removeUser(user)} className="py-3 bg-slate-100 text-slate-400 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all">Reddet</button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditUser(user)} className="py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase hover:bg-slate-800 transition-all">Düzenle</button>
                  <button onClick={() => removeUser(user)} className="py-3 bg-red-50 text-remax-red rounded-xl font-black text-[10px] uppercase hover:bg-red-100 transition-all">Üyeyi Sil</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {filtered.length === 0 && (
        <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <MemberIcon size={40} className="text-slate-200" />
          </div>
          <p className="text-slate-400 font-bold italic">Bu listede gösterilecek üye bulunmuyor.</p>
        </div>
      )}
    </div>
  );
};

const SmartImportModal = ({ onClose, onImport }: { onClose: () => void, onImport: (data: any) => void }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await extractListingFromText(text);
      if (result) {
        onImport(result);
        onClose();
      } else {
        setError('İlan bilgileri ayıklanamadı. Lütfen metni kontrol edin.');
      }
    } catch (e) {
      console.error("Smart Import Error:", e);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <SparklesIcon className="text-remax-blue" size={24} /> Akıllı İlan Aktarımı
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><XIcon size={20} /></button>
        </div>
        <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">İlan metnini buraya yapıştırın. Yapay zeka fiyat, alan, konum gibi bilgileri otomatik olarak ayıklayacaktır.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="İlan metnini buraya yapıştırın..."
          className="w-full h-48 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium outline-none focus:border-remax-blue resize-none text-sm mb-4"
        />
        {error && <div className="p-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-bold mb-4 flex items-center gap-2"><AlertCircleIcon size={14} /> {error}</div>}
        <button onClick={handleProcess} disabled={loading || !text.trim()} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition-all uppercase text-xs tracking-widest">
          {loading ? <Loader2Icon className="animate-spin" size={18} /> : <><ZapIcon size={18} /> Verileri Ayıkla</>}
        </button>
      </div>
    </div>
  );
};

const ManualRecordModal = ({ type, onClose, onSave, initialData }: { type: RecordType, onClose: () => void, onSave: (data: any) => void, initialData?: any }) => {
  const [formData, setFormData] = useState({
    category: initialData?.category || 'Konut' as PropertyCategory,
    subCategory: initialData?.subCategory || '',
    city: initialData?.city || 'Kocaeli',
    district: initialData?.district || '',
    neighborhood: initialData?.neighborhood || '',
    price: initialData?.price?.toString() || '',
    area: initialData?.area?.toString() || '',
    block: initialData?.block || '',
    parcel: initialData?.parcel || '',
    rooms: initialData?.rooms || '2+1' as RoomCount,
    age: initialData?.age || '',
    zoningRate: initialData?.zoningRate || '',
    description: initialData?.description || '',
    status: initialData?.status || 'ACTIVE',
    isSold: initialData?.isSold || false,
    isWithinSite: initialData?.isWithinSite || false,
    salePrice: initialData?.salePrice?.toString() || ''
  });

  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);

  useEffect(() => {
    LocationService.getCities().then(setCities);
  }, []);

  useEffect(() => {
    if (formData.city) {
      LocationService.getDistricts(formData.city).then(setDistricts);
    }
  }, [formData.city]);

  useEffect(() => {
    if (formData.city && formData.district) {
      LocationService.getNeighborhoods(formData.city, formData.district).then(setNeighborhoods);
    }
  }, [formData.city, formData.district]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, type, id: initialData?.id });
    onClose();
  };

  const imarOptions = ['YOK', '0.05', '0.10', '0.15', '0.20', '0.25', '0.30', '0.40', '0.50', '0.60', '0.65', '0.70', '0.75', '0.80', '0.85', '0.90', '0.95', '1.00'];
  const isDemand = type === RecordType.DEMAND;
  const isPortfolio = type === RecordType.PORTFOLIO;
  const isValuation = type === RecordType.VALUATION;
  const showZoning = !isDemand && formData.category === 'Arsa';
  const showAge = formData.category === 'Konut' || formData.category === 'İşyeri';

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-3">
            {isPortfolio ? <HomeIcon className="text-[#0054A6]" size={20} /> : isDemand ? <TargetIcon className="text-[#E11B22]" size={20} /> : <HistoryIconLucide className="text-emerald-500" size={20} />}
            {initialData ? 'Kaydı Düzenle' : (isPortfolio ? 'Yeni Portföy' : isDemand ? 'Yeni Talep' : 'Yeni Emsal')}
          </h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><XIcon size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          <form id="recordForm" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isValuation && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${formData.isSold ? 'bg-emerald-500 text-white' : 'bg-white text-emerald-600 border border-emerald-100 shadow-sm'}`}>
                        <ShoppingBagIcon size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-emerald-800 uppercase tracking-tight">Satış Durumu</p>
                        <p className="text-[10px] font-bold text-emerald-600/70">Bu mülk satıldı mı?</p>
                      </div>
                   </div>
                   <button 
                    type="button"
                    onClick={() => setFormData({...formData, isSold: !formData.isSold})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none ${formData.isSold ? 'bg-emerald-500' : 'bg-slate-200'}`}
                   >
                     <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isSold ? 'translate-x-6' : 'translate-x-1'}`} />
                   </button>
                </div>
              )}

              {formData.category === 'Konut' && (
                <div className={`p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between ${!isValuation ? 'col-span-full' : ''}`}>
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${formData.isWithinSite ? 'bg-remax-blue text-white' : 'bg-white text-remax-blue border border-blue-100 shadow-sm'}`}>
                        <Fence size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-remax-blue uppercase tracking-tight">Site Durumu</p>
                        <p className="text-[10px] font-bold text-blue-600/70">Site içerisinde mi?</p>
                      </div>
                   </div>
                   <button 
                    type="button"
                    onClick={() => setFormData({...formData, isWithinSite: !formData.isWithinSite})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none ${formData.isWithinSite ? 'bg-remax-blue' : 'bg-slate-200'}`}
                   >
                     <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isWithinSite ? 'translate-x-6' : 'translate-x-1'}`} />
                   </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Kategori</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value as PropertyCategory, subCategory: '', zoningRate: '', isWithinSite: false})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none focus:border-[#0054A6] text-sm">
                  <option value="Konut">Konut</option><option value="Arsa">Arsa</option><option value="İşyeri">İşyeri</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Alt Tip</label>
                <select value={formData.subCategory} onChange={(e) => setFormData({...formData, subCategory: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none focus:border-[#0054A6] text-sm" required>
                  <option value="">Seçiniz...</option>
                  {CATEGORY_TREE[formData.category].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">İl</label>
                <select value={formData.city} onChange={(e) => { setFormData({...formData, city: e.target.value, district: '', neighborhood: ''}); }} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none focus:border-[#0054A6] text-sm" required>{cities.map(c => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">İlçe</label>
                <select value={formData.district} onChange={(e) => { setFormData({...formData, district: e.target.value, neighborhood: ''}); }} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none focus:border-[#0054A6] text-sm" required={!isDemand}><option value="">Seçiniz...</option>{districts.map(d => <option key={d} value={d}>{d}</option>)}</select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Mahalle</label>
                <select value={formData.neighborhood} onChange={(e) => setFormData({...formData, neighborhood: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none focus:border-[#0054A6] text-sm" required={!isDemand}><option value="">Seçiniz...</option>{neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}</select>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {!isDemand && (<><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Ada</label><input type="text" value={formData.block} onChange={(e) => setFormData({...formData, block: e.target.value})} placeholder="101" className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none focus:border-[#0054A6] text-sm" /></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Parsel</label><input type="text" value={formData.parcel} onChange={(e) => setFormData({...formData, parcel: e.target.value})} placeholder="5" className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none focus:border-[#0054A6] text-sm" /></div></>)}
              <div className={`space-y-1 ${isDemand ? 'col-span-full' : 'col-span-2'}`}><label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Alan (m²)</label><input type="number" value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} placeholder="150" className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none focus:border-[#0054A6] text-sm" required={!isDemand} /></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">
                  {isValuation ? 'Değerleme Fiyatı (TL)' : 'İlan Fiyatı (TL)'}
                </label>
                <input type="text" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="5.500.000" className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none focus:border-[#0054A6] text-sm" required />
              </div>
              {formData.isSold ? (
                <div className="space-y-1 animate-in zoom-in duration-300">
                  <label className="text-[10px] font-black text-emerald-600 uppercase ml-1 tracking-widest">Gerçek Satış Fiyatı (TL)</label>
                  <input type="text" value={formData.salePrice} onChange={(e) => setFormData({...formData, salePrice: e.target.value})} placeholder="5.250.000" className="w-full bg-emerald-50 p-3 rounded-xl border border-emerald-100 font-black text-emerald-700 outline-none focus:border-emerald-500 text-sm shadow-inner" required />
                </div>
              ) : (
                formData.category === 'Konut' && (<div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Oda Sayısı</label><select value={formData.rooms} onChange={(e) => setFormData({...formData, rooms: e.target.value as RoomCount})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none focus:border-[#0054A6] text-sm">{['1+0','1+1','2+1','3+1','4+1','5+1','6+1','7+1 ve üzeri'].map(r => <option key={r} value={r}>{r}</option>)}</select></div>)
              )}
            </div>

            {showAge && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Bina Yaşı</label>
                <select value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none focus:border-[#0054A6] text-sm">
                  <option value="">Seçiniz...</option>
                  {AGE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            )}

            {showZoning && (
              <div className="space-y-2 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <label className="text-[10px] font-black text-emerald-600 uppercase ml-1 flex items-center gap-1 tracking-widest"><LayersIcon size={12} /> İmar / Emsal Durumu</label>
                <div className="grid grid-cols-4 gap-2">{imarOptions.map(opt => (<button key={opt} type="button" onClick={() => setFormData({...formData, zoningRate: opt})} className={`py-2 rounded-lg text-[10px] font-black border transition-all ${formData.zoningRate === opt ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50'}`}>{opt}</button>))}</div>
              </div>
            )}
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Açıklama / Notlar</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 font-bold outline-none focus:border-[#0054A6] h-20 resize-none text-sm" placeholder="Örn: Müşteri acil satılık, takas değerlendirilebilir..." /></div>
          </form>
        </div>
        <div className="p-4 sm:p-6 border-t border-slate-100 shrink-0"><button form="recordForm" type="submit" className="w-full bg-[#0054A6] text-white py-4 rounded-xl font-black shadow-lg hover:bg-blue-800 transition-all uppercase text-xs tracking-[0.2em]">{initialData ? 'Güncelle' : 'Kaydet'}</button></div>
      </div>
    </div>
  );
};

const RecordListRow: React.FC<{ record: any, userProfile: any, onDeleteRequest: (id: string) => void, onEdit: (record: any) => void, onView: (record: any) => void, onReportRequest: (record: any) => void, onStatusToggle: (record: any) => void }> = ({ record, userProfile, onDeleteRequest, onEdit, onView, onReportRequest, onStatusToggle }) => {
  const isOwner = record.consultant?.trim().toLowerCase() === userProfile?.email?.trim().toLowerCase();
  const isBrokerInOffice = userProfile?.role === 'Broker' && record.officeName === userProfile?.officeName;
  const isSuperAdmin = userProfile?.isAdmin === true;
  const canModify = isOwner || isBrokerInOffice || isSuperAdmin;
  const isDemand = record.type === RecordType.DEMAND;
  const isValuation = record.type === RecordType.VALUATION;

  const isExpired = useMemo(() => {
    if (!record.createdAt) return false;
    const date = record.createdAt.toDate ? record.createdAt.toDate() : new Date(record.createdAt);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return date < sixMonthsAgo;
  }, [record.createdAt]);

  const effectiveStatus = useMemo(() => {
    if (isDemand && (record.status === 'PASSIVE' || isExpired)) return 'PASSIVE';
    return 'ACTIVE';
  }, [record.status, isExpired, isDemand]);

  const isPassive = effectiveStatus === 'PASSIVE';
  const theme = useMemo(() => {
    if (record.isSold) return { bg: 'bg-emerald-500', text: 'text-white', icon: <ShoppingBagIcon size={14} /> };
    if (isPassive) return { bg: 'bg-slate-100', text: 'text-slate-400', icon: <ArchiveIcon size={14} /> };
    if (record.type === RecordType.PORTFOLIO) return { bg: 'bg-blue-50', text: 'text-[#0054A6]', icon: <HomeIcon size={14} /> };
    if (record.type === RecordType.DEMAND) return { bg: 'bg-red-50', text: 'text-[#E11B22]', icon: <TargetIcon size={14} /> };
    return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <HistoryIconLucide size={14} /> };
  }, [record.type, isPassive, record.isSold]);

  const unitPrice = record.pricePerSqm || (record.price && record.area ? Math.round(record.price / record.area) : 0);
  const saleUnitPrice = record.salePrice && record.area ? Math.round(record.salePrice / record.area) : 0;

  const formatDate = (ts: any) => {
    if (!ts) return '-';
    try { const date = ts.toDate ? ts.toDate() : new Date(ts); return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }); } 
    catch (e) { return '-'; }
  };

  return (
    <div className={`group flex flex-col md:flex-row items-center gap-4 p-4 border-b border-slate-50 transition-all ${record.isSold ? 'bg-emerald-50/30' : isPassive ? 'bg-slate-50/50 grayscale-[0.5] opacity-80' : 'bg-white hover:bg-slate-50/50'}`}>
       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme.bg} ${theme.text} shadow-sm group-hover:scale-110 transition-transform relative`}>
         {theme.icon}
         {isDemand && !isPassive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>}
         {record.isSold && <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-emerald-500 rounded-full flex items-center justify-center border border-emerald-200 shadow-sm"><CheckCircleIcon size={10} /></div>}
       </div>
       <div className={`flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-3 ${isDemand ? 'md:grid-cols-8' : 'md:grid-cols-11'} gap-x-4 gap-y-3 items-start md:items-center w-full`}>
         <div className="overflow-hidden">
           <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest mb-0.5">Alt Tip</span>
           <div className="flex flex-col">
              <span className={`text-[11px] font-bold truncate block ${isPassive ? 'text-slate-400' : 'text-slate-700'}`}>{record.subCategory}</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {record.isSold && <span className="text-[8px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full w-fit uppercase">Satıldı</span>}
                {record.isWithinSite && <span className="text-[8px] font-black bg-remax-blue text-white px-1.5 py-0.5 rounded-full w-fit uppercase flex items-center gap-1"><Fence size={8} /> Site</span>}
                {record.age && <span className="text-[8px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded-full w-fit uppercase">Yaş: {record.age}</span>}
              </div>
           </div>
         </div>
         <div className="overflow-hidden"><span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest mb-0.5">Konum</span><span className={`text-[11px] font-bold truncate block ${isPassive ? 'text-slate-400' : 'text-slate-700'}`}>{record.city} - {record.district}</span><span className="text-[9px] font-medium text-slate-400 truncate block">{record.neighborhood || '-'}</span></div>
         <div className="overflow-hidden"><span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest mb-0.5">Danışman</span><div className="flex items-center gap-1"><UserIcon size={10} className="text-slate-400" /><span className={`text-[10px] font-bold truncate ${isPassive ? 'text-slate-400' : 'text-slate-500'}`}>{record.consultantName || record.consultant?.split('@')[0]}</span></div></div>
         <div className="overflow-hidden hidden sm:block md:col-span-1"><span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest mb-0.5">Kayıt Tarihi</span><div className="flex items-center gap-1"><CalendarIcon size={10} className="text-slate-300" /><span className={`text-[11px] font-bold ${isPassive ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(record.createdAt)}</span></div></div>
         {!isDemand && (<div className="overflow-hidden"><span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest mb-0.5">Alan</span>{record.area ? (<div className="flex items-center gap-1"><span className={`text-[11px] font-black ${isPassive ? 'text-slate-400' : 'text-slate-800'}`}>{record.area}</span><span className="text-[9px] text-slate-400 font-bold uppercase">m²</span></div>) : <span className="text-[10px] text-slate-300 font-bold italic">Yok</span>}</div>)}
         <div className="overflow-hidden"><span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest mb-0.5">İmar</span>{record.zoningRate ? (<div className="flex items-center gap-1"><LayersIcon size={10} className={isPassive ? 'text-slate-300' : 'text-emerald-500'} /><span className={`text-[11px] font-black ${isPassive ? 'text-slate-400' : 'text-emerald-600'}`}>E: {record.zoningRate}</span></div>) : <span className="text-[9px] text-slate-300 font-bold">Belirtilmedi</span>}</div>
         {!isDemand && (
           <>
            <div className="overflow-hidden hidden sm:block md:col-span-1"><span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest mb-0.5">Ada/Parsel</span>{record.block ? (<span className={`text-[11px] font-black ${isPassive ? 'text-slate-400' : 'text-slate-700'}`}>{record.block} / {record.parcel || '-'}</span>) : <span className="text-[9px] text-slate-300 font-bold">Girilmedi</span>}</div>
            <div className="overflow-hidden hidden sm:block md:col-span-1">
              <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest mb-0.5">Birim (m²/TL)</span>
              <div className="flex flex-col">
                <span className={`text-[11px] font-black ${isPassive ? 'text-slate-400' : 'text-[#0054A6]'}`}>{unitPrice.toLocaleString('tr-TR')} TL</span>
                {record.isSold && <span className="text-[9px] font-black text-emerald-600 line-clamp-1">Satış: {saleUnitPrice.toLocaleString('tr-TR')} TL</span>}
              </div>
            </div>
           </>
         )}
         <div className="overflow-hidden">
            <span className="text-[9px] font-black uppercase text-slate-400 block tracking-widest mb-0.5">Fiyat Bilgisi</span>
            <div className="flex flex-col">
              <span className={`text-[11px] font-black ${record.isSold ? 'text-slate-400 line-through decoration-remax-red/50' : theme.text}`}>{Number(record.price).toLocaleString('tr-TR')} TL</span>
              {record.isSold && <span className="text-[12px] font-black text-emerald-600 flex items-center gap-1"><TagIcon size={10} /> {Number(record.salePrice).toLocaleString('tr-TR')} TL</span>}
            </div>
         </div>
         <div className="col-span-full md:col-span-2 flex justify-end items-center gap-2 mt-2 md:mt-0">
           {isDemand && canModify && (<button onClick={(e) => { e.stopPropagation(); onStatusToggle(record); }} className={`p-1.5 rounded-lg transition-all flex items-center gap-1 font-black text-[9px] uppercase ${isPassive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} title={isPassive ? "Aktifleştir" : "Pasife Al"}>{isPassive ? <><PowerIcon size={12} /> Aktif Et</> : <><ArchiveIcon size={12} /> Arşive At</>}</button>)}
           {isValuation && (<button onClick={() => onReportRequest(record)} className="flex items-center gap-1 px-3 py-1.5 bg-[#0054A6] text-white rounded-lg text-[10px] font-black uppercase hover:bg-blue-800 transition-all shadow-md"><BarChartIcon size={12} /> Rapor</button>)}
           
           <div className="flex items-center gap-1 transition-all">
             <button type="button" onClick={(e) => { e.stopPropagation(); onView(record); }} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Gözat"><EyeIcon size={16} /></button>
             {canModify && (
               <>
                <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(record); }} className="p-1.5 text-slate-400 hover:text-[#0054A6] hover:bg-blue-50 rounded-lg transition-all" title="Düzenle"><Edit3Icon size={16} /></button>
                <button type="button" onClick={(e) => { e.stopPropagation(); onDeleteRequest(record.id); }} className="p-1.5 text-slate-400 hover:text-[#E11B22] hover:bg-red-50 rounded-lg transition-all" title="Sil"><Trash2Icon size={16} /></button>
               </>
             )}
           </div>
           
           <button type="button" className="p-1 text-slate-300 hover:text-slate-600 rounded-lg transition-all"><ChevronRightIcon size={16} /></button>
         </div>
       </div>
    </div>
  );
};

const GenericModule = ({ title, type, records, onAdd, onUpdate, userProfile, onDeleteRequest, onReportRequest, icon: Icon, themeColor, showSmartImport = false }: any) => {
  const [showModal, setShowModal] = useState(false);
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const [filterCity, setFilterCity] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterNeighborhood, setFilterNeighborhood] = useState('');
  const [filterConsultant, setFilterConsultant] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PASSIVE'>(type === RecordType.DEMAND ? 'ACTIVE' : 'ALL');

  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);

  useEffect(() => {
    LocationService.getCities().then(setCities);
  }, []);

  useEffect(() => {
    if (filterCity) {
      LocationService.getDistricts(filterCity).then(setDistricts);
    } else {
      setDistricts([]);
    }
    setFilterDistrict('');
    setFilterNeighborhood('');
  }, [filterCity]);

  useEffect(() => {
    if (filterCity && filterDistrict) {
      LocationService.getNeighborhoods(filterCity, filterDistrict).then(setNeighborhoods);
    } else {
      setNeighborhoods([]);
    }
    setFilterNeighborhood('');
  }, [filterCity, filterDistrict]);

  const isDemand = type === RecordType.DEMAND;
  const filtered = useMemo(() => {
    return records.filter((r: any) => {
      if (r.type !== type) return false;
      const cityMatch = !filterCity || r.city === filterCity;
      const districtMatch = !filterDistrict || r.district === filterDistrict;
      const neighborhoodMatch = !filterNeighborhood || r.neighborhood === filterNeighborhood;
      const consultantMatch = !filterConsultant || r.consultant === filterConsultant;
      const categoryMatch = !filterCategory || r.category === filterCategory;
      const ageMatch = !filterAge || r.age === filterAge;
      let statusMatch = true;
      if (isDemand && filterStatus !== 'ALL') {
        const date = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
        const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const effectiveStatus = (r.status === 'PASSIVE' || date < sixMonthsAgo) ? 'PASSIVE' : 'ACTIVE';
        statusMatch = effectiveStatus === filterStatus;
      }
      return cityMatch && districtMatch && neighborhoodMatch && consultantMatch && categoryMatch && statusMatch && ageMatch;
    });
  }, [records, type, filterCity, filterDistrict, filterNeighborhood, filterConsultant, filterCategory, filterAge, filterStatus, isDemand]);

  const uniqueConsultants = useMemo(() => {
    const map = new Map();
    records.filter(r => r.type === type).forEach(r => { if (r.consultant && !map.has(r.consultant)) map.set(r.consultant, r.consultantName || r.consultant.split('@')[0]); });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [records, type]);

  const handleEdit = (record: any) => { setEditingRecord(record); setShowModal(true); };
  const handleView = (record: any) => { setViewingRecord(record); };
  
  const toggleStatus = async (record: any) => {
    const newStatus = record.status === 'PASSIVE' ? 'ACTIVE' : 'PASSIVE';
    try { await updateDoc(doc(db, "records", record.id), { status: newStatus, updatedAt: Timestamp.now() }); } catch (e) { console.error("Durum güncelleme hatası:", e); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Icon style={{ color: themeColor }} size={32}/> {title}</h2>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Ofis: {userProfile?.officeName || '-'} | {filtered.length} Kayıt</p>
        </div>
        <div className="flex gap-3">
          {showSmartImport && <button onClick={() => setShowSmartModal(true)} className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-lg text-sm"><SparklesIcon size={18} /> Akıllı Aktarım</button>}
          <button onClick={() => setShowModal(true)} style={{ backgroundColor: themeColor }} className="text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-lg text-sm"><PlusIcon size={18} /> Yeni Kayıt</button>
        </div>
      </div>
      <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-400 rounded-xl"><FilterIcon size={14} /><span className="text-[10px] font-black uppercase tracking-widest">Filtrele</span></div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-7 gap-3">
          <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#0054A6] transition-colors"><option value="">Tüm İller</option>{cities.map(c => <option key={c} value={c}>{c}</option>)}</select>
          <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)} disabled={!filterCity} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#0054A6] transition-colors disabled:opacity-50"><option value="">Tüm İlçeler</option>{districts.map(d => <option key={d} value={d}>{d}</option>)}</select>
          <select value={filterNeighborhood} onChange={(e) => setFilterNeighborhood(e.target.value)} disabled={!filterDistrict} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#0054A6] transition-colors disabled:opacity-50"><option value="">Tüm Mahalleler</option>{neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}</select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#0054A6] transition-colors"><option value="">Tüm Kategoriler</option><option value="Konut">Konut</option><option value="Arsa">Arsa</option><option value="İşyeri">İşyeri</option></select>
          <select value={filterAge} onChange={(e) => setFilterAge(e.target.value)} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#0054A6] transition-colors"><option value="">Tüm Yaşlar</option>{AGE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}</select>
          <select value={filterConsultant} onChange={(e) => setFilterConsultant(e.target.value)} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs font-bold outline-none focus:border-[#0054A6] transition-colors"><option value="">Tüm Danışmanlar</option>{uniqueConsultants.map(([email, name]) => <option key={email} value={email}>{name}</option>)}</select>
          {isDemand && (<select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className={`border p-2.5 rounded-xl text-xs font-black outline-none transition-colors ${filterStatus === 'ACTIVE' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : filterStatus === 'PASSIVE' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-700'}`}><option value="ALL">Tüm Talepler</option><option value="ACTIVE">Güncel Talepler</option><option value="PASSIVE">Arşivlenmiş</option></select>)}
        </div>
        {(filterCity || filterDistrict || filterNeighborhood || filterConsultant || filterCategory || filterAge || (isDemand && filterStatus !== 'ACTIVE')) && (<button onClick={() => {setFilterCity(''); setFilterDistrict(''); setFilterNeighborhood(''); setFilterConsultant(''); setFilterCategory(''); setFilterAge(''); setFilterStatus(isDemand ? 'ACTIVE' : 'ALL');}} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors" title="Filtreleri Sıfırla"><RotateCcwIcon size={16} /></button>)}
      </div>
      {showModal && <ManualRecordModal type={type} onClose={() => {setShowModal(false); setEditingRecord(null);}} onSave={editingRecord ? onUpdate : onAdd} initialData={editingRecord} />}
      {showSmartImport && showSmartModal && <SmartImportModal onClose={() => setShowSmartModal(false)} onImport={(data) => onAdd({...data, type})} />}
      {viewingRecord && <RecordDetailModal record={viewingRecord} onClose={() => setViewingRecord(null)} />}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden min-h-[400px]">
        <div className="hidden md:flex items-center gap-4 p-5 bg-slate-50/50 border-b border-slate-100">
           <div className="w-10 h-10 shrink-0"></div>
           <div className={`flex-1 grid ${isDemand ? 'grid-cols-8' : 'grid-cols-11'} gap-4`}>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alt Kategori</div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bölge</div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danışman</div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kayıt Tarihi</div>
              {!isDemand && <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alan (m²)</div>}<div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İmar</div>
              {!isDemand && (<><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ada / Parsel</div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">m²/TL</div></>)}
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam Fiyat</div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right col-span-2">İşlemler</div>
           </div>
        </div>
        <div className="divide-y divide-slate-50">{filtered.map((r: any) => <RecordListRow key={r.id} record={r} userProfile={userProfile} onDeleteRequest={onDeleteRequest} onEdit={handleEdit} onView={handleView} onReportRequest={onReportRequest} onStatusToggle={toggleStatus} />)}</div>
        {filtered.length === 0 && (<div className="py-32 text-center"><div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner"><Icon size={40} className="text-slate-200" /></div><p className="text-slate-400 font-bold italic">Kayıt bulunamadı.</p></div>)}
      </div>
      {isDemand && <div className="flex items-center gap-3 px-6 py-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-blue-700"><TimerIcon size={18} /><p className="text-[11px] font-bold uppercase tracking-tight">Sistem Notu: Talepler 6 ay sonra otomatik olarak arşive aktarılır.</p></div>}
    </div>
  );
};

const Dashboard = ({ records, onQuickAction, userProfile }: any) => (
  <div className="space-y-10 animate-in fade-in duration-700">
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden">
      <h2 className="text-3xl font-black mb-2 text-slate-800 tracking-tight">Merhaba, {userProfile?.fullName?.split(' ')[0] || 'Kullanıcı'}</h2>
      <p className="text-slate-400 font-bold mb-8 uppercase text-[10px] tracking-[0.3em]">{userProfile?.officeName} Ofis Hafızası</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button onClick={() => onQuickAction('portfolio')} className="p-8 bg-blue-50/50 hover:bg-blue-100/50 border border-blue-100 rounded-[2rem] flex flex-col items-center text-center gap-4 transition-all group hover:scale-[1.02] shadow-sm"><div className="p-5 bg-[#0054A6] text-white rounded-2xl shadow-lg shadow-blue-100 group-hover:rotate-12 transition-transform"><HomeIcon size={28} /></div><div><span className="block font-black text-slate-800 text-lg">Portföy Ekle</span><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bankaya Ekle</span></div></button>
        <button onClick={() => onQuickAction('demand')} className="p-8 bg-red-50/50 hover:bg-red-100/50 border border-red-100 rounded-[2rem] flex flex-col items-center text-center gap-4 transition-all group hover:scale-[1.02] shadow-sm"><div className="p-5 bg-[#E11B22] text-white rounded-2xl shadow-lg shadow-red-100 group-hover:rotate-12 transition-transform"><TargetIcon size={28} /></div><div><span className="block font-black text-slate-800 text-lg">Talep Girişi</span><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Müşteri Talebi</span></div></button>
        <button onClick={() => onQuickAction('valuation')} className="p-8 bg-emerald-50/50 hover:bg-emerald-100/50 border border-emerald-100 rounded-[2rem] flex flex-col items-center text-center gap-4 transition-all group hover:scale-[1.02] shadow-sm"><div className="p-5 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100 group-hover:rotate-12 transition-transform"><ClipboardCheckIcon size={28} /></div><div><span className="block font-black text-slate-800 text-lg">Emsal Girişi</span><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Değerleme Verisi</span></div></button>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <StatCard label="Portföyler" value={records.filter((r:any) => r.type === RecordType.PORTFOLIO).length} color="#0054A6" />
      <StatCard label="Talepler" value={records.filter((r:any) => { if (r.type !== RecordType.DEMAND) return false; const date = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt); const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6); return r.status !== 'PASSIVE' && date >= sixMonthsAgo; }).length} color="#E11B22" subLabel="Güncel" />
      <StatCard label="Emsaller" value={records.filter((r:any) => r.type === RecordType.VALUATION).length} color="#10b981" />
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

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState<RealEstateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertInfo, setAlertInfo] = useState<{ message: string, type: 'error' | 'success' } | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ title: string, message: string, onConfirm: () => void, confirmText?: string } | null>(null);
  const [reportRecord, setReportRecord] = useState<RealEstateRecord | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
          setCurrentUser(user);
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) setUserProfile(userDoc.data());
        } catch (e) { console.error("Profil hatası:", e); }
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

  const addRecord = async (recordData: any) => {
    if (!userProfile) return;
    const { id, ...cleanInputData } = recordData;
    const priceNum = cleanNumeric(recordData.price);
    const salePriceNum = cleanNumeric(recordData.salePrice || 0);
    const areaNum = cleanNumeric(recordData.area || 0);
    const finalData = sanitizeForFirestore({ 
      ...cleanInputData, 
      price: priceNum, 
      salePrice: salePriceNum,
      area: areaNum, 
      pricePerSqm: areaNum > 0 ? Math.round(priceNum / areaNum) : 0, 
      consultant: userProfile.email, 
      consultantName: userProfile.fullName, 
      officeName: userProfile.officeName, 
      createdAt: Timestamp.now(), 
      status: recordData.type === RecordType.DEMAND ? 'ACTIVE' : undefined 
    });
    try { await addDoc(collection(db, "records"), finalData); setAlertInfo({ message: "Kayıt eklendi.", type: 'success' }); } catch (e: any) { setAlertInfo({ message: "Hata oluştu.", type: 'error' }); }
  };

  const updateRecord = async (recordData: any) => {
    if (!userProfile || !recordData.id) return;
    const { id, ...cleanData } = recordData;
    const priceNum = cleanNumeric(recordData.price);
    const salePriceNum = cleanNumeric(recordData.salePrice || 0);
    const areaNum = cleanNumeric(recordData.area || 0);
    try { 
      await updateDoc(doc(db, "records", id), sanitizeForFirestore({ 
        ...cleanData, 
        price: priceNum, 
        salePrice: salePriceNum,
        area: areaNum, 
        pricePerSqm: areaNum > 0 ? Math.round(priceNum / areaNum) : 0, 
        updatedAt: Timestamp.now() 
      })); 
      setAlertInfo({ message: "Güncellendi.", type: 'success' }); 
    } catch (e) { setAlertInfo({ message: "Hata.", type: 'error' }); }
  };

  const deleteRecord = (id: string) => {
    setConfirmConfig({ title: "Kaydı Sil", message: "Emin misiniz?", onConfirm: async () => { try { await deleteDoc(doc(db, "records", id)); setAlertInfo({ message: "Silindi.", type: 'success' }); } catch (e) { setAlertInfo({ message: "Hata.", type: 'error' }); } setConfirmConfig(null); } });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2Icon className="animate-spin text-remax-blue" size={48} /></div>;
  if (!currentUser) return <LandingPage />;
  if (currentUser && !userProfile) return <div className="h-screen bg-slate-50 flex flex-col items-center justify-center gap-4"><Loader2Icon className="animate-spin text-remax-blue" size={48} /><p className="text-slate-500 font-bold">Hazırlanıyor...</p><button onClick={() => signOut(auth)} className="text-xs text-remax-red underline">Çıkış Yap</button></div>;
  if (userProfile && !userProfile.isApproved && !userProfile.isAdmin) return <div className="h-screen bg-slate-50 flex items-center justify-center p-4"><div className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-md w-full text-center space-y-8 border border-slate-100"><div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner"><ClockIcon size={48} className="animate-pulse" /></div><h2 className="text-3xl font-black text-slate-800">Onay Bekleniyor</h2><p className="text-slate-500 font-medium">Hesabınız ({userProfile.fullName}) yönetici tarafından inceleniyor.</p><button onClick={() => signOut(auth)} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl uppercase text-xs tracking-widest border border-slate-100 transition-colors">Geri Dön</button></div></div>;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} userProfile={userProfile}>
      {alertInfo && <CustomAlert message={alertInfo.message} type={alertInfo.type} onClose={() => setAlertInfo(null)} />}
      {confirmConfig && <CustomConfirmModal title={confirmConfig.title} message={confirmConfig.message} onConfirm={confirmConfig.onConfirm} onCancel={() => setConfirmConfig(null)} confirmText={confirmConfig.confirmText} />}
      {reportRecord && <ReportView record={reportRecord} userProfile={userProfile} onClose={() => setReportRecord(null)} />}
      {activeTab === 'dashboard' && <Dashboard records={records} onQuickAction={setActiveTab} userProfile={userProfile} />}
      {activeTab === 'portfolio' && <GenericModule title="Portföy Bankası" type={RecordType.PORTFOLIO} records={records} onAdd={addRecord} onUpdate={updateRecord} userProfile={userProfile} onDeleteRequest={deleteRecord} icon={HomeIcon} themeColor="#0054A6" showSmartImport={true} />}
      {activeTab === 'demand' && <GenericModule title="Talep Havuzu" type={RecordType.DEMAND} records={records} onAdd={addRecord} onUpdate={updateRecord} userProfile={userProfile} onDeleteRequest={deleteRecord} icon={TargetIcon} themeColor="#E11B22" showSmartImport={false} />}
      {activeTab === 'valuation' && <GenericModule title="Emsal/Değerleme" type={RecordType.VALUATION} records={records} onAdd={addRecord} onUpdate={updateRecord} userProfile={userProfile} onDeleteRequest={deleteRecord} onReportRequest={setReportRecord} icon={HistoryIconLucide} themeColor="#10b981" showSmartImport={false} />}
      {activeTab === 'tapu-analysis' && <TapuAnalysisView />}
      {activeTab === 'member-management' && (userProfile?.isAdmin || userProfile?.role === 'Broker') && (
        <MemberManagement 
          userProfile={userProfile} 
          onAlert={(msg, type) => setAlertInfo({ message: msg, type: type })} 
          onConfirmRequest={(cfg) => setConfirmConfig(cfg)} 
        />
      )}
      <WhatsAppFab />
      <PWAInstallPrompt />
    </Layout>
  );
};

const PrivacyPolicyModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
    <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in duration-300">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50 rounded-t-[3rem]">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-emerald-600" size={28} />
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">KVKK Aydınlatma Metni</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kişisel Verilerin Korunması</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-white rounded-full transition-colors shadow-sm border border-transparent hover:border-slate-100"><XIcon size={24} /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-8">
        <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
          Re-data olarak, kişisel verilerinizin güvenliği ve gizliliği bizim için en öncelikli konudur. 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, veri sorumlusu sıfatıyla, profesyonel kullanıcılarımıza (Broker ve Gayrimenkul Danışmanları) ait verilerin hangi amaçla işleneceğini aşağıda açıklıyoruz.
        </p>

        <section className="space-y-4">
          <h4 className="text-sm font-black text-slate-800 uppercase border-l-4 border-emerald-500 pl-4">1. İŞLENEN KİŞİSEL VERİLERİZ</h4>
          <p className="text-xs font-medium text-slate-600 leading-relaxed">Re-data platformuna üye olduğunuzda ve sistemi kullandığınızda yalnızca şu verileriniz işlenmektedir:</p>
          <ul className="list-disc list-inside text-xs font-medium text-slate-600 space-y-2 ml-4">
            <li><span className="font-black">Kimlik ve İletişim Bilgileri:</span> Ad-Soyad, E-posta adresi, Telefon numarası.</li>
            <li><span className="font-black">Mesleki Bilgiler:</span> Bağlı bulunulan Gayrimenkul Ofisi/Franchise bilgisi.</li>
            <li><span className="font-black">İşlem Güvenliği Verileri:</span> IP adresi, giriş-çıkış kayıtları (Loglar), şifre bilgileri (şifrelenmiş halde).</li>
          </ul>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
            <p className="text-[11px] font-black text-amber-800 uppercase mb-1">Önemli Not:</p>
            <p className="text-[11px] font-bold text-amber-700 leading-tight">Re-data, gayrimenkul alıcı veya satıcılarına (son kullanıcılar) ait isim, telephone gibi kişisel verileri talep etmez ve işlemez. Sistemde tutulan emsal verileri mülk odaklı anonim verilerdir.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-sm font-black text-slate-800 uppercase border-l-4 border-emerald-500 pl-4">2. KİŞİSEL VERİLERİN İŞLENME AMAÇLARI</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <p className="text-[10px] font-black text-remax-blue uppercase mb-2">Sistem Erişimi</p>
               <p className="text-[11px] font-medium text-slate-500">Kullanıcı hesaplarının oluşturulması ve yetkilendirilmesi.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <p className="text-[10px] font-black text-remax-blue uppercase mb-2">Kurumsal Hafıza</p>
               <p className="text-[11px] font-medium text-slate-500">Sisteme girilen kayıtların takibi ve ofis içi koordinasyonun sağlanması.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <p className="text-[10px] font-black text-remax-blue uppercase mb-2">Hizmet Güvenliği</p>
               <p className="text-[11px] font-medium text-slate-500">Şüpheli işlemlerin tespiti ve veri güvenliğinin korunması.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <p className="text-[10px] font-black text-remax-blue uppercase mb-2">İletişim</p>
               <p className="text-[11px] font-medium text-slate-500">Teknik destek süreçleri ve abonelik bilgilendirmeleri.</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-sm font-black text-slate-800 uppercase border-l-4 border-emerald-500 pl-4">3. İŞLENEN VERİLERİN AKTARIMI</h4>
          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            Kişisel verileriniz, yasal yükümlülükler (mahkeme kararı, savcılık talebi vb.) haricinde hiçbir üçüncü şahıs, kurum veya kuruluşla paylaşılmaz. Verileriniz, sistemin teknik altyapısını sağlayan güvenli bulut sunucularında (Firebase/Google Cloud) şifrelenmiş olarak saklanır.
          </p>
        </section>

        <section className="space-y-4">
          <h4 className="text-sm font-black text-slate-800 uppercase border-l-4 border-emerald-500 pl-4">4. VERİ TOPLAMA YÖNTEMİ VE HUKUKİ SEBEP</h4>
          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            Verileriniz, platforma kayıt olmanız ve veri girişi yapmanız suretiyle tamamen dijital ortamda toplanmaktadır. İşleme faaliyetimiz, <span className="font-black">KVKK Madde 5/2-c (Sözleşmenin kurulması ve ifası)</span> ve <span className="font-black">5/2-f (Veri sorumlusunun meşru menfaati)</span> hukuki sebeplerine dayanmaktadır.
          </p>
        </section>

        <section className="space-y-4 pb-4">
          <h4 className="text-sm font-black text-slate-800 uppercase border-l-4 border-emerald-500 pl-4">5. VERİ SAHİBİ OLARAK HAKLARINIZ</h4>
          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            KVKK Madde 11 uyarınca; verilerinizin işlenip işlenmediğini öğrenme, yanlış işlenmişse düzeltilmesini isteme veya verilerinizin silinmesini talep etme haklarına sahipsiniz. Bu taleplerinizi <span className="font-black text-remax-blue">destek@redata.tr</span> adresi üzerinden bize iletebilirsiniz.
          </p>
        </section>
      </div>

      <div className="p-8 border-t border-slate-100 text-center bg-white rounded-b-[3rem]">
        <button onClick={onClose} className="w-full md:w-1/2 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all">Anladım, Kabul Ediyorum</button>
      </div>
    </div>
  </div>
);

const AgreementModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
    <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in duration-300">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-[3rem]">
        <div className="flex items-center gap-3">
          <FileCheck2 className="text-remax-blue" size={28} />
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Hizmet ve Üyelik Sözleşmesi</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ReData Kullanım Koşulları</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-white rounded-full transition-colors shadow-sm border border-transparent hover:border-slate-100"><XIcon size={24} /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-8">
        <section className="space-y-4">
          <h4 className="text-sm font-black text-slate-800 uppercase border-l-4 border-remax-blue pl-4">1. TARAFLAR</h4>
          <p className="text-xs font-medium text-slate-600 leading-relaxed italic">İşbu sözleşme, bir tarafta Re-data Yazılım ve Gayrimenkul Teknolojileri (Bundan sonra “Re-data” olarak anılacaktır) ile diğer tarafta bu sözleşmeyi onaylayan Gayrimenkul Ofisi/Broker (Bundan sonra “Üye” olarak anılacaktır) arasında aşağıda belirtilen şartlar dahilinde akdedilmiştir.</p>
        </section>

        <section className="space-y-4">
          <h4 className="text-sm font-black text-slate-800 uppercase border-l-4 border-remax-blue pl-4">2. SÖZLEŞMENİN KONUSU</h4>
          <p className="text-xs font-medium text-slate-600 leading-relaxed">Sözleşmenin konusu; Üye’nin, Re-data tarafından sunulan mülk değerleme havuzu, talep yönetim sistemi, AI tabanlı KML analiz raporlama ve kurumsal hafıza oluşturma platformundan faydalanma şartlarının ve tarafların karşılıklı hak ve yükümlülüklerinin belirlenmesidir.</p>
        </section>

        <section className="space-y-4">
          <h4 className="text-sm font-black text-slate-800 uppercase border-l-4 border-remax-blue pl-4">3. ÜYELİK VE TAAHHÜT ŞARTLARI</h4>
          <div className="space-y-3 pl-4 border-l border-slate-100">
            <p className="text-xs font-medium text-slate-600"><span className="font-black text-remax-blue">3.1. Taahhüt Süresi:</span> Üye, işbu sözleşmeyi onaylayarak hizmetten 12 (on iki) ay boyunca kesintisiz faydalanacağını taahhüt eder.</p>
            <p className="text-xs font-medium text-slate-600"><span className="font-black text-remax-blue">3.2. Ödeme Planı:</span> Üyelik bedeli ve ödeme koşulları, Üye’nin kayıt esnasında seçtiği güncel teklif/paket üzerinden belirlenir.</p>
            <p className="text-xs font-medium text-slate-600"><span className="font-black text-remax-blue">3.3. Tahsilat:</span> Ödemeler, Üye’nin sisteme tanımladığı kredi kartından, her ayın üyelik başlangıç gününde otomatik olarak (Subscription/Tekrarlayan Ödeme) tahsil edilecektir.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-sm font-black text-slate-800 uppercase border-l-4 border-remax-red pl-4">4. VERİ GİZLİLİĞİ VE GÜVENLİĞİ (KURUMSAL HAFIZA GÜVENCESİ)</h4>
          <div className="space-y-3 pl-4 border-l border-slate-100">
            <p className="text-xs font-medium text-slate-600"><span className="font-black text-remax-red">4.1. Veri Mülkiyeti:</span> Üye tarafından sisteme girilen tüm emsal değerleme ve talep verileri münhasıran Üye’ye aittir. Re-data, bu verileri "Kurumsal Hafıza" konsepti altında sadece Üye’nin ve Üye'nin yetkilendirdiği danışmanların erişimine sunar.</p>
            <p className="text-xs font-medium text-slate-600"><span className="font-black text-remax-red">4.2. Müşteri Mahremiyeti:</span> Re-data, işleyişi gereği son kullanıcılara (alıcı/satıcı) ait hiçbir kişisel veri (isim, telefon, T.C. Kimlik No vb.) talep etmez ve saklamaz. Sistem sadece mülk niteliklerini ve veriyi giren danışman bilgisini tutar.</p>
            <p className="text-xs font-medium text-slate-600"><span className="font-black text-remax-red">4.3. İzolasyon:</span> Her ofisin verisi kendi dijital kasasında şifrelenmiş olarak tutulur. Re-data, Üye’nin verilerini rakip ofislerle veya üçüncü şahıslarla paylaşmayacağını taahhüt eder.</p>
            <p className="text-xs font-medium text-slate-600"><span className="font-black text-remax-red">4.4. Veri İadesi Hakkı:</span> Sözleşme süresi sonunda üyeliğin yenilenmemesi durumunda, Üye talebi doğrultusunda kendi girmiş olduğu verileri dijital formatta (Excel/CSV) dışa aktarma hakkına sahiptir.</p>
            <p className="text-xs font-medium text-slate-600"><span className="font-black text-remax-red">4.5. Kullanıcı Verilerinin İşlenmesi (KVKK):</span> Üye, sistemi kullanan Danışmanların ve Brokerların; isim, soyisim, telefon ve e-posta gibi bilgilerinin; hizmetin sunulabilmesi, hesap güvenliğinin sağlanması ve kurumsal hafıza kayıtlarında veriyi giren kişinin tespiti amacıyla KVKK’ya uygun olarak işlendiğini kabul eder. Re-data, bu verileri yalnızca platformun işleyişi ve üyelik yönetimi amacıyla kullanacağını taahhüt eder.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-sm font-black text-slate-800 uppercase border-l-4 border-amber-500 pl-4">5. AI (YAPAY ZEKA) VE ANALİZ RAPORLARI</h4>
          <div className="space-y-3 pl-4 border-l border-slate-100 text-amber-900 bg-amber-50/30 p-4 rounded-2xl">
            <p className="text-xs font-medium leading-relaxed"><span className="font-black">5.1. Sorumluluk Reddi:</span> Re-data tarafından sunulan KML analiz raporları ve AI tabanlı değerlendirmeler teorik veriler içerir. Bu raporlar yatırım tavsiyesi niteliğinde değildir. Re-data, bu raporların ticari kararlarda kullanımından doğabilecek sonuçlardan sorumlu tutulamaz.</p>
            <p className="text-xs font-medium leading-relaxed"><span className="font-black">5.2. Doğrulama:</span> Üye, en doğru analiz için AI raporlarını ofis içi güncel emsal havuzu ve saha tecrübesiyle teyit etmesi gerektiğini kabul eder.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h4 className="text-sm font-black text-slate-800 uppercase border-l-4 border-remax-blue pl-4">6. FESİH ŞARTLARI</h4>
          <p className="text-xs font-medium text-slate-600 leading-relaxed"><span className="font-black text-remax-blue">6.1. Erken Fesih:</span> Üye, 12 aylık taahhüt süresi dolmadan üyeliğini iptal etmek isterse, seçtiği paket kapsamında belirtilen erken ayrılma koşullarını ve taahhüt şartlarını yerine getirmeyi kabul eder.</p>
        </section>

        <section className="space-y-4 pb-4">
          <h4 className="text-sm font-black text-slate-800 uppercase border-l-4 border-remax-blue pl-4">7. YÜRÜRLÜK VE ONAY</h4>
          <p className="text-xs font-medium text-slate-600 leading-relaxed font-black">Üye, redata.tr üzerinden kayıt olup "Üyelik Sözleşmesini Okudum ve Onaylıyorum" kutucuğunu işaretlediği andan itibaren işbu sözleşmenin tüm şartlarını kabul etmiş sayılır.</p>
        </section>
      </div>

      <div className="p-8 border-t border-slate-100 text-center bg-white rounded-b-[3rem]">
        <button onClick={onClose} className="w-full md:w-1/2 py-5 bg-remax-blue text-white rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-blue-800 transition-all">Anladım, Kapat</button>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'Broker' | 'Danışman'>('Danışman');
  
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    if (authMode === 'register' && !agreedToTerms) {
      setError("Lütfen üyelik sözleşmesini ve aydınlatma metnini onaylayın.");
      return;
    }

    setLoading(true); setError(null);
    try {
      if (authMode === 'login') { await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password); } 
      else { 
        const res = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password); 
        await setDoc(doc(db, "users", res.user.uid), { 
          uid: res.user.uid, 
          fullName, 
          officeName, 
          phone, 
          email: email.trim().toLowerCase(), 
          role, 
          isAdmin: false, 
          isApproved: false, 
          agreedToTerms: true,
          termsAgreedAt: Timestamp.now(),
          createdAt: Timestamp.now() 
        }); 
      }
    } catch (err: any) { 
      setError("Hata: Bilgileri kontrol edin veya bu e-posta zaten kullanımda olabilir."); 
    } 
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      {showTermsModal && <AgreementModal onClose={() => setShowTermsModal(false)} />}
      {showPrivacyModal && <PrivacyPolicyModal onClose={() => setShowPrivacyModal(false)} />}
      
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0054A6]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-[#E11B22]/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <header className="px-8 lg:px-24 h-24 lg:h-32 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <ReDataLogo className="w-12 h-12 lg:w-16 lg:h-16" />
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-[#0054A6] leading-none">Re<span className="text-[#E11B22]">Data</span></h1>
            <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Corporate Memory</p>
          </div>
        </div>
        {!showAuth && (
          <div className="flex items-center gap-4">
            <button onClick={() => { setShowAuth(true); setAuthMode('login'); }} className="text-slate-600 px-6 py-2 rounded-xl font-black text-xs uppercase hover:text-remax-blue transition-colors">Giriş</button>
            <button onClick={() => { setShowAuth(true); setAuthMode('register'); }} className="bg-remax-blue text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-blue-800 transition-all">Sisteme Katıl</button>
          </div>
        )}
      </header>

      <main className="flex-1 px-8 lg:px-24 py-10 relative z-10 overflow-y-auto custom-scrollbar">
        {!showAuth ? (
          <div className="max-w-7xl mx-auto space-y-20 animate-in fade-in duration-1000 pb-20">
            {/* Motto Section */}
            <div className="text-center space-y-6">
              <span className="inline-block px-4 py-2 bg-blue-50 text-remax-blue text-[10px] font-black uppercase tracking-[0.3em] rounded-full border border-blue-100">Gayrimenkulde Dijital Dönüşüm</span>
              <h2 className="text-5xl lg:text-7xl font-black text-slate-800 tracking-tighter leading-tight max-w-4xl mx-auto">
                "En Değerli Veri, <br/> 
                <span className="text-remax-blue italic">Kurumsal Hafızanızdır.</span>"
              </h2>
              <div className="h-1.5 w-24 bg-remax-red mx-auto rounded-full"></div>
            </div>

            {/* ReData Nedir? */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-50 text-remax-blue rounded-xl flex items-center justify-center"><ShieldCheck size={24} /></div>
                   <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">ReData Nedir?</h3>
                </div>
                <p className="text-lg font-medium text-slate-600 leading-relaxed italic border-l-4 border-remax-blue pl-6">
                  ReData; bir gayrimenkul ofisinin en büyük varlığı olan "bilgiyi" korumak, işlemek ve kazanca dönüştürmek için tasarlanmış akıllı bir veri ekosistemidir. Geleneksel dosyalama sistemlerinin aksine ReData; veriyi sadece saklayan bir depo değil, ofisinizle birlikte büyüyen, öğrenen ve yaşayan bir organizmadır.
                </p>
              </div>
              <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 relative group">
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-remax-red rounded-full flex items-center justify-center text-white shadow-xl animate-bounce">
                  <ZapIcon size={32} />
                </div>
                <div className="space-y-4">
                  <div className="h-4 w-2/3 bg-slate-50 rounded-full"></div>
                  <div className="h-4 w-full bg-slate-50 rounded-full"></div>
                  <div className="h-4 w-1/2 bg-slate-50 rounded-full"></div>
                  <div className="pt-4 grid grid-cols-3 gap-2">
                    <div className="h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-remax-blue"><LineChart size={24}/></div>
                    <div className="h-20 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500"><DatabaseZap size={24}/></div>
                    <div className="h-20 bg-red-50 rounded-2xl flex items-center justify-center text-remax-red"><BrainCircuit size={24}/></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Neden ReData? */}
            <div className="space-y-12">
               <div className="text-center">
                 <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Neden ReData?</h3>
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">Geleceğin Ofis Yönetimi</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl hover:-translate-y-2 transition-all duration-300">
                    <div className="w-14 h-14 bg-blue-50 text-remax-blue rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-50"><MemberIcon size={28}/></div>
                    <h4 className="text-lg font-black text-slate-800 mb-3 uppercase tracking-tight">Kişilere Değil, Sisteme Bağlı Hafıza</h4>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed italic">Gayrimenkul dünyasında bilgi uçucudur. ReData, danışmanların saha tecrübesini ve piyasa bilgisini kurumsal bir hafızaya dönüştürür. Danışmanlar değişse bile ofisinizin uzmanlığı ve veri gücü korunmaya devam eder.</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl hover:-translate-y-2 transition-all duration-300">
                    <div className="w-14 h-14 bg-red-50 text-remax-red rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-50"><BrainCircuit size={28}/></div>
                    <h4 className="text-lg font-black text-slate-800 mb-3 uppercase tracking-tight">Yaşayan ve Öğrenen Bir Sistem</h4>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed italic">Sisteme girilen her yeni emsal ve her yeni talep, ReData'nın sinir ağlarını besler. Yeni bir portföy aldığınızda, ofis arkadaşlarınızın elindeki güncel verilere saniyeler içinde ulaşarak "ortak işlem" (share) fırsatlarını görmenizi sağlar.</p>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl hover:-translate-y-2 transition-all duration-300">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-50"><LineChart size={28}/></div>
                    <h4 className="text-lg font-black text-slate-800 mb-3 uppercase tracking-tight">Gerçek Veriyle Kesin Sonuç</h4>
                    <p className="text-sm font-bold text-slate-500 leading-relaxed italic">Bölgenizdeki en doğru fiyatlama, dışarıdaki ilan sitelerinden değil; kendi ofisinizin gerçek satış ve ekspertiz verilerinden gelir. ReData, bu "gizli hazineyi" görünür kılarak pazarlık masasında sarsılmaz bir argüman sunar.</p>
                  </div>
               </div>
            </div>

            {/* Vizyonumuz */}
            <div className="bg-[#0054A6] p-12 lg:p-20 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
               <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full -mb-32 -mr-32"></div>
               <div className="relative z-10 max-w-4xl">
                 <h3 className="text-3xl lg:text-5xl font-black mb-8 uppercase tracking-tighter">Vizyonumuz</h3>
                 <p className="text-xl lg:text-3xl font-medium leading-relaxed italic opacity-90">
                   "Ofis içindeki her bir veriyi, kurumun geleceğini inşa eden birer yapı taşına dönüştürmek. Bilginin paylaşıldıkça güce, verinin ise işlendikçe hıza dönüştüğü bir gayrimenkul kültürü yaratmak."
                 </p>
               </div>
            </div>

            <div className="flex justify-center pt-10">
               <button onClick={() => { setShowAuth(true); setAuthMode('register'); }} className="bg-remax-red text-white px-12 py-5 rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
                 Sisteme Şimdi Katıl <ChevronRightIcon size={24}/>
               </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 w-full max-w-lg mx-auto animate-in zoom-in duration-500 relative mt-10">
            <button onClick={() => { setShowAuth(false); setError(null); }} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600"><XIcon size={24} /></button>
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-800 uppercase">{authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase">Ofis Bulutuna Bağlan</p>
              </div>
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(null); }} className="text-[10px] font-black text-remax-blue underline uppercase">{authMode === 'login' ? 'Yeni Hesap' : 'Geri Dön'}</button>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="İsim Soyisim" className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 font-bold focus:border-remax-blue" required />
                  <input type="text" value={officeName} onChange={e => setOfficeName(e.target.value)} placeholder="Ofis Adı" className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 font-bold focus:border-remax-blue" required />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon" className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 font-bold focus:border-remax-blue" required />
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setRole('Broker')} className={`py-3 rounded-xl text-[10px] font-black transition-all ${role === 'Broker' ? 'bg-remax-blue text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Broker</button>
                    <button type="button" onClick={() => setRole('Danışman')} className={`py-3 rounded-xl text-[10px] font-black transition-all ${role === 'Danışman' ? 'bg-remax-blue text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>Danışman</button>
                  </div>
                </>
              )}
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-posta" className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 font-bold focus:border-remax-blue" required />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Şifre" className="w-full bg-slate-50 p-4 rounded-2xl outline-none border border-slate-100 font-bold focus:border-remax-blue" required />
              
              {authMode === 'register' && (
                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 mt-2 space-y-4">
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Sözleşme Onayı</p>
                    <button 
                      type="button"
                      onClick={() => setAgreedToTerms(!agreedToTerms)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${agreedToTerms ? 'bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-100' : 'bg-white border-slate-200 grayscale hover:grayscale-0 hover:border-remax-blue'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${agreedToTerms ? 'bg-emerald-500 text-white animate-in zoom-in rotate-0' : 'bg-slate-100 text-slate-300'}`}>
                        {agreedToTerms ? <Check size={20} strokeWidth={4} /> : <ShieldQuestion size={20} />}
                      </div>
                      <div>
                        <p className={`text-xs font-black uppercase tracking-tight leading-none mb-1 ${agreedToTerms ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {agreedToTerms ? 'Onaylandı' : 'Onay Bekliyor'}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 leading-tight">Sözleşme ve aydınlatma metnini kabul etmek için dokunun.</p>
                      </div>
                    </button>
                  </div>

                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed px-1">
                    <button type="button" onClick={() => setShowTermsModal(true)} className="text-remax-blue underline hover:text-blue-800 mr-1">Üyelik Sözleşmesini</button> 
                    ve <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-remax-blue underline hover:text-blue-800 mx-1">Aydınlatma Metnini</button>
                    okudum.
                  </p>
                </div>
              )}

              {error && <p className="text-[10px] font-bold text-remax-red italic">{error}</p>}
              
              <button 
                type="submit" 
                disabled={loading || (authMode === 'register' && !agreedToTerms)} 
                className="w-full bg-remax-blue text-white py-5 rounded-2xl font-black shadow-xl hover:bg-blue-800 disabled:opacity-50 disabled:grayscale transition-all uppercase text-xs tracking-widest mt-6 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2Icon className="animate-spin" /> : authMode === 'login' ? 'Oturum Aç' : 'Kaydı Tamamla'}
              </button>
            </form>
          </div>
        )}
      </main>

      <footer className="px-8 lg:px-24 py-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center bg-white/50 backdrop-blur-sm z-50 gap-6">
        <div className="flex items-center gap-3">
          <ReDataLogo className="w-8 h-8" />
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© 2026 ReData • Kurumsal Ofis Hafızası</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">İletişim: 0 549 784 95 76</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <a href="https://www.redata.tr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-remax-blue font-black text-[10px] uppercase tracking-widest hover:text-blue-800 transition-colors">
            <Globe size={14} /> www.redata.tr
          </a>
        </div>
      </footer>
      <WhatsAppFab />
    </div>
  );
};

export default App;