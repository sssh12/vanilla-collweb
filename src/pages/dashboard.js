// Firebase Authentication에서 현재 사용자 정보 가져오기
import { auth } from "../firebase/auth.js";

export function render(container) {
  // 현재 로그인한 사용자 정보 가져오기
  const user = auth.currentUser;

  // 대시보드 UI 생성
  container.innerHTML = `
    <h1>Welcome to the Dashboard</h1>
    <p>Hello, ${user ? user.email : "Guest"}!</p>
    <button id="logout-button">Log Out</button>
    <a href="#/planner">Go to Planner</a>
  `;

  // 로그아웃 버튼 이벤트 리스너 추가
  const logoutButton = document.getElementById("logout-button");
  logoutButton.addEventListener("click", async () => {
    try {
      await auth.signOut(); // Firebase 로그아웃
      alert("You have been logged out.");
      window.location.hash = "/login"; // 로그아웃 후 로그인 페이지로 이동
    } catch (error) {
      alert("Failed to log out: " + error.message);
    }
  });
}
