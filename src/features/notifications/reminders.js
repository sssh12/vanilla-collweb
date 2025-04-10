import { showNotification } from "./notification.js";

// 알림 설정 함수
export function setReminder(schedule) {
  const reminderTime = new Date(schedule.date).getTime() - 10 * 60 * 1000; // 10분 전 알림
  const currentTime = Date.now();

  if (reminderTime > currentTime) {
    const timeout = reminderTime - currentTime;
    setTimeout(() => {
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

      showNotification("Reminder", {
        body: `당신의 일정인 "${schedule.title}" 다가왔습니다. ${formattedDate} at ${formattedTime}.`,
      });
    }, timeout);
  }
}
