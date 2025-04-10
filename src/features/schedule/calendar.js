import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { onSnapshot, collection } from "firebase/firestore";
import { db } from "../../firebase/firestore.js";

export function initCalendar(elementId) {
  const calendarEl = document.getElementById(elementId);

  const calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: "dayGridMonth",
    editable: true, // 드래그 앤 드롭 활성화
    events: [], // 초기 이벤트 데이터
  });

  calendar.render();
}

export function listenToSchedules(callback) {
  const schedulesRef = collection(db, "schedules");

  onSnapshot(schedulesRef, (snapshot) => {
    const schedules = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(schedules); // UI 업데이트 콜백 호출
  });
}
