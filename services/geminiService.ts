
import { GoogleGenAI, Type } from "@google/genai";
import { TapuAnalysis, RealEstateRecord, RecordType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const KML_PROMPT = `
Sen Türkiye mevzuatına hakim, titiz bir Gayrimenkul Danışmanı ve Hukuk Asistanısın. Görevin, sana iletilen KML içeriğini ve kullanıcı bilgilerini analiz ederek profesyonel bir "Gayrimenkul Analiz Raporu" sunmaktır.

ANALİZ KAPSAMI VE KURALLARI:

1. TEKNİK VE MEKANSAL ANALİZ (KML Verisi İşleme):
   - KML'deki koordinatları kullanarak parselin İl, İlçe, Mahalle, Ada ve Parsel numarasını tespit et.
   - Yüzölçümünü (m2) hesapla.
   - Parselin eğim, topografik durumunu (düz, eğimli vb.) ve geometrik verimliliğini değerlendir.

2. FİNANSAL DEĞERLEME VE PAZAR ANALİZİ (Google Search Kullan):
   - Bölgedeki güncel ortalama arsa m2/TL ve konut m2/TL değerlerini bul.
   - Parselin tahmini toplam piyasa değerini hesapla.
   - Geçmiş Fiyat Trendleri: Son 5 yıla ait bölgedeki m2 fiyat değişimini analiz et (% olarak).
   - Gelecek Beklentisi: Bölgedeki gelişim projelerine dayanarak 1 ve 5 yıllık fiyat artış projeksiyonu sun (% olarak).

3. ÇEVRE VE DEMOGRAFİK ETKİ ANALİZİ (Google Search Kullan):
   - Ulaşım: Ana arterlere ve toplu taşıma duraklarına olan mesafeyi (km) ve süreyi hesapla.
   - Demografi: Çevredeki yaş ortalaması, hane geliri, eğitim seviyesi ve nüfus yoğunluğunu özetle.
   - Sosyal Olanaklar: 3 km yarıçapındaki kritik sosyal olanakların (hastane, okul, market/AVM ve park) sayısını ve erişim kolaylığını değerlendir.

KOORDİNAT İŞLEME:
- KML içindeki koordinatları ayıkla ve [long, lat] formatını [lat, long] olarak değiştirerek mapCoordinates dizisine ekle.

Rapor Formatı:
- Sonuçları JSON formatında döndür.
- Her bölüm net başlıklar, listeler ve finansal tablolar içermelidir.
- Okuyamadığın yerlere "BELİRSİZ" yaz.
`;

export const extractListingFromText = async (text: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: `Aşağıdaki gayrimenekul ilanı metninden bilgileri en yüksek doğrulukla ayıkla:\n\n${text}` }] }],
      config: {
        systemInstruction: `Sen uzman bir gayrimenkul veri analistisin. Türkiye'deki emlak ilanlarını analiz etme konusunda derin tecrübeye sahipsin. 
        
        VERİ AYIKLAMA KURALLARI:
        1. FİYAT (price): Metindeki fiyatı bul ve tam sayıya çevir. "Milyon" ifadesi varsa 1.000.000 ile çarp. "Bin" varsa 1.000 ile çarp. Nokta ve virgülleri temizle. Örn: "5.5 Milyon" -> 5500000.
        2. ALAN (area): Metindeki net veya brüt alanı (m²) bul. Sadece sayısal değer döndür. "Dönüm" varsa 1000 ile çarp.
        3. ADA / PARSEL (block/parcel): Metinde "101/5", "Ada: 101 Parsel: 5" veya "101 ada 5 parsel" gibi ifadeleri yakala. block=Ada, parcel=Parsel.
        4. KONUM: İl, İlçe ve Mahalle bilgilerini ayıkla.
        5. KATEGORİ: 'Konut', 'Arsa', 'İşyeri' seçeneklerinden en uygununu seç.
        6. İMAR DURUMU (zoningRate): Metindeki imar oranını (emsal/kaks) bul ve şu değerlerden en yakın olanı seç: 'YOK', '0.05', '0.10', '0.15', '0.20', '0.25', '0.30', '0.40', '0.50', '0.60', '0.65', '0.70', '0.75', '0.80', '0.85', '0.90', '0.95', '1.00'.
        7. ODA SAYISI: Sadece konutlar için "3+1", "2+1" formatında ayıkla.
        
        JSON formatında, birim eklemeden sadece saf verileri döndür.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "'Konut', 'Arsa' veya 'İşyeri'" },
            subCategory: { type: Type.STRING },
            city: { type: Type.STRING },
            district: { type: Type.STRING },
            neighborhood: { type: Type.STRING },
            block: { type: Type.STRING, description: "Ada numarası (Sadece rakam/karakter)" },
            parcel: { type: Type.STRING, description: "Parsel numarası (Sadece rakam/karakter)" },
            area: { type: Type.NUMBER, description: "Sayısal m² değeri" },
            price: { type: Type.NUMBER, description: "Sayısal tam fiyat değeri" },
            rooms: { type: Type.STRING },
            zoningRate: { type: Type.STRING, description: "İmar oranı (Örn: 0.30)" }
          },
          required: ["category", "subCategory", "city", "district", "price", "area"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("extractListingFromText error:", error);
    return null;
  }
};

export const analyzeKmlData = async (
  kmlContent: string, 
  category: string, 
  subCategory: string, 
  zoningRate: string
): Promise<TapuAnalysis | null> => {
  try {
    const customizedPrompt = KML_PROMPT
      .replace('{category}', category)
      .replace('{subCategory}', subCategory)
      .replace('{zoningRate}', zoningRate || 'Belirtilmedi');

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ role: 'user', parts: [{ text: `KML DOSYASI İÇERİĞİ:\n${kmlContent.substring(0, 60000)}\n\nKullanıcı Seçimleri:\nKategori: ${category}\nAlt Tip: ${subCategory}\nİmar Bilgisi: ${zoningRate}` }] }],
      config: {
        systemInstruction: customizedPrompt,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            kunye: { type: Type.STRING, description: "Tanımlayıcı Bilgiler: İl, İlçe, Mahalle, Ada, Parsel" },
            parselTeknik: { type: Type.STRING, description: "Parsel Teknik Analizi: Yüzölçümü, eğim, topografi" },
            finansalAnaliz: { type: Type.STRING, description: "Finansal Değerleme: m2 fiyatları, toplam değer" },
            trendAnalizi: { type: Type.STRING, description: "Fiyat Trendleri: 5 yıllık geçmiş, 1 ve 5 yıllık gelecek projeksiyonu" },
            cevreDemografik: { type: Type.STRING, description: "Çevre ve Demografi: Ulaşım ağları, hane geliri, nüfus yapısı" },
            sosyalOlanaklar: { type: Type.STRING, description: "Sosyal Donatılar: 3km içindeki okul, hastane, AVM vb." },
            locationName: { type: Type.STRING, description: "Örn: İzmit Kabaoğlu 101/5" },
            mapCoordinates: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER }
              }
            }
          },
          required: ["kunye", "parselTeknik", "finansalAnaliz", "trendAnalizi", "cevreDemografik", "sosyalOlanaklar", "locationName", "mapCoordinates"]
        }
      }
    });

    return JSON.parse(response.text) as TapuAnalysis;
  } catch (error) {
    console.error("KML Analysis Error:", error);
    return null;
  }
};
