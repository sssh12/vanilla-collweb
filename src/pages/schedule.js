import { initCalendar } from "../features/schedule/calendar.js";

export function render(container) {
  container.innerHTML = `
    <h1>Schedule</h1>
    <div id="calendar"></div>
  `;

  // FullCalendar.js 초기화
  initCalendar("calendar");
}
