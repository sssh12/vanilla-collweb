// 알림을 화면에 표시하는 함수 가져오기
import { showNotification } from "./notification.js";

// 일정에 대한 알림을 설정하는 함수
export function setReminder(schedule) {
  const reminderTime = new Date(schedule.date).getTime() - 10 * 60 * 1000;
  const currentTime = Date.now();

  if (reminderTime <= currentTime) {
    console.log("Reminder time is in the past. Skipping reminder.");
    return;
  }

  const timeout = reminderTime - currentTime;
  setTimeout(() => {
    showNotification("Reminder", {
      body: `당신의 일정 "${schedule.title}"이(가) 10분 남았습니다.`,
    });
  }, timeout);
}
