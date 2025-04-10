import { initCalendar } from "../features/schedule/calendar.js";
import { addSchedule } from "../features/schedule/utils.js";

export function render(container) {
  container.innerHTML = `
    <h1>Schedule</h1>
    <form id="schedule-form">
      <input type="text" id="title" placeholder="Schedule Title" required />
      <input type="date" id="date" required />
      <button type="submit">작성하기</button>
    </form>
    <div id="schedule-list"></div>
    <div id="error-message" style="color: red; margin-top: 10px;"></div> <!-- 에러 메시지 표시 영역 -->
  `;

  const form = document.getElementById("schedule-form");
  const errorMessageDiv = document.getElementById("error-message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const date = document.getElementById("date").value;

    try {
      errorMessageDiv.textContent = "";
      await addSchedule({ title, date });
    } catch (error) {
      errorMessageDiv.textContent = `Error: ${error.message}`;
    }
  });
}
