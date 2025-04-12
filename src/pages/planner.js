import {
  addSchedule,
  deleteSchedule,
  listenToSchedules,
} from "../features/schedule/utils.js";

import { initDragAndDrop } from "../features/schedule/dragDrop.js";
import {
  setReminder,
  checkSavedReminders,
} from "../features/notifications/reminders.js";
import { requestNotificationPermission } from "../features/notifications/notification.js";
import { getErrorMessage } from "../firebase/errorHandler.js";

import "../../styles/planner.css";
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
        <input type="time" id="time"/>
        <!-- 일정 우선순위 선택 -->
        <select id="priority" required>
          <option value="High">높음</option>
          <option value="Medium">중간</option>
          <option value="Low" selected>낮음</option>
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
  const form = document.getElementById("schedule-form");
  const errorMessageDiv = document.getElementById("error-message");

  // 알림 권한 요청
  requestNotificationPermission();
  checkSavedReminders();

  // 상태 관리 변수
  let cachedSchedules = [];
  let unsubscribeListener = null;

  // 컴포넌트 정리 함수 (메모리 누수 방지)
  function cleanup() {
    if (unsubscribeListener) {
      unsubscribeListener();
      unsubscribeListener = null;
    }
  }

  // 페이지 이동 시 리스너 정리
  window.addEventListener("hashchange", cleanup);

  // 일정 추가 폼 제출 이벤트 처리
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 사용자 입력 가져오기
    const title = document.getElementById("title").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const priority = document.getElementById("priority").value;

    try {
      errorMessageDiv.textContent = "";

      let dateTime;
      let schedule;

      if (time) {
        // 시간 지정된 경우
        dateTime = new Date(`${date}T${time}`);
        schedule = {
          title,
          date: dateTime.toISOString(),
          priority,
          hasTime: true,
        };

        // Firestore에 일정 추가
        const id = await addSchedule(schedule);
        schedule.id = id;

        // 알림 설정
        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
          setReminder(schedule);
        }
      } else {
        // 시간 미지정 경우
        dateTime = new Date(`${date}T00:00:00`);
        schedule = {
          title,
          date: dateTime.toISOString(),
          priority,
          hasTime: false,
        };

        // Firestore에 일정 추가
        await addSchedule(schedule);
      }

      // 폼 초기화
      form.reset();
    } catch (error) {
      errorMessageDiv.textContent = getErrorMessage(error);
    }
  });

  // 일정 데이터를 화면에 표시하는 함수 - 시간순 정렬 유지
  function renderSchedules(schedules) {
    // 시간순으로 정렬
    const sortedSchedules = [...schedules].sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

    // 각 우선순위별로 일정 표시 영역 초기화
    const highPriorityColumn = document.getElementById("High-priority");
    const mediumPriorityColumn = document.getElementById("Medium-priority");
    const lowPriorityColumn = document.getElementById("Low-priority");

    // DOM 요소가 존재하는지 확인
    if (!highPriorityColumn || !mediumPriorityColumn || !lowPriorityColumn) {
      console.error("Priority columns are missing in the DOM.");
      return; // 함수 종료
    }

    const highPriority = highPriorityColumn.querySelector(".schedule-items");
    const mediumPriority =
      mediumPriorityColumn.querySelector(".schedule-items");
    const lowPriority = lowPriorityColumn.querySelector(".schedule-items");

    // 일정 표시 영역 초기화
    highPriority.innerHTML = "";
    mediumPriority.innerHTML = "";
    lowPriority.innerHTML = "";

    // 일정 렌더링 - 정렬된 배열 사용
    sortedSchedules.forEach((schedule) => {
      const scheduleItem = document.createElement("div");
      scheduleItem.className = "schedule-item";
      scheduleItem.setAttribute("draggable", "true");
      scheduleItem.dataset.id = schedule.id;
      scheduleItem.dataset.priority = schedule.priority;

      // 일정 날짜와 시간을 보기 좋게 포맷팅
      const scheduleDate = new Date(schedule.date);
      const formattedDate = scheduleDate.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let displayText = "";
      if (schedule.hasTime) {
        const formattedTime = scheduleDate.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        displayText = `<strong>${schedule.title}</strong> - ${formattedDate} ${formattedTime}`;
      } else {
        displayText = `<strong>${schedule.title}</strong> - ${formattedDate}`;
      }

      scheduleItem.innerHTML = `
        <p>${displayText}</p>
        <button class="delete-button">Delete</button>
      `;

      // 삭제 버튼
      const deleteButton = scheduleItem.querySelector(".delete-button");

      deleteButton.addEventListener("click", async () => {
        try {
          deleteButton.disabled = true;
          await deleteSchedule(schedule.id);
          scheduleItem.remove();
        } catch (error) {
          console.error("Error deleting schedule:", error);
          deleteButton.disabled = false;
          errorMessageDiv.textContent = `일정 삭제 중 오류가 발생했습니다: ${error.message}`;
        }
      });

      // 우선순위별 배치
      if (schedule.priority === "High") {
        highPriority.appendChild(scheduleItem);
      } else if (schedule.priority === "Medium") {
        mediumPriority.appendChild(scheduleItem);
      } else if (schedule.priority === "Low") {
        lowPriority.appendChild(scheduleItem);
      }
    });

    // 드래그 앤 드롭 초기화
    initDragAndDrop("High-priority");
    initDragAndDrop("Medium-priority");
    initDragAndDrop("Low-priority");
  }

  // 실시간 리스닝 설정
  function setupSchedulesListener() {
    // 리스너가 없을 때만 설정
    if (!unsubscribeListener) {
      unsubscribeListener = listenToSchedules((schedules) => {
        // 데이터가 실제로 변경된 경우만 UI 업데이트
        const schedulesJSON = JSON.stringify(schedules);
        if (schedulesJSON !== JSON.stringify(cachedSchedules)) {
          cachedSchedules = JSON.parse(schedulesJSON);
          renderSchedules(cachedSchedules);
        }
      });
    }
  }

  // 데이터 리스닝 시작
  setupSchedulesListener();
}
