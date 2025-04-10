// Firebase Authentication에서 현재 사용자 정보 가져오기
import { auth } from "../firebase/auth.js";

export function render(container) {
  // 현재 로그인한 사용자 정보 가져오기
  const user = auth.currentUser;

  // 대시보드 UI 생성
  container.innerHTML = `
    <h1>Welcome to the Dashboard</h1>
    <p>반갑습니다, ${user ? user.email : "Guest"}!</p>
    <button id="logout-button">로그아웃</button>
    <div id="error-message" style="color: red; margin-top: 10px;"></div> <!-- 에러 메시지 표시 영역 -->
    <a href="#/planner">플래너</a>
  `;

  // 로그아웃 버튼 이벤트 리스너 추가
  const logoutButton = document.getElementById("logout-button");
  const errorMessageDiv = document.getElementById("error-message");

  logoutButton.addEventListener("click", async () => {
    try {
      errorMessageDiv.textContent = ""; // 에러 메시지 초기화
      await auth.signOut(); // Firebase 로그아웃
      window.location.hash = "/login"; // 로그아웃 후 로그인 페이지로 이동
    } catch (error) {
      // 로그아웃 실패 시 오류 메시지 표시
      errorMessageDiv.textContent = `Error: ${error.message}`; // 에러 메시지 표시
    }
  });
}
