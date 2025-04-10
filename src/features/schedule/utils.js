import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase/firestore.js";

export async function addSchedule(schedule) {
  try {
    const docRef = await addDoc(collection(db, "schedules"), schedule);
    console.log("Document written with ID: ", docRef.id);
    alert("Schedule added successfully!");
  } catch (error) {
    console.error("Error adding schedule: ", error);
    alert("Failed to add schedule.");
  }
}
