import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase/firestore.js";

// Firestore에 일정 추가
export async function addSchedule(schedule) {
  try {
    const docRef = await addDoc(collection(db, "schedules"), schedule);
    console.log("Document written with ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding schedule: ", error);
    throw new Error("Failed to add schedule.");
  }
}

// Firestore에서 일정 목록 가져오기
export async function getSchedules() {
  try {
    const querySnapshot = await getDocs(collection(db, "schedules"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching schedules: ", error);
    throw new Error("Failed to fetch schedules.");
  }
}

// Firestore에서 일정 삭제
export async function deleteSchedule(id) {
  try {
    await deleteDoc(doc(db, "schedules", id));
    console.log("Document deleted with ID: ", id);
  } catch (error) {
    console.error("Error deleting schedule: ", error);
    throw new Error("Failed to delete schedule.");
  }
}
