import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBCoTBKl7FzhmuS1S12G2Q-MdI4ct0XFCA",
  authDomain: "collabo-web-e0e89.firebaseapp.com",
  projectId: "collabo-web-e0e89",
  storageBucket: "collabo-web-e0e89.firebasestorage.app",
  messagingSenderId: "436458118156",
  appId: "1:436458118156:web:78975f5cceb7d26ea2e229",
  measurementId: "G-TSF3QRQW7Q",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default app;
export { analytics };
