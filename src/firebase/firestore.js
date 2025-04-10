import { getFirestore } from "firebase/firestore";
import app from "./config.js";

export const db = getFirestore(app); // Firestore 데이터베이스 객체
