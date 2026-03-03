import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase 환경변수 확인
console.log('📋 Firebase 환경변수 확인:');
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ 설정됨' : '❌ 없음');
console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ 설정됨' : '❌ 없음');
console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ 설정됨' : '❌ 없음');

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, 
};

console.log('🔥 Firebase Config:', firebaseConfig);

export const app = initializeApp(firebaseConfig);
console.log('✅ Firebase App 초기화됨:', app.name);

export const auth = getAuth(app);
console.log('✅ Firebase Auth 초기화됨');

export const db = getFirestore(app);
console.log('✅ Firestore 초기화됨');

export const storage = getStorage(app);
console.log('✅ Firebase Storage 초기화됨');

// analytics는 개발/SSR/일부 환경에서 지원 안 될 수 있어서 안전하게
export const analyticsPromise = isSupported().then((ok) =>
  ok ? getAnalytics(app) : null
);
