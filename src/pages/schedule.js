import { initCalendar } from "../features/schedule/calendar.js";
import { addSchedule } from "../features/schedule/utils.js";

export function render(container) {
  container.innerHTML = `
    <h1>Schedule</h1>
    <form id="schedule-form">
      <input type="text" id="title" placeholder="Schedule Title" required />
      <input type="date" id="date" required />
      <button type="submit">Add Schedule</button>
    </form>
    <div id="schedule-list"></div>
  `;

  const form = document.getElementById("schedule-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const date = document.getElementById("date").value;

    await addSchedule({ title, date });
  });
}
