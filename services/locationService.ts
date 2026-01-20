
/**
 * ReData - Dinamik Konum Servisi
 */

const normalizeFileName = (text: string): string => {
  if (!text) return '';
  return text
    .trim()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^\w\s-]/g, '') // Alfanümerik olmayanları kaldır
    .replace(/\s+/g, '-')     // Boşlukları tire yap
    .replace(/-+/g, '-');     // Çoklu tireleri tekilleştir
};

export const LocationService = {
  getCities: async (): Promise<string[]> => {
    try {
      const response = await fetch('data/locations/cities.json');
      if (!response.ok) throw new Error("Cities not found");
      return await response.json();
    } catch (e) {
      console.error("Cities fetch error:", e);
      return ["İstanbul", "Kocaeli", "Ankara", "İzmir"];
    }
  },

  getDistricts: async (cityName: string): Promise<string[]> => {
    if (!cityName) return [];
    try {
      const fileName = normalizeFileName(cityName);
      const response = await fetch(`data/locations/districts/${fileName}.json`);
      if (!response.ok) return [];
      return await response.json();
    } catch (e) {
      console.error(`Districts fetch error for ${cityName}:`, e);
      return [];
    }
  },

  getNeighborhoods: async (cityName: string, districtName: string): Promise<string[]> => {
    if (!cityName || !districtName) return [];
    try {
      const cityPart = normalizeFileName(cityName);
      const districtPart = normalizeFileName(districtName);
      const response = await fetch(`data/locations/neighborhoods/${cityPart}-${districtPart}.json`);
      if (!response.ok) return [];
      return await response.json();
    } catch (e) {
      return [];
    }
  }
};
