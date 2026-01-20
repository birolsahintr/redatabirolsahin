
import React, { useState } from 'react';
import { ArrowLeft, Edit3, X, Trash2, Plus, Download, Layout, Table as TableIcon, Settings2, ShoppingBag, Phone, Mail, Clock, Building2 } from 'lucide-react';
import { RealEstateRecord } from '../types';

interface ComparisonItem {
  id: string | number;
  area: number;
  price: number;
  sqm: number;
  days: number;
}

interface ReportViewProps {
  record: RealEstateRecord;
  userProfile: any;
  onClose: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ record, userProfile, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Rapor Değişkenleri
  const [reportOfficeName, setReportOfficeName] = useState(userProfile?.officeName || 'OFİS ADI');
  const [reportPrice, setReportPrice] = useState(record.price);
  const [reportArea, setReportArea] = useState(record.area || 0);

  const [reportZoning, setReportZoning] = useState(record.zoningRate ? `Emsal: ${record.zoningRate}` : 'Belirtilmedi');
  const [reportTransportation, setReportTransportation] = useState('Kadastral Yola Cephe');
  const [reportNature, setReportNature] = useState(record.category === 'Arsa' ? 'Tarla / Arazi' : 'Mülkiyet');
  
  const [newListingData, setNewListingData] = useState<ComparisonItem[]>([
    { id: '1', area: Math.round((record.area || 100) * 1.1), price: Math.round(record.price * 0.95), sqm: Math.round((record.price * 0.95) / ((record.area || 100) * 1.1)), days: 12 },
    { id: '2', area: Math.round((record.area || 100) * 0.9), price: Math.round(record.price * 1.05), sqm: Math.round((record.price * 1.05) / ((record.area || 100) * 0.9)), days: 5 }
  ]);

  const [tiredListingData, setTiredListingData] = useState<ComparisonItem[]>([
    { id: '3', area: Math.round((record.area || 100) * 0.85), price: Math.round(record.price * 1.2), sqm: Math.round((record.price * 1.2) / ((record.area || 100) * 0.85)), days: 120 },
    { id: '4', area: Math.round((record.area || 100) * 1.25), price: Math.round(reportPrice * 1.15), sqm: Math.round((reportPrice * 1.15) / ((record.area || 100) * 1.25)), days: 95 }
  ]);

  const [removedListingData, setRemovedListingData] = useState<ComparisonItem[]>([
    { id: '5', area: Math.round((record.area || 100) * 1.0), price: Math.round(record.price * 0.9), sqm: Math.round((record.price * 0.9) / (record.area || 100)), days: 45 }
  ]);

  const currentSqm = reportArea > 0 ? Math.round(reportPrice / reportArea) : 0;

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    
    const element = document.getElementById('report-content');
    if (!element) {
      setIsGenerating(false);
      return;
    }

    window.scrollTo(0, 0);

