
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

/**
 * REHBER: 
 * Senin sağladığın gerçek Firebase bilgileri aşağıya işlendi.
 * Uygulaman artık redata-6c98f projesine bağlı.
 */
const firebaseConfig = {
  apiKey: "AIzaSyDZhVjkod6z5GqfVNMDlIMAITFFhx2Zcdk",
  authDomain: "redata-6c98f.firebaseapp.com",
  projectId: "redata-6c98f",
  storageBucket: "redata-6c98f.firebasestorage.app",
  messagingSenderId: "127770758526",
  appId: "1:127770758526:web:ee88ad3abd831e94f2f72f"
};

// Firebase Uygulamasını Başlat
const app = initializeApp(firebaseConfig);

/**
 * Firestore'u Akıllı Modda Başlatıyoruz:
 * 1. persistentLocalCache: İnternet kesilse bile veriler tarayıcıda kalır.
 * 2. tabManager: Çoklu sekme desteği.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Firebase Auth'u Başlat
export const auth = getAuth(app);
