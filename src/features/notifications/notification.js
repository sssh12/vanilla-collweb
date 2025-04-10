// 브라우저에서 알림 권한을 요청하는 함수
export async function requestNotificationPermission() {
  // 브라우저가 알림을 지원하지 않을 경우
  if (!("Notification" in window)) {
    console.error("이 브라우저는 알림을 지원하지 않습니다.");
    return false;
  }

  // 사용자에게 알림 권한 요청
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("알림 권한이 거부되었습니다. 알림을 받으려면 권한을 허용해주세요.");
    return false;
  }

  return true;
}

// 알림을 화면에 표시하는 함수
export function showNotification(title, options) {
  // 알림 권한이 허용된 경우에만 알림 생성
  if (Notification.permission === "granted") {
    new Notification(title, options); // 알림 생성
  } else {
    console.error("알림 권한이 부여되지 않았습니다.");
  }
}
