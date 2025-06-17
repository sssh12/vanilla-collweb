import {
  addSchedule,
  deleteSchedule,
  listenToGroupSchedules,
} from "../features/schedule/utils.js";
import { initDragAndDrop } from "../features/schedule/dragDrop.js";
import {
  setReminder,
  checkSavedReminders,
} from "../features/notifications/reminders.js";
import { requestNotificationPermission } from "../features/notifications/notification.js";
import { getErrorMessage } from "../firebase/errorHandler.js";
import { auth } from "../firebase/auth.js";
import { renderSidebar } from "../components/sidebar.js";
import { db } from "../firebase/firestore.js";
import { getDoc, doc } from "firebase/firestore";
import { openScheduleModal } from "../components/ScheduleModal.js";
import "../../assets/styles/planner.css";

export async function render(container) {
  // groupId 파싱
  const hash = window.location.hash;
  const match = hash.match(/^#\/group\/([^/]+)\/planner/);
  const groupId = match ? match[1] : null;

  if (!groupId || typeof groupId !== "string") {
    container.innerHTML = "<div>잘못된 그룹 접근입니다.</div>";
    return;
  }

  // 그룹 정보 및 멤버 가져오기
  let groupName = "";
  let isMember = false;
  let members = [];
  if (groupId) {
    try {
      const groupDoc = await getDoc(doc(db, "groups", groupId));
      if (groupDoc.exists()) {
        const group = groupDoc.data();
        groupName = group.name || "";
        members = group.members || [];
        const user = auth.currentUser;
        if (user && group.membersUid && group.membersUid.includes(user.uid)) {
          isMember = true;
        }
      }
    } catch (e) {
      groupName = "";
    }
  }

  // 사이드바와 "로딩 중"을 즉시 렌더
  renderSidebar(document.getElementById("sidebar-root"), "group-planner", {
    groupName: "",
    groupId,
  });
  container.innerHTML = `
    <div class="planner-container" style="max-width:800px; margin:2rem auto; text-align:center;">
      <h2>그룹 플래너</h2>
      <p>로딩 중...</p>
    </div>
  `;

  // 그룹명 등 정보가 바뀌었으면 사이드바만 다시 렌더
  renderSidebar(document.getElementById("sidebar-root"), "group-planner", {
    groupName,
    groupId,
  });

  // 멤버가 아니면 안내 메시지
  if (!isMember) {
    container.innerHTML = `
      <div class="planner-container" style="max-width:500px; margin:2rem auto; text-align:center;">
        <h2>접근 불가</h2>
        <p>이 그룹의 멤버가 아니므로 그룹 플래너를 볼 수 없습니다.</p>
        <a href="#/" class="link-button">돌아가기</a>
      </div>
    `;
    return;
  }

  // 멤버라면 정상 플래너 렌더링 (개인 플래너와 거의 동일)
  container.innerHTML = `
    <div class="planner-container" >
      <h2 style="text-align:left; margin-bottom:1.5rem;">
        ${
          groupName
            ? `<span style="font-size:1.2rem; color:#007bff;">${groupName}</span> 그룹 플래너`
            : "그룹 플래너"
        }
      </h2>
      <form id="schedule-form">
        <input type="text" id="title" placeholder="일정 제목" required />
        <input type="date" id="date" required />
        <input type="time" id="time"/>
        <select id="priority" required>
          <option value="High">높음</option>
          <option value="Medium">중간</option>
          <option value="Low" selected>낮음</option>
        </select>
        <button type="submit">작성하기</button>
      </form>
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
      <div id="error-message" style="color: red; margin-top: 10px;"></div>
    </div>
  `;

  const form = document.getElementById("schedule-form");
  const errorMessageDiv = document.getElementById("error-message");

  function clearErrorMessage() {
    errorMessageDiv.textContent = "";
  }

  requestNotificationPermission();
  checkSavedReminders();

  let cachedSchedules = [];
  let unsubscribeListener = null;
  function setupSchedulesListener() {
    if (unsubscribeListener) {
      unsubscribeListener();
      unsubscribeListener = null;
    }
    // groupId가 문자열인지 확인
    if (typeof groupId === "string" && groupId) {
      unsubscribeListener = listenToGroupSchedules(groupId, renderSchedules);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const title = document.getElementById("title").value;
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;
    const priority = document.getElementById("priority").value;

    try {
      clearErrorMessage();
      let dateTime;
      let schedule;

      if (time) {
        dateTime = new Date(`${date}T${time}`);
        schedule = {
          title,
          date: dateTime.toISOString(),
          priority,
          hasTime: true,
        };
        await addSchedule({ ...schedule, groupId, userId: user.uid });
        const hasPermission = await requestNotificationPermission();
        if (hasPermission) setReminder(schedule);
      } else {
        dateTime = new Date(`${date}T00:00:00`);
        schedule = {
          title,
          date: dateTime.toISOString(),
          priority,
          hasTime: false,
        };
        await addSchedule({ ...schedule, groupId, userId: user.uid });
      }
      form.reset();
      clearErrorMessage();
    } catch (error) {
      errorMessageDiv.textContent = getErrorMessage(error);
    }
  });

  // 일정 렌더링 함수에서 작성자 이메일+직책 표시
  function renderSchedules(schedules) {
    clearErrorMessage();
    const sortedSchedules = [...schedules].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    const highPriorityColumn = document.getElementById("High-priority");
    const mediumPriorityColumn = document.getElementById("Medium-priority");
    const lowPriorityColumn = document.getElementById("Low-priority");

    const highPriority = highPriorityColumn.querySelector(".schedule-items");
    const mediumPriority =
      mediumPriorityColumn.querySelector(".schedule-items");
    const lowPriority = lowPriorityColumn.querySelector(".schedule-items");

    highPriority.innerHTML = "";
    mediumPriority.innerHTML = "";
    lowPriority.innerHTML = "";

    schedules.forEach((schedule) => {
      const progressClass =
        schedule.progress === "done" ? "progress-done" : "progress-doing";
      const scheduleItem = document.createElement("div");
      scheduleItem.className = `schedule-item ${progressClass}`;
      scheduleItem.setAttribute("draggable", "true");
      scheduleItem.dataset.id = schedule.id;
      scheduleItem.dataset.priority = schedule.priority;

      // 작성자 정보 찾기
      const member = members.find((m) => m.uid === schedule.userId);
      const email = member ? member.email : "알 수 없음";
      const role = member ? member.role : "";

      // 날짜/시간 포맷
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

      // ★ 작성자 이메일과 직책 표시 추가
      scheduleItem.innerHTML = `
        <div class="schedule-drag-handle">
          <span class="drag-icon">☰</span>
        </div>
        <p>${displayText}</p>
        <div class="schedule-meta" style="font-size:0.95em;color:#888;">
          <span>${email}</span>
          ${role ? `<span style="margin-left:0.5em;">[${role}]</span>` : ""}
        </div>
        <button class="delete-button">Delete</button>
      `;

      const deleteButton = scheduleItem.querySelector(".delete-button");
      deleteButton.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          deleteButton.disabled = true;
          await deleteSchedule(schedule.id);
          scheduleItem.remove();
          clearErrorMessage();
        } catch (error) {
          deleteButton.disabled = false;
          errorMessageDiv.textContent = getErrorMessage(error);
        }
      });

      // 일정 클릭 시 모달 열기
      scheduleItem.addEventListener("click", () => {
        openScheduleModal(schedule, null, members);
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

    initDragAndDrop("High-priority");
    initDragAndDrop("Medium-priority");
    initDragAndDrop("Low-priority");
  }

  setupSchedulesListener();

  // cleanup 함수 반환
  return function cleanup() {
    if (unsubscribeListener) {
      unsubscribeListener();
      unsubscribeListener = null;
    }
  };
}
