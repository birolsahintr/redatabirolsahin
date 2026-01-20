import streamlit as st
import google.generativeai as genai

# --- AYARLAR KISMI ---
# AI Studio'dan aldığınız API anahtarını tırnak içine yazın
GOOGLE_API_KEY = "BURAYA_API_KEYINIZI_YAZIN"

genai.configure(api_key=GOOGLE_API_KEY)

# AI Studio'dan "Get Code" dediğinizde model ayarları (generation_config) gelir.
# Onları buraya ekleyebilirsiniz veya varsayılanı kullanabilirsiniz.
model = genai.GenerativeModel('gemini-pro') # Veya 'gemini-1.5-flash'

# --- ARAYÜZ (WEB SİTESİ) KISMI ---
st.title("ReData")
st.write("Aşağıya sorunu yaz, yapay zeka cevaplasın.")

# Kullanıcıdan veri alma kutusu
user_input = st.text_input("Mesajınız:", placeholder="Buraya yazın...")

# Butona basılınca ne olacak?
if st.button("Gönder"):
    if user_input:
        with st.spinner("Cevap hazırlanıyor..."):
            try:
                # Modeli çağırma (AI Studio kodunun asıl iş yapan kısmı burasıdır)
                response = model.generate_content(user_input)
                
                # Cevabı ekrana yazdırma (print yerine st.write kullanıyoruz)
                st.success("Cevap:")
                st.write(response.text)
            except Exception as e:
                st.error(f"Bir hata oluştu: {e}")
    else:
        st.warning("Lütfen bir şeyler yazın.")
