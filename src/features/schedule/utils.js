import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase/firestore.js";

// Firestore에 일정 추가
export async function addSchedule(schedule) {
  try {
    const existingSchedules = await getSchedules();
    const isDuplicate = existingSchedules.some(
      (s) => s.title === schedule.title && s.date === schedule.date
    );

    if (isDuplicate) {
      console.log("Duplicate schedule detected. Skipping Firestore write.");
      throw new Error("이미 동일한 일정이 존재합니다.");
    }

    const docRef = await addDoc(collection(db, "schedules"), schedule);
    console.log("Document written with ID: ", docRef.id);
    return docRef.id;
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
    console.error("Error fetching schedules:", error);
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

// Firestore에서 일정 업데이트
export async function updateSchedule(id, updatedData) {
  try {
    const scheduleRef = doc(db, "schedules", id);
    const existingSchedule = (await getDoc(scheduleRef)).data();

    // 변경된 데이터만 업데이트
    const isChanged = Object.keys(updatedData).some(
      (key) => updatedData[key] !== existingSchedule[key]
    );

    if (!isChanged) {
      console.log("No changes detected. Skipping Firestore update.");
      return; // 변경 사항이 없으면 업데이트 중단
    }

    await updateDoc(scheduleRef, updatedData);
    console.log("Document updated with ID: ", id);
  } catch (error) {
    console.error("Error updating schedule: ", error);
    throw new Error("Failed to update schedule.");
  }
}
