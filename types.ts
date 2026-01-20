
export enum RecordType {
  PORTFOLIO = 'PORTFOLIO',
  DEMAND = 'DEMAND',
  VALUATION = 'VALUATION'
}

export type PropertyCategory = 'Konut' | 'Arsa' | 'İşyeri';

export const CATEGORY_TREE: Record<PropertyCategory, string[]> = {
  'Konut': ['Daire', 'Müstakil ev', 'Villa', 'Bina', 'Residence', 'Yazlık'],
  'Arsa': ['İmarlı Konut', 'İmarlı Ticari', 'İmarlı Konut+Ticari', 'İmarlı Villa', 'İmarlı Turizm + Konut', 'Tarla', 'Arazi', 'Bağ/Bahçe', 'Zeytinlik', 'Kat Karşılığı'],
  'İşyeri': ['Dükkan / Mağaza', 'Büro / Ofis', 'Daire (İşyeri)', 'Depo / Antrepo', 'Genel', 'İşhanı / Ofis', 'Bina (İşyeri)', 'Atölye / İmalathane', 'Plaza Ofisi']
};

export type RoomCount = '1+0' | '1+1' | '2+1' | '3+1' | '4+1' | '5+1' | '6+1' | '7+1 ve üzeri';

export interface RealEstateRecord {
  id: string;
  type: RecordType;
  category: PropertyCategory;
  subCategory: string;
  rooms?: RoomCount;
  age?: string;
  city: string;
  district: string;
  neighborhood: string;
  block?: string; 
  parcel?: string; 
  area?: number; 
  price: number;
  pricePerSqm: number;
  salePrice?: number;
  isSold?: boolean;
  isWithinSite?: boolean;
  consultant: string;
  consultantName?: string;
  officeName?: string;
  createdAt: any;
  description?: string;
  matchId?: string;
  zoningRate?: string;
  status?: 'ACTIVE' | 'PASSIVE';
}

export interface TapuAnalysis {
  kunye: string;
  parselTeknik: string;
  finansalAnaliz: string;
  trendAnalizi: string;
  cevreDemografik: string;
  sosyalOlanaklar: string;
  mapCoordinates?: number[][];
  locationName: string;
}
