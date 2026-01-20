
import React, { useMemo, useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { RealEstateRecord, RecordType, CATEGORY_TREE, PropertyCategory } from '../types';
import { LocationService } from '../services/locationService';
import { TrendingUp, Filter, BarChart3, Layers } from 'lucide-react';

interface MarketTrendChartProps {
  records: RealEstateRecord[];
}

const MarketTrendChart: React.FC<MarketTrendChartProps> = ({ records }) => {
  const [filterCity, setFilterCity] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterNeighborhood, setFilterNeighborhood] = useState('');
  const [filterCategory, setFilterCategory] = useState<PropertyCategory | ''>('');
  const [filterSubCategory, setFilterSubCategory] = useState('');

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

  const chartData = useMemo(() => {
    const valuations = records.filter(r => 
      r.type === RecordType.VALUATION && 
      (!filterCity || r.city === filterCity) &&
      (!filterDistrict || r.district === filterDistrict) &&
      (!filterNeighborhood || r.neighborhood === filterNeighborhood) &&
      (!filterCategory || r.category === filterCategory) &&
      (!filterSubCategory || r.subCategory === filterSubCategory)
    );

    if (valuations.length === 0) return [];

    const grouped = valuations.reduce((acc: any, curr) => {
      const date = curr.createdAt?.toDate ? curr.createdAt.toDate() : new Date(curr.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) acc[monthKey] = { totalSqm: 0, count: 0, date: monthKey };
      acc[monthKey].totalSqm += curr.pricePerSqm;
      acc[monthKey].count += 1;
      return acc;
    }, {});

    return Object.values(grouped)
      .map((item: any) => ({
        name: new Date(item.date).toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' }),
        avgPrice: Math.round(item.totalSqm / item.count),
        rawDate: item.date
      }))
      .sort((a: any, b: any) => a.rawDate.localeCompare(b.rawDate));
  }, [records, filterCity, filterDistrict, filterNeighborhood, filterCategory, filterSubCategory]);

  const currentAvg = chartData.length > 0 ? chartData[chartData.length - 1].avgPrice : 0;
  const previousAvg = chartData.length > 1 ? chartData[chartData.length - 2].avgPrice : currentAvg;
  const changeRate = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;

  const subCategories = filterCategory ? CATEGORY_TREE[filterCategory as PropertyCategory] || [] : [];

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-8 animate-in slide-in-from-bottom-5 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-remax-blue" size={24} /> Piyasa Değer Trendi
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            Emsal Verilerine Dayalı m² Birim Fiyat Analizi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-400 rounded-xl">
            <Filter size={14} /><span className="text-[9px] font-black uppercase tracking-widest">Analiz Kriterleri</span>
          </div>
          
          <select 
            value={filterCategory} 
            onChange={(e) => { setFilterCategory(e.target.value as PropertyCategory); setFilterSubCategory(''); }}
            className="bg-white border border-slate-100 p-2 rounded-xl text-[10px] font-bold outline-none focus:border-remax-blue shadow-sm"
          >
            <option value="">Kategori...</option>
            {Object.keys(CATEGORY_TREE).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            value={filterSubCategory} 
            onChange={(e) => setFilterSubCategory(e.target.value)}
            disabled={!filterCategory}
            className="bg-white border border-slate-100 p-2 rounded-xl text-[10px] font-bold outline-none focus:border-remax-blue shadow-sm disabled:opacity-50"
          >
            <option value="">Alt Tip...</option>
            {subCategories.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div className="h-6 w-[1px] bg-slate-100 mx-1 hidden md:block"></div>

          <select 
            value={filterCity} 
            onChange={(e) => setFilterCity(e.target.value)}
            className="bg-white border border-slate-100 p-2 rounded-xl text-[10px] font-bold outline-none focus:border-remax-blue shadow-sm"
          >
            <option value="">İl...</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            value={filterDistrict} 
            onChange={(e) => setFilterDistrict(e.target.value)}
            disabled={!filterCity}
            className="bg-white border border-slate-100 p-2 rounded-xl text-[10px] font-bold outline-none focus:border-remax-blue shadow-sm disabled:opacity-50"
          >
            <option value="">İlçe...</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select 
            value={filterNeighborhood} 
            onChange={(e) => setFilterNeighborhood(e.target.value)}
            disabled={!filterDistrict}
            className="bg-white border border-slate-100 p-2 rounded-xl text-[10px] font-bold outline-none focus:border-remax-blue shadow-sm disabled:opacity-50"
          >
            <option value="">Mahalle...</option>
            {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0054A6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0054A6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickFormatter={(val) => `${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '1rem', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`${value.toLocaleString()} TL`, 'm² Fiyatı']}
                />
                <Area 
                  type="monotone" 
                  dataKey="avgPrice" 
                  stroke="#0054A6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <TrendingUp size={48} className="text-slate-200 mb-2" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-6">
                Seçilen kriterlere uygun yeterli emsal verisi bulunmuyor
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="p-6 bg-[#0054A6] text-white rounded-[2rem] shadow-lg shadow-blue-100 h-full flex flex-col justify-center">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Ortalama m² Değeri</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h4 className="text-3xl font-black">{currentAvg.toLocaleString()}</h4>
              <span className="text-sm font-bold opacity-60">TL</span>
            </div>
            
            <div className="mt-6 flex items-center gap-2 bg-white/10 w-fit px-3 py-1.5 rounded-full">
              <div className={`w-2 h-2 rounded-full ${changeRate >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {changeRate >= 0 ? 'Artış' : 'Azalış'}: %{Math.abs(changeRate).toFixed(1)}
              </span>
            </div>
            <p className="text-[8px] font-bold opacity-40 mt-4 uppercase tracking-tighter">
              Son girilen emsal kayıtlarına göre anlık hesaplanmıştır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketTrendChart;
