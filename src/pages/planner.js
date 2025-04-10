import {
  addSchedule, // 새로운 일정을 추가하는 함수
  getSchedules, // 저장된 일정 목록을 가져오는 함수
  deleteSchedule, // 특정 일정을 삭제하는 함수
  updateSchedule, // 일정의 우선순위나 내용을 업데이트하는 함수
} from "../features/schedule/utils.js";

// 알림 관련 함수 가져오기
import { setReminder } from "../features/notifications/reminders.js"; // 일정 알림 설정
import { requestNotificationPermission } from "../features/notifications/notification.js"; // 알림 권한 요청

// 플래너 페이지의 스타일 가져오기
import "../../styles/planner.css";

// Firebase 인증 객체 가져오기
import { auth } from "../firebase/auth.js";

// 플래너 페이지를 렌더링하는 함수
export function render(container) {
  // 현재 로그인한 사용자 정보 가져오기
  const user = auth.currentUser;

  // 플래너 UI 생성
  container.innerHTML = `
    <div class="planner-container">
      <h2>Planner</h2>
      <form id="schedule-form">
        <!-- 일정 제목 입력 -->
        <input type="text" id="title" placeholder="일정 제목" required />
        <!-- 일정 날짜 입력 -->
        <input type="date" id="date" required />
        <!-- 일정 시간 입력 -->
        <input type="time" id="time" required />
        <!-- 일정 우선순위 선택 -->
        <select id="priority" required>
          <option value="High">높음</option>
          <option value="Medium">중간</option>
          <option value="Low">낮음</option>
        </select>
        <!-- 일정 추가 버튼 -->
        <button type="submit">작성하기</button>
      </form>
      <!-- 일정 목록을 표시할 영역 -->
      <div class="schedule-lists">
        <div class="schedule-column" id="High-priority">
          <h3>중요도 높음</h3>
          <div class="schedule-items"></div>
        </div>
        <div class="schedule-column" id="Medium-priority">
          <h3>중요도 중간</h3>
          <div class="schedule-items"></div>
        </div>
        <div class="schedule-column" id="Low-priority">
          <h3>중요도 낮음</h3>
          <div class="schedule-items"></div>
        </div>
      </div>
      <!-- 에러 메시지를 표시할 영역 -->
      <div id="error-message" style="color: red; margin-top: 10px;"></div>
    </div>
  `;

  // DOM 요소 가져오기
  const form = document.getElementById("schedule-form"); // 일정 추가 폼
  const errorMessageDiv = document.getElementById("error-message"); // 에러 메시지 표시 영역

  // 알림 권한 요청
  requestNotificationPermission();

  // 일정 추가 폼 제출 이벤트 처리
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // 기본 폼 제출 동작 방지

    // 사용자가 입력한 일정 정보 가져오기
    const title = document.getElementById("title").value; // 일정 제목
    const date = document.getElementById("date").value; // 일정 날짜
    const time = document.getElementById("time").value; // 일정 시간
    const priority = document.getElementById("priority").value; // 일정 우선순위

    try {
      errorMessageDiv.textContent = ""; // 에러 메시지 초기화

      // 날짜와 시간을 결합하여 타임스탬프 생성
      const dateTime = new Date(`${date}T${time}`);

      // Firestore에 저장할 일정 객체 생성
      const schedule = { title, date: dateTime.toISOString(), priority };

      // Firestore에 일정 추가
      await addSchedule(schedule);

      // 알림 설정
      setReminder(schedule);

      // 폼 초기화
      form.reset();

      // 일정 목록 새로고침
      loadSchedules();
    } catch (error) {
      errorMessageDiv.textContent = `Error: ${error.message}`; // 에러 메시지 표시
    }
  });

  let cachedSchedules = [];

  // Firestore에서 일정 목록을 가져와 화면에 표시하는 함수
  async function loadSchedules() {
    try {
      const schedules = await getSchedules();

      // 데이터가 변경된 경우에만 UI 업데이트
      if (JSON.stringify(schedules) !== JSON.stringify(cachedSchedules)) {
        cachedSchedules = schedules;
        renderSchedules(schedules);
      }
    } catch (error) {
      console.error("Error loading schedules:", error);
      errorMessageDiv.textContent =
        "일정을 불러오는 데 실패했습니다. 다시 시도해주세요.";
    }
  }

  // 일정 데이터를 화면에 표시하는 함수
  function renderSchedules(schedules) {
    // 각 우선순위별로 일정 표시 영역 초기화
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

    // 일정 데이터를 화면에 표시
    schedules.forEach((schedule) => {
      const scheduleItem = document.createElement("div");
      scheduleItem.className = "schedule-item";
      scheduleItem.setAttribute("draggable", "true"); // 드래그 가능 설정
      scheduleItem.dataset.id = schedule.id; // 일정 ID 저장
      scheduleItem.dataset.priority = schedule.priority; // 일정 우선순위 저장

      // 일정 날짜와 시간을 보기 좋게 포맷팅
      const scheduleDate = new Date(schedule.date);
      const formattedDate = scheduleDate.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = scheduleDate.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // 일정 항목 HTML 생성
      scheduleItem.innerHTML = `
        <p><strong>${schedule.title}</strong> - ${formattedDate} ${formattedTime}</p>
        <button class="delete-button">Delete</button>
      `;

      // 삭제 버튼 클릭 이벤트 처리
      scheduleItem
        .querySelector(".delete-button")
        .addEventListener("click", async () => {
          try {
            await deleteSchedule(schedule.id); // Firestore에서 일정 삭제
            loadSchedules(); // 일정 목록 새로고침
          } catch (error) {
            console.error("Error deleting schedule:", error);
          }
        });

      // 우선순위에 따라 일정 추가
      if (schedule.priority === "High") {
        highPriority.appendChild(scheduleItem);
      } else if (schedule.priority === "Medium") {
        mediumPriority.appendChild(scheduleItem);
      } else if (schedule.priority === "Low") {
        lowPriority.appendChild(scheduleItem);
      }
    });

    // 드래그 앤 드롭 초기화
    addDragAndDrop();
  }

  // 드래그 앤 드롭 기능 초기화 함수
  function addDragAndDrop() {
    const columns = document.querySelectorAll(
      ".schedule-column .schedule-items"
    );

    columns.forEach((column) => {
      column.addEventListener("dragover", (e) => {
        e.preventDefault(); // 드래그 중 기본 동작 방지
        column.classList.add("dragover"); // 드래그 중인 시각적 효과 추가
      });

      column.addEventListener("dragleave", () => {
        column.classList.remove("dragover"); // 드래그 중인 시각적 효과 제거
      });

      column.addEventListener("drop", async (e) => {
        e.preventDefault();
        column.classList.remove("dragover");

        const id = e.dataTransfer.getData("text/plain"); // 드래그된 일정 ID 가져오기
        const newPriority = column.parentElement.id.replace("-priority", ""); // 새로운 우선순위 계산

        // 기존 우선순위와 비교
        const schedule = cachedSchedules.find((s) => s.id === id);
        if (schedule.priority === newPriority) {
          console.log("Priority unchanged. Skipping Firestore update.");
          return; // 우선순위가 변경되지 않았으면 업데이트 중단
        }

        try {
          await updateSchedule(id, { priority: newPriority }); // Firestore에서 일정 우선순위 업데이트
          loadSchedules(); // 일정 목록 새로고침
        } catch (error) {
          console.error("Error updating schedule:", error);
        }
      });
    });

    document.querySelectorAll(".schedule-item").forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", item.dataset.id); // 드래그 시작 시 일정 ID 저장
        e.dataTransfer.effectAllowed = "move"; // 드래그 효과 설정
      });

      item.addEventListener("dragend", () => {
        columns.forEach((column) => column.classList.remove("dragover")); // 드래그 종료 시 효과 제거
      });
    });
  }

  // 초기 일정 목록 로드
  loadSchedules();
}
