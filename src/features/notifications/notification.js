// 브라우저 알림 권한 요청
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.error("이 브라우저는 알림을 지원하지 않습니다.");
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

// 알림 생성 함수
export function showNotification(title, options) {
  if (Notification.permission === "granted") {
    new Notification(title, options);
  } else {
    console.error("알림 권한이 부여되지 않았습니다.");
  }
}
