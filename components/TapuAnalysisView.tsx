
import React, { useState, useEffect, useRef } from 'react';
import { 
  FileUp, 
  Map as MapIcon, 
  Loader2, 
  AlertTriangle, 
  FileCode, 
  Layers,
  Hospital,
  School,
  Bus,
  Shapes,
  Star,
  Zap,
  TrendingUp,
  MapPin,
  ShieldCheck,
  Search,
  ChevronRight,
  ClipboardList,
  Check,
  Info,
  DollarSign,
  PieChart,
  Users
} from 'lucide-react';
import { analyzeKmlData } from '../services/geminiService';
import { TapuAnalysis, CATEGORY_TREE, PropertyCategory } from '../types';

declare const L: any;

const TapuAnalysisView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [kmlContent, setKmlContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  // Kategori Seçimleri
  const [category, setCategory] = useState<PropertyCategory | ''>('');
  const [subCategory, setSubCategory] = useState('');
  const [zoningRate, setZoningRate] = useState('');

  const [analysis, setAnalysis] = useState<TapuAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'street' | 'satellite'>('street');
  
  const mapRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const layersRef = useRef<{ street: any; satellite: any }>({ street: null, satellite: null });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const subCategories = category ? CATEGORY_TREE[category] || [] : [];
  
  // Emsal/İmar Seçenekleri güncellendi
  const imarOptions = ['YOK', '0.05', '0.10', '0.15', '0.20', '0.25', '0.30', '0.40', '0.50', '0.60', '0.65', '0.70', '0.75', '0.80', '0.85', '0.90', '0.95', '1.00', '1.20', '1.50', '2.00', '2.50', '3.00+'];

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: true
      }).setView([39.0, 35.0], 6);
      
      layersRef.current.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
        maxZoom: 19,
        updateWhenIdle: true,
        keepBuffer: 2
      });
      layersRef.current.satellite = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { 
        maxZoom: 20,
        updateWhenIdle: true,
        keepBuffer: 2
      });

      layersRef.current.street.addTo(mapRef.current);
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 300);
    }

    const handleResize = () => {
      mapRef.current?.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      if (mapMode === 'street') {
        mapRef.current.removeLayer(layersRef.current.satellite);
        mapRef.current.addLayer(layersRef.current.street);
      } else {
        mapRef.current.removeLayer(layersRef.current.street);
        mapRef.current.addLayer(layersRef.current.satellite);
      }
      mapRef.current.invalidateSize();
    }
  }, [mapMode]);

  useEffect(() => {
    if (analysis?.mapCoordinates && Array.isArray(analysis.mapCoordinates) && analysis.mapCoordinates.length > 2 && mapRef.current) {
      try {
        if (polygonRef.current) { mapRef.current.removeLayer(polygonRef.current); }
        const polyColor = mapMode === 'satellite' ? '#fbbf24' : '#0054A6';
        polygonRef.current = L.polygon(analysis.mapCoordinates, {
          color: polyColor,
          fillColor: polyColor,
          fillOpacity: 0.35,
          weight: 4,
          lineJoin: 'round'
        }).addTo(mapRef.current);

        mapRef.current.flyToBounds(polygonRef.current.getBounds(), {
          padding: [50, 50],
          duration: 2,
          maxZoom: 18
        });
      } catch (e) {
        console.error("Map Drawing Error:", e);
      }
    }
  }, [analysis, mapMode]);

  const handleKmlFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setKmlContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const startAnalysis = async () => {
    if (!kmlContent || !category || !subCategory) {
      setError('Lütfen dosya yükleyin ve tüm kategorileri seçin.');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    const result = await analyzeKmlData(kmlContent, category, subCategory, zoningRate);
    
    if (result && result.mapCoordinates) {
      setAnalysis(result);
    } else {
      setError('AI Analizi başarısız oldu veya dosya formatı uyumsuz.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sol Panel: Girişler */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl">
            <h3 className="text-sm font-black text-remax-blue mb-6 flex items-center gap-2 uppercase tracking-widest">
              <ShieldCheck size={18} /> Teknik Veri Girişi
            </h3>
            
            <div className="space-y-5">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">KML Dosyası</label>
                 <label className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 border-dashed transition-all group ${kmlContent ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:border-remax-blue'}`}>
                    <div className={`p-3 rounded-xl shadow-sm transition-colors ${kmlContent ? 'bg-emerald-500 text-white' : 'bg-white text-remax-blue group-hover:bg-remax-blue group-hover:text-white'}`}>
                      <FileCode size={20} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-black text-slate-700 truncate">{fileName || 'KML Yükle'}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{kmlContent ? 'Dosya Hazır' : 'Harita ve Parsel Çizimi'}</p>
                    </div>
                    <input type="file" className="hidden" accept=".kml" onChange={handleKmlFileChange} disabled={loading} />
                    {kmlContent ? <Check size={16} className="text-emerald-500" /> : <ChevronRight size={16} className="text-slate-300" />}
                 </label>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mülk Kategorisi</label>
                <select 
                  value={category} 
                  onChange={(e) => { setCategory(e.target.value as PropertyCategory); setSubCategory(''); }} 
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:border-remax-blue font-bold text-slate-700 appearance-none shadow-sm"
                >
                  <option value="">Seçiniz...</option>
                  {Object.keys(CATEGORY_TREE).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alt Tip</label>
                <select 
                  value={subCategory} 
                  onChange={(e) => setSubCategory(e.target.value)} 
                  disabled={!category}
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:border-remax-blue font-bold text-slate-700 appearance-none shadow-sm disabled:opacity-50"
                >
                  <option value="">Seçiniz...</option>
                  {subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>

              {category === 'Arsa' && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-remax-red uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Info size={10} /> İmar Oran Bilgisi (Emsal/KAKS)
                  </label>
                  <select 
                    value={zoningRate} 
                    onChange={(e) => setZoningRate(e.target.value)} 
                    className="w-full p-4 bg-red-50/50 rounded-2xl border border-red-100 outline-none focus:border-remax-red font-black text-remax-red appearance-none shadow-sm"
                  >
                    <option value="">Seçiniz (Opsiyonel)</option>
                    {imarOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              )}

              <button 
                onClick={startAnalysis}
                disabled={loading || !kmlContent || !category || !subCategory}
                className="w-full bg-remax-blue text-white py-5 rounded-3xl font-black flex items-center justify-center gap-3 transition-all hover:bg-blue-800 disabled:opacity-30 shadow-xl shadow-blue-100 group"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Zap size={18} className="group-hover:scale-125 transition-transform" /> Analizi Başlat</>}
              </button>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3 text-red-700">
                <AlertTriangle size={18} className="shrink-0" />
                <p className="text-[10px] font-bold">{error}</p>
              </div>
            )}
          </div>

          {analysis && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl animate-in slide-in-from-left-4 overflow-hidden">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                <ClipboardList size={20} className="text-remax-blue" />
                <h3 className="text-xs font-black uppercase tracking-tighter text-slate-800">1. Tanımlayıcı Bilgiler</h3>
              </div>
              <div className="text-[11px] font-semibold text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
                {analysis.kunye}
              </div>
            </div>
          )}
        </div>

        {/* Sağ Panel: Görselleştirme */}
        <div className="lg:col-span-8">
          <div className="bg-white p-3 rounded-[3rem] border border-slate-100 shadow-2xl relative h-[650px] overflow-hidden">
            <div className="absolute top-8 left-8 z-[1000] flex flex-col gap-3">
              <div className="bg-white/95 backdrop-blur px-4 py-2 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">ReData Harita Motoru</span>
              </div>
              <div className="flex bg-white/95 backdrop-blur p-1 rounded-2xl shadow-lg border border-slate-100 self-start">
                <button onClick={() => setMapMode('street')} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${mapMode === 'street' ? 'bg-remax-blue text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Sokak</button>
                <button onClick={() => setMapMode('satellite')} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${mapMode === 'satellite' ? 'bg-remax-blue text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Uydu</button>
              </div>
            </div>
            
            <div ref={mapContainerRef} className="w-full h-full rounded-[2.5rem] z-10 border border-slate-50 overflow-hidden relative" />
            
            {!analysis && (
              <div className="absolute inset-4 z-[11] bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center rounded-[2.5rem] border-2 border-white/50 border-dashed">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-6 bg-white rounded-3xl shadow-2xl text-slate-100"><MapIcon size={48} /></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white px-8 py-3 rounded-full shadow-sm">
                    {kmlContent ? 'Veri Hazır, Analizi Başlatın' : 'KML Dosyası Yükleyerek Başlayın'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {analysis && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
           {/* Üst Sıra Kartlar */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ReportCard title="Teknik Parsel Analizi" icon={<Shapes size={24}/>} color="blue" content={analysis.parselTeknik} />
              <ReportCard title="Finansal Değerleme" icon={<DollarSign size={24}/>} color="emerald" content={analysis.finansalAnaliz} />
           </div>

           {/* Trend Analizi - Tam Genişlik */}
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-remax-red opacity-[0.03] rounded-full -mr-16 -mt-16"></div>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-red-50 text-remax-red rounded-2xl group-hover:rotate-12 transition-transform">
                  <TrendingUp size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Pazar Trendleri & Projeksiyon</h4>
                  <p className="text-xs font-bold text-slate-400">Gelecek 1-5 Yıllık Beklentiler</p>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-[13px] font-medium text-slate-600 leading-relaxed whitespace-pre-line columns-1 md:columns-2 gap-12">
                {analysis.trendAnalizi}
              </div>
           </div>

           {/* Alt Sıra Kartlar */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ReportCard title="Demografik & Ulaşım" icon={<Users size={24}/>} color="slate" content={analysis.cevreDemografik} />
              <ReportCard title="Sosyal Donatı Analizi" icon={<Hospital size={24}/>} color="amber" subTitle="3 km Yarıçap Analizi" content={analysis.sosyalOlanaklar} />
           </div>
        </div>
      )}
    </div>
  );
};

const ReportCard = ({ title, subTitle, icon, color, content }: any) => {
  const colorClasses: any = {
    blue: 'bg-blue-50 text-remax-blue',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-50 text-slate-600',
    'remax-red': 'bg-red-50 text-remax-red'
  };

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl group hover:shadow-2xl transition-all duration-300 h-full">
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h4>
          {subTitle && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{subTitle}</p>}
        </div>
      </div>
      <div className="text-[12px] leading-relaxed text-slate-600 font-medium whitespace-pre-line">
        {content}
      </div>
    </div>
  );
};

export default TapuAnalysisView;
