import {
  addSchedule,
  getSchedules,
  deleteSchedule,
} from "../features/schedule/utils.js";

export function render(container) {
  container.innerHTML = `
    <div class="planner-container">
      <h2>Planner</h2>
      <form id="schedule-form">
        <input type="text" id="title" placeholder="Schedule Title" required />
        <input type="date" id="date" required />
        <button type="submit">Add Schedule</button>
      </form>
      <div id="schedule-list"></div>
      <div id="error-message" style="color: red; margin-top: 10px;"></div>
    </div>
  `;

  const form = document.getElementById("schedule-form");
  const scheduleList = document.getElementById("schedule-list");
  const errorMessageDiv = document.getElementById("error-message");

  // 일정 추가 이벤트 리스너
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const date = document.getElementById("date").value;

    try {
      errorMessageDiv.textContent = ""; // 에러 메시지 초기화
      await addSchedule({ title, date }); // Firestore에 일정 추가
      form.reset(); // 폼 초기화
      loadSchedules(); // 일정 목록 다시 불러오기
    } catch (error) {
      errorMessageDiv.textContent = `Error: ${error.message}`; // 에러 메시지 표시
    }
  });

  // 일정 목록 불러오기
  async function loadSchedules() {
    try {
      const schedules = await getSchedules(); // Firestore에서 일정 가져오기
      scheduleList.innerHTML = schedules
        .map(
          (schedule) => `
          <div class="schedule-item">
            <p><strong>${schedule.title}</strong> - ${schedule.date}</p>
            <button class="delete-button" data-id="${schedule.id}">Delete</button>
          </div>
        `
        )
        .join("");

      // 삭제 버튼 이벤트 리스너 추가
      document.querySelectorAll(".delete-button").forEach((button) => {
        button.addEventListener("click", async (e) => {
          const id = e.target.dataset.id;
          try {
            await deleteSchedule(id); // Firestore에서 일정 삭제
            loadSchedules(); // 일정 목록 다시 불러오기
          } catch (error) {
            errorMessageDiv.textContent = `Error: ${error.message}`; // 에러 메시지 표시
          }
        });
      });
    } catch (error) {
      errorMessageDiv.textContent = `Error: ${error.message}`; // 에러 메시지 표시
    }
  }

  loadSchedules(); // 초기 일정 목록 로드
}
