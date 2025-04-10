import {
  addSchedule,
  getSchedules,
  deleteSchedule,
  updateSchedule,
} from "../features/schedule/utils.js";

// planner.css 로드
import "../../styles/planner.css";
import { auth } from "../firebase/auth.js";

export function render(container) {
  const user = auth.currentUser;

  container.innerHTML = `
    <div class="planner-container">
      <h2>Planner</h2>
      <form id="schedule-form">
        <input type="text" id="title" placeholder="Schedule Title" required />
        <input type="date" id="date" required />
        <select id="priority" required>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <button type="submit">Add Schedule</button>
      </form>
      <div class="schedule-lists">
        <div class="schedule-column" id="High-priority">
          <h3>High Priority</h3>
          <div class="schedule-items"></div>
        </div>
        <div class="schedule-column" id="Medium-priority">
          <h3>Medium Priority</h3>
          <div class="schedule-items"></div>
        </div>
        <div class="schedule-column" id="Low-priority">
          <h3>Low Priority</h3>
          <div class="schedule-items"></div>
        </div>
      </div>
      <div id="error-message" style="color: red; margin-top: 10px;"></div>
    </div>
  `;

  const form = document.getElementById("schedule-form");
  const errorMessageDiv = document.getElementById("error-message");
  const logoutButton = document.getElementById("logout-button");

  logoutButton.style.display = "block"; // 로그아웃 버튼 표시

  logoutButton.addEventListener("click", async () => {
    try {
      errorMessageDiv.textContent = ""; // 에러 메시지 초기화
      logoutButton.style.display = "none"; // 로그아웃 버튼 숨김
      await auth.signOut(); // Firebase 로그아웃
      window.location.hash = "/login"; // 로그아웃 후 로그인 페이지로 이동
    } catch (error) {
      // 로그아웃 실패 시 오류 메시지 표시
      errorMessageDiv.textContent = `Error: ${error.message}`; // 에러 메시지 표시
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const date = document.getElementById("date").value;
    const priority = document.getElementById("priority").value;

    try {
      errorMessageDiv.textContent = "";
      await addSchedule({ title, date, priority });
      form.reset();
      loadSchedules();
    } catch (error) {
      errorMessageDiv.textContent = `Error: ${error.message}`;
    }
  });

  async function loadSchedules() {
    try {
      const schedules = await getSchedules();
      const highPriority = document
        .getElementById("High-priority")
        .querySelector(".schedule-items");
      const mediumPriority = document
        .getElementById("Medium-priority")
        .querySelector(".schedule-items");
      const lowPriority = document
        .getElementById("Low-priority")
        .querySelector(".schedule-items");

      highPriority.innerHTML = "";
      mediumPriority.innerHTML = "";
      lowPriority.innerHTML = "";

      schedules.forEach((schedule) => {
        const scheduleItem = document.createElement("div");
        scheduleItem.className = "schedule-item";
        scheduleItem.setAttribute("draggable", "true");
        scheduleItem.dataset.id = schedule.id;
        scheduleItem.dataset.priority = schedule.priority;
        scheduleItem.innerHTML = `
          <p><strong>${schedule.title}</strong> - ${schedule.date}</p>
          <button class="delete-button">Delete</button>
        `;

        scheduleItem
          .querySelector(".delete-button")
          .addEventListener("click", async () => {
            try {
              await deleteSchedule(schedule.id);
              loadSchedules();
            } catch (error) {
              console.error("Error deleting schedule:", error);
            }
          });

        if (schedule.priority === "High") {
          highPriority.appendChild(scheduleItem);
        } else if (schedule.priority === "Medium") {
          mediumPriority.appendChild(scheduleItem);
        } else if (schedule.priority === "Low") {
          lowPriority.appendChild(scheduleItem);
        }
      });

      addDragAndDrop();
    } catch (error) {
      console.error("Error loading schedules:", error);
    }
  }

  function addDragAndDrop() {
    const columns = document.querySelectorAll(
      ".schedule-column .schedule-items"
    );

    columns.forEach((column) => {
      column.addEventListener("dragover", (e) => {
        e.preventDefault();
        column.classList.add("dragover");
      });

      column.addEventListener("dragleave", () => {
        column.classList.remove("dragover");
      });

      column.addEventListener("drop", async (e) => {
        e.preventDefault();
        column.classList.remove("dragover");

        const id = e.dataTransfer.getData("text/plain");
        const newPriority = column.parentElement.id.replace("-priority", "");

        try {
          await updateSchedule(id, { priority: newPriority });
          loadSchedules();
        } catch (error) {
          console.error("Error updating schedule:", error);
        }
      });
    });

    document.querySelectorAll(".schedule-item").forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", item.dataset.id);
        e.dataTransfer.effectAllowed = "move";
      });

      item.addEventListener("dragend", () => {
        columns.forEach((column) => column.classList.remove("dragover"));
      });
    });
  }

  loadSchedules();
}
