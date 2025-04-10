import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

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
