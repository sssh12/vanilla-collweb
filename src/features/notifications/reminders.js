// 알림을 화면에 표시하는 함수 가져오기
import { showNotification } from "./notification.js";

// 일정에 대한 알림을 설정하는 함수
export function setReminder(schedule) {
  // 시간 정보가 없는 경우 알림을 설정하지 않음
  if (!schedule.hasTime) {
    console.log("Schedule has no time information. Skipping reminder.");
    return;
  }

  const reminderTime = new Date(schedule.date).getTime() - 10 * 60 * 1000; // 10분 전
  const currentTime = Date.now();

  if (reminderTime <= currentTime) {
    console.log("Reminder time has already passed.");
    return;
  }

  const timeout = reminderTime - currentTime;

  // 브라우저의 setTimeout 한계를 고려 (약 24.8일)
  const MAX_TIMEOUT = 2147483647; // 약 24.8일

  if (timeout > MAX_TIMEOUT) {
    console.log(
      "Reminder time is too far in future. Setting a check timer instead."
    );

    // 나중에 다시 확인하기 위한 타이머 설정 (하루 단위로)
    setTimeout(() => {
      setReminder(schedule); // 재귀적으로 다시 확인
    }, 24 * 60 * 60 * 1000); // 하루 후 다시 체크

    return;
  }

  console.log(
    `Setting reminder for "${schedule.title}" in ${Math.floor(
      timeout / 1000 / 60
    )} minutes`
  );

  // 로컬 스토리지에 알림 정보 저장 (페이지 새로고침이나 재방문시에도 작동하도록)
  const reminders = JSON.parse(localStorage.getItem("reminders") || "[]");
  reminders.push({
    id: schedule.id,
    title: schedule.title,
    time: reminderTime,
  });
  localStorage.setItem("reminders", JSON.stringify(reminders));

  // 알림 설정
  setTimeout(() => {
    showNotification("일정 알림", {
      body: `일정 "${schedule.title}"이(가) 10분 후에 시작됩니다.`,
      icon: "/assets/images/logo.png",
    });

    // 알림이 표시된 후 로컬 스토리지에서 제거
    removeReminderFromStorage(schedule.id);
  }, timeout);
}

// 로컬 스토리지에서 알림 제거
function removeReminderFromStorage(id) {
  const reminders = JSON.parse(localStorage.getItem("reminders") || "[]");
  const updatedReminders = reminders.filter((r) => r.id !== id);
  localStorage.setItem("reminders", JSON.stringify(updatedReminders));
}

// 페이지 로드 시 저장된 알림 확인 함수
export function checkSavedReminders() {
  const reminders = JSON.parse(localStorage.getItem("reminders") || "[]");
  const currentTime = Date.now();

  reminders.forEach((reminder) => {
    const timeLeft = reminder.time - currentTime;

    if (timeLeft <= 0) {
      // 이미 지난 알림은 바로 표시하고 제거
      showNotification("일정 알림", {
        body: `일정 "${reminder.title}"이(가) 시작되었습니다.`,
        icon: "/assets/images/logo.png",
      });
      removeReminderFromStorage(reminder.id);
    } else if (timeLeft < MAX_TIMEOUT) {
      // 아직 도래하지 않은 알림은 다시 타이머 설정
      setTimeout(() => {
        showNotification("일정 알림", {
          body: `일정 "${reminder.title}"이(가) 10분 후에 시작됩니다.`,
          icon: "/assets/images/logo.png",
        });
        removeReminderFromStorage(reminder.id);
      }, timeLeft);
    }
  });
}
