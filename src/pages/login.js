// Firebase Authentication에서 로그인 함수 가져오기
import { signInWithEmailAndPassword } from "firebase/auth";
// Firebase Authentication 객체 가져오기
import { auth } from "../firebase/auth.js";

// 로그인 페이지 렌더링 함수
export function render(container) {
  // 로그인 UI 생성
  container.innerHTML = `
    <h1>Login</h1>
    <form id="login-form">
      <input type="email" id="email" placeholder="Email" required />
      <input type="password" id="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
    <p>Don't have an account? <a href="#/signup">Sign up</a></p>
  `;

  // 폼 제출 이벤트 리스너 추가
  const form = document.getElementById("login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // 폼 제출 기본 동작 방지

    // 사용자가 입력한 이메일과 비밀번호 가져오기
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      // Firebase Authentication을 사용하여 로그인 요청
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!"); // 성공 메시지 표시
      window.location.hash = "/"; // 로그인 후 대시보드로 이동
    } catch (error) {
      // 로그인 실패 시 오류 메시지 표시
      alert("Login failed: " + error.message);
    }
  });
}
