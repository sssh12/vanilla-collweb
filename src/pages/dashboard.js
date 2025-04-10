// Firebase Authentication에서 현재 사용자 정보 가져오기
import { auth } from "../firebase/auth.js";

export function render(container) {
  // 현재 로그인한 사용자 정보 가져오기
  const user = auth.currentUser;

  // 대시보드 UI 생성
  container.innerHTML = `
    <div class="dashboard-container">
      <img src="assets/images/logo.png" alt="Logo" class="dashboard-logo" />
      <h2>반갑습니다, <span id="user-email">${
        user ? user.email : "Guest"
      }</span>!</h2>
      <a href="#/planner" class="link-button">Go to Planner</a>
    </div>
    <div id="error-message" style="color: red; margin-top: 10px;"></div> <!-- 에러 메시지 표시 영역 -->
  `;
}
