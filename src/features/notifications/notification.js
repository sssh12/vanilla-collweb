// 브라우저에서 알림 권한을 요청하는 함수
export async function requestNotificationPermission() {
  // 브라우저가 알림을 지원하지 않을 경우
  if (!("Notification" in window)) {
    console.error("이 브라우저는 알림을 지원하지 않습니다.");
    return false;
  }

  // 이미 권한이 부여된 경우
  if (Notification.permission === "granted") {
    return true;
  }

  // 권한이 명시적으로 거부된 경우
  if (Notification.permission === "denied") {
    alert("브라우저 설정에서 알림 권한을 허용해주세요.");
    return false;
  }

  // 사용자에게 알림 권한 요청
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("알림 권한이 거부되었습니다.");
      return false;
    }
    return true;
  } catch (error) {
    console.error("알림 권한 요청 중 오류 발생:", error);
    return false;
  }
}

// 알림을 화면에 표시하는 함수
export function showNotification(title, options) {
  // 알림 권한이 허용된 경우에만 알림 생성
  if (Notification.permission === "granted") {
    try {
      const notification = new Notification(title, options);

      // 알림 클릭 이벤트
      notification.onclick = function () {
        window.focus(); // 창에 포커스
        this.close(); // 알림 닫기
      };

      // 알림 자동 닫힘 (5초 후)
      setTimeout(() => notification.close(), 5000);

      return notification;
    } catch (error) {
      console.error("알림 생성 중 오류 발생:", error);
    }
  } else {
    console.log("알림 권한이 부여되지 않았습니다.");
    requestNotificationPermission(); // 권한 다시 요청 시도
  }
}

// 페이지 로드 시 저장된 알림 확인
export function initNotifications() {
  // 다른 파일에서 import 필요
  if (typeof checkSavedReminders === "function") {
    checkSavedReminders();
  }
}
