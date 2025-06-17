import { initRouter } from "./router.js";
import { initInviteNotificationBadge } from "./features/notifications/notification.js";

document.addEventListener("DOMContentLoaded", () => {
  initRouter(); // 라우터 초기화
  initInviteNotificationBadge();
});
