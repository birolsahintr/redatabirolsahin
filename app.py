import streamlit as st
import google.generativeai as genai

# Sayfa Ayarları
st.set_page_config(page_title="Benim AI Projem", layout="centered")

# Başlık
st.title("🤖 Benim Yapay Zeka Asistanım")
st.write("Aşağıya sorunu yaz, cevaplayayım!")

# API Anahtarını şifreli kutudan al (Bunu Adım 3'te ayarlayacağız)
api_key = st.secrets["GOOGLE_API_KEY"]
genai.configure(api_key=api_key)

# Model Ayarları (Burayı değiştirme)
model = genai.GenerativeModel('gemini-1.5-flash')

# Sohbet geçmişini başlat
if "messages" not in st.session_state:
    st.session_state.messages = []

    # --- ÖNEMLİ: SENİN PROMPTUN BURADA DEVREYE GİRİYOR ---
    # AI Studio'daki "System Instruction" kısmını buraya ekliyoruz.
    system_instruction = "Sen yardımsever bir asistansın. Türkçe konuşursun." 
    # Yukarıdaki tırnak içini kendi projenle değiştir!
    
    st.session_state.messages.append({"role": "user", "parts": [system_instruction]})
    st.session_state.messages.append({"role": "model", "parts": ["Anlaşıldı, talimatlarınıza göre hareket edeceğim."]})

# Eski mesajları ekrana yazdır (Sistem mesajı hariç)
for message in st.session_state.messages[2:]:
    with st.chat_message(message["role"]):
        st.write(message["parts"][0])

# Kullanıcıdan girdi al
if prompt := st.chat_input("Bir şeyler yaz..."):
    # Kullanıcı mesajını ekrana bas
    st.chat_message("user").write(prompt)
    st.session_state.messages.append({"role": "user", "parts": [prompt]})

    # Cevap üret
    try:
        response = model.generate_content(st.session_state.messages)
        text_response = response.text
        
        # Cevabı ekrana bas
        st.chat_message("ai").write(text_response)
        st.session_state.messages.append({"role": "model", "parts": [text_response]})
    except Exception as e:
        st.error(f"Bir hata oluştu: {e}")