    const opt = {
      margin: 0,
      filename: `Pazar_Analizi_${record.district}_${record.block || 'Ada'}_${record.parcel || 'Parsel'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        allowTaint: false,
        logging: false,
        width: 800,
        windowWidth: 800,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateEmsal = (type: 'new' | 'tired' | 'removed', index: number, field: keyof ComparisonItem, value: number) => {
    let setter;
    switch(type) {
        case 'new': setter = setNewListingData; break;
        case 'tired': setter = setTiredListingData; break;
        case 'removed': setter = setRemovedListingData; break;
    }
    
    setter(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'price' || field === 'area') {
        item.sqm = item.area > 0 ? Math.round(item.price / item.area) : 0;
      }
      updated[index] = item;
      return updated;
    });
  };

  const addEmsal = (type: 'new' | 'tired' | 'removed') => {
    let setter;
    switch(type) {
        case 'new': setter = setNewListingData; break;
        case 'tired': setter = setTiredListingData; break;
        case 'removed': setter = setRemovedListingData; break;
    }
    setter(prev => [...prev, { id: Date.now(), area: 0, price: 0, sqm: 0, days: 0 }]);
  };

  const deleteEmsal = (type: 'new' | 'tired' | 'removed', index: number) => {
    let setter;
    switch(type) {
        case 'new': setter = setNewListingData; break;
        case 'tired': setter = setTiredListingData; break;
        case 'removed': setter = setRemovedListingData; break;
    }
    setter(prev => prev.filter((_, i) => i !== index));
  };

  // Ofis ismini kurumsal renklerle render eden yardımcı fonksiyon
  const renderOfficeName = () => {
    const office = reportOfficeName || 'OFİS ADI';
    const upperOffice = office.toUpperCase();
    
    if (upperOffice.startsWith('RE/MAX')) {
      const suffix = upperOffice.replace('RE/MAX', '').trim();
      return (
        <div className="text-6xl font-black tracking-tighter mb-2">
          RE/MAX <span className="text-[#E41E26]">{suffix}</span>
        </div>
      );
    }
    
    return (
      <div className="text-6xl font-black tracking-tighter mb-2">
        {upperOffice}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-100 overflow-hidden font-sans text-slate-800 flex">
      <style>{`
        #report-content {
          width: 800px; 
          margin: 0 auto;
        }
        @media print {
          .no-print { display: none; }
        }
        .pdf-page-break {
          page-break-before: always;
        }
      `}</style>

      <div id="report-container" className={`flex-1 overflow-y-auto bg-slate-200 transition-all duration-500 ${isEditing ? 'mr-[450px]' : ''} custom-scrollbar`}>
        
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-[210] p-4 border-b flex justify-between items-center shadow-sm no-print">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="flex items-center gap-2 text-slate-500 hover:text-[#0054A6] font-bold px-4 py-2 rounded-xl transition-all">
              <ArrowLeft size={20} /> Geri
            </button>
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black transition-all shadow-sm ${isEditing ? 'bg-remax-red text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {isEditing ? <><X size={18} /> Düzenleyiciyi Kapat</> : <><Edit3 size={18} /> Raporu Düzenle</>}
            </button>
          </div>
          
          <button 
            onClick={handleDownloadPDF} 
            disabled={isGenerating}
            className="flex items-center gap-2 bg-[#0054A6] text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-blue-800 transition-all text-xs uppercase tracking-[0.2em] disabled:opacity-50"
          >
            {isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Download size={18} /> PDF Olarak Kaydet</>}
          </button>
        </div>

        <div id="report-content" className="bg-white shadow-2xl my-8 overflow-hidden">
          {/* COVER PAGE */}
          <section className="min-h-[1122px] flex flex-col justify-center items-center text-center bg-[#002F6C] text-white p-12 relative overflow-hidden" style={{ minHeight: '1122px' }}>
            <div className="mb-12">
              {renderOfficeName()}
            </div>
            <h1 className="text-7xl font-black mb-12 uppercase tracking-tighter leading-tight">PAZAR ANALİZİ<br/>RAPORU</h1>
            <div className="bg-white text-[#002F6C] rounded-[3rem] p-12 shadow-2xl w-full max-w-2xl border-b-[12px] border-[#E41E26]">
              <p className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Mülk Bilgisi</p>
              <p className="text-4xl font-black mb-10 leading-tight">{record.neighborhood}, {record.district}, {record.city}</p>
              <div className="grid grid-cols-2 gap-12 border-t border-slate-100 pt-10">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Ada / Parsel</p>
                  <p className="text-5xl font-black text-[#E41E26]">{record.block || '-'} / {record.parcel || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Tarih</p>
                  <p className="text-3xl font-bold text-slate-600">{new Date().toLocaleDateString('tr-TR')}</p>
                </div>
              </div>
            </div>
            <div className="mt-16 space-y-4">
              <div>
                <p className="text-5xl font-black">{userProfile?.fullName || 'Danışman'}</p>
                <p className="text-xl opacity-60 mt-1 font-bold tracking-widest uppercase">{reportOfficeName || 'OFİS ADI'}</p>
              </div>
              <div className="flex flex-col items-center gap-2 pt-4 border-t border-white/10 max-w-xs mx-auto">
                {userProfile?.phone && (
                  <div className="flex items-center gap-2 text-lg font-semibold opacity-80">
                    <Phone size={18} className="text-[#E41E26]" />
                    <span>{userProfile.phone}</span>
                  </div>
                )}
                {userProfile?.email && (
                  <div className="flex items-center gap-2 text-sm font-medium opacity-60 italic">
                    <Mail size={16} className="text-[#E41E26]" />
                    <span>{userProfile.email}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* PARAMETERS PAGE */}
          <section className="min-h-[1122px] py-24 px-16 bg-white pdf-page-break" style={{ minHeight: '1122px' }}>
            <h2 className="text-4xl font-black text-[#002F6C] mb-16 flex items-center gap-4">
               Mülk Parametreleri
            </h2>
            <div className="grid grid-cols-1 gap-12">
              <div className="bg-[#002F6C] text-white p-16 rounded-[3.5rem] flex flex-col justify-center border-b-8 border-[#E41E26] shadow-xl">
                <p className="text-sm font-black uppercase opacity-50 mb-4 tracking-widest">Hesaplanan Alan</p>
                <p className="text-9xl font-black leading-none">{reportArea} <span className="text-4xl opacity-40 font-bold ml-2">m²</span></p>
              </div>
              <div className="bg-slate-50 p-14 rounded-[3.5rem] grid grid-cols-2 gap-12 shadow-inner border border-slate-100">
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">İmar Durumu</p>
                  <p className="text-2xl font-black text-slate-800">{reportZoning}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ulaşım</p>
                  <p className="text-2xl font-black text-slate-800">{reportTransportation}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Niteliği</p>
                  <p className="text-2xl font-black text-slate-800">{reportNature}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Konum</p>
                  <p className="text-2xl font-black text-slate-800">{record.district}</p>
                </div>
              </div>
            </div>
          </section>

          {/* TABLES PAGE */}
          <section className="min-h-[1122px] py-24 px-16 bg-slate-50 pdf-page-break" style={{ minHeight: '1122px' }}>
             <div className="space-y-20">
               <div>
                  <h3 className="text-2xl font-black text-[#002F6C] mb-8 border-l-8 border-[#002F6C] pl-6">Aktif İlanlar (Yeni)</h3>
                  <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-lg">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-[#002F6C] text-white text-[10px] uppercase font-black">
                        <tr><th className="p-6">Kod</th><th className="p-6">m²</th><th className="p-6">Fiyat</th><th className="p-6">₺/m²</th><th className="p-6">GÜN</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold">
                        {newListingData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-6">#0{idx+1}</td>
                            <td className="p-6">{item.area}</td>
                            <td className="p-6">{item.price.toLocaleString()} ₺</td>
                            <td className="p-6 text-[#E41E26] font-black">{item.sqm.toLocaleString()} ₺</td>
                            <td className="p-6">{item.days}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
               <div>
                  <h3 className="text-2xl font-black text-slate-400 mb-8 border-l-8 border-slate-300 pl-6">Eski / Yorgun İlanlar</h3>
                  <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 opacity-80 shadow-md">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-500 text-white text-[10px] uppercase font-black">
                        <tr><th className="p-6">Kod</th><th className="p-6">m²</th><th className="p-6">Fiyat</th><th className="p-6">₺/m²</th><th className="p-6">GÜN</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-slate-500">
                        {tiredListingData.map((item, idx) => (
                          <tr key={idx}><td className="p-6">#0{idx+1}</td><td className="p-6">{item.area}</td><td className="p-6">{item.price.toLocaleString()} ₺</td><td className="p-6">{item.sqm.toLocaleString()} ₺</td><td className="p-6">{item.days}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
               <div>
                  <h3 className="text-2xl font-black text-emerald-700/60 mb-8 border-l-8 border-emerald-300 pl-6">Kaldırılan / Satılan İlanlar</h3>
                  <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 opacity-70 shadow-md">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-emerald-700 text-white text-[10px] uppercase font-black">
                        <tr><th className="p-6">Kod</th><th className="p-6">m²</th><th className="p-6">Fiyat</th><th className="p-6">₺/m²</th><th className="p-6">GÜN</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold text-emerald-900/70">
                        {removedListingData.map((item, idx) => (
                          <tr key={idx}><td className="p-6">#S0{idx+1}</td><td className="p-6">{item.area}</td><td className="p-6">{item.price.toLocaleString()} ₺</td><td className="p-6">{item.sqm.toLocaleString()} ₺</td><td className="p-6">{item.days}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
             </div>
          </section>

          {/* FINAL VALUATION PAGE */}
          <section className="min-h-[1122px] py-32 px-16 bg-[#002F6C] text-white text-center flex flex-col justify-center pdf-page-break" style={{ minHeight: '1122px' }}>
             <div className="bg-white text-[#002F6C] p-24 rounded-[4rem] shadow-2xl relative inline-block w-full">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E41E26] text-white px-12 py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-lg">ÖNERİLEN PAZAR DEĞERİ</div>
                <p className="text-8xl font-black text-[#E41E26] tracking-tighter mb-6 leading-none">{reportPrice.toLocaleString()} ₺</p>
                <p className="text-4xl font-bold text-slate-400">{currentSqm.toLocaleString()} ₺/m²</p>
             </div>
             <div className="mt-20 opacity-30 px-10">
               <p className="text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed">
                 Bu rapor, mülkünüzün satışına uygun en iyi fiyatlandırma stratejisini sağlamak amacıyla tüm piyasa ve karşılaştırılabilir ilanlar analiz edilerek dikkatle hazırlanmıştır.
               </p>
             </div>
          </section>
        </div>
      </div>

      {/* EDITOR SIDEBAR */}
      <div className={`fixed top-0 right-0 h-full w-[450px] bg-white shadow-2xl z-[250] border-l border-slate-100 transition-transform duration-500 flex flex-col ${isEditing ? 'translate-x-0' : 'translate-x-full'} no-print`}>
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <div>
             <h3 className="text-xl font-black text-slate-800">Rapor Düzenleyici</h3>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verileri Gerçek Zamanlı Güncelleyin</p>
           </div>
           <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
           
           <section className="space-y-4">
              <h4 className="text-xs font-black text-remax-blue uppercase tracking-widest flex items-center gap-2">
                <Building2 size={16} /> Ofis Bilgileri
              </h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">OFİS ADI</label>
                  <input 
                    type="text" 
                    value={reportOfficeName} 
                    onChange={e => setReportOfficeName(e.target.value)} 
                    placeholder="Örn: OFİS ADI"
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold focus:border-remax-blue outline-none" 
                  />
                </div>
              </div>
           </section>

           <section className="space-y-4">
              <h4 className="text-xs font-black text-remax-blue uppercase tracking-widest flex items-center gap-2">
                <Settings2 size={16} /> Temel Değerler
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Önerilen Fiyat (₺)</label>
                  <input type="number" value={reportPrice} onChange={e => setReportPrice(Number(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold focus:border-remax-blue outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alan (m²)</label>
                  <input type="number" value={reportArea} onChange={e => setReportArea(Number(e.target.value))} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold focus:border-remax-blue outline-none" />
                </div>
              </div>
           </section>

           <section className="space-y-4">
              <h4 className="text-xs font-black text-remax-blue uppercase tracking-widest flex items-center gap-2">
                <Layout size={16} /> Mülk Parametreleri
              </h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">İmar Durumu</label>
                  <input type="text" value={reportZoning} onChange={e => setReportZoning(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold focus:border-remax-blue outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ulaşım / Yol</label>
                  <input type="text" value={reportTransportation} onChange={e => setReportTransportation(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold focus:border-remax-blue outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nitelik</label>
                  <input type="text" value={reportNature} onChange={e => setReportNature(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold focus:border-remax-blue outline-none" />
                </div>
              </div>
           </section>

           <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                  <TableIcon size={16} /> Aktif Emsaller
                </h4>
                <button onClick={() => addEmsal('new')} className="p-1 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><Plus size={16}/></button>
              </div>
              <div className="space-y-3">
                {newListingData.map((item, idx) => (
                  <div key={item.id} className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl relative group">
                    <button onClick={() => deleteEmsal('new', idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                    <div className="grid grid-cols-3 gap-2">
                       <input type="number" value={item.area} onChange={e => updateEmsal('new', idx, 'area', Number(e.target.value))} placeholder="m²" className="p-2 bg-white rounded-lg border border-emerald-100 text-[10px] font-bold" />
                       <input type="number" value={item.price} onChange={e => updateEmsal('new', idx, 'price', Number(e.target.value))} placeholder="Fiyat" className="p-2 bg-white rounded-lg border border-emerald-100 text-[10px] font-bold" />
                       <input type="number" value={item.days} onChange={e => updateEmsal('new', idx, 'days', Number(e.target.value))} placeholder="Gün" className="p-2 bg-white rounded-lg border border-emerald-100 text-[10px] font-bold" />
                    </div>
                  </div>
                ))}
              </div>
           </section>

           <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <TableIcon size={16} /> Yorgun Emsaller
                </h4>
                <button onClick={() => addEmsal('tired')} className="p-1 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200"><Plus size={16}/></button>
              </div>
              <div className="space-y-3">
                {tiredListingData.map((item, idx) => (
                  <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group">
                    <button onClick={() => deleteEmsal('tired', idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                    <div className="grid grid-cols-3 gap-2">
                       <input type="number" value={item.area} onChange={e => updateEmsal('tired', idx, 'area', Number(e.target.value))} placeholder="m²" className="p-2 bg-white rounded-lg border border-slate-200 text-[10px] font-bold" />
                       <input type="number" value={item.price} onChange={e => updateEmsal('tired', idx, 'price', Number(e.target.value))} placeholder="Fiyat" className="p-2 bg-white rounded-lg border border-slate-200 text-[10px] font-bold" />
                       <input type="number" value={item.days} onChange={e => updateEmsal('tired', idx, 'days', Number(e.target.value))} placeholder="Gün" className="p-2 bg-white rounded-lg border border-slate-200 text-[10px] font-bold" />
                    </div>
                  </div>
                ))}
              </div>
           </section>

           <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                  <ShoppingBag size={16} /> Kaldırılan / Satılan
                </h4>
                <button onClick={() => addEmsal('removed')} className="p-1 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100"><Plus size={16}/></button>
              </div>
              <div className="space-y-3">
                {removedListingData.map((item, idx) => (
                  <div key={item.id} className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl relative group">
                    <button onClick={() => deleteEmsal('removed', idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                    <div className="grid grid-cols-3 gap-2">
                       <input type="number" value={item.area} onChange={e => updateEmsal('removed', idx, 'area', Number(e.target.value))} placeholder="m²" className="p-2 bg-white rounded-lg border border-emerald-100 text-[10px] font-bold" />
                       <input type="number" value={item.price} onChange={e => updateEmsal('removed', idx, 'price', Number(e.target.value))} placeholder="Fiyat" className="p-2 bg-white rounded-lg border border-emerald-100 text-[10px] font-bold" />
                       <input type="number" value={item.days} onChange={e => updateEmsal('removed', idx, 'days', Number(e.target.value))} placeholder="Gün" className="p-2 bg-white rounded-lg border border-emerald-100 text-[10px] font-bold" />
                    </div>
                  </div>
                ))}
              </div>
           </section>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
           <button onClick={() => setIsEditing(false)} className="w-full bg-[#002F6C] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-blue-800 transition-all">
             Değişiklikleri Tamamla
           </button>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
