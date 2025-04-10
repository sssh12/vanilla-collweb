// Firebase Authentication에서 회원가입 함수 가져오기
import { createUserWithEmailAndPassword } from "firebase/auth";
// Firebase Authentication 객체 가져오기
import { auth } from "../firebase/auth.js";

// 회원가입 페이지 렌더링 함수
export function render(container) {
  // 회원가입 UI 생성
  container.innerHTML = `
    <h1>Sign Up</h1>
    <form id="signup-form">
      <input type="email" id="email" placeholder="Email" required />
      <input type="password" id="password" placeholder="Password" required />
      <input type="password" id="confirm-password" placeholder="Confirm Password" required />
      <button type="submit">Sign Up</button>
    </form>
    <p>Already have an account? <a href="#/login">Log in</a></p>
  `;

  // 폼 제출 이벤트 리스너 추가
  const form = document.getElementById("signup-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // 폼 제출 기본 동작 방지

    // 사용자가 입력한 이메일과 비밀번호 가져오기
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // 비밀번호 확인
    if (password !== confirmPassword) {
      alert("Passwords do not match. Please try again.");
      return; // 비밀번호가 일치하지 않으면 회원가입 중단
    }

    try {
      // Firebase Authentication을 사용하여 회원가입 요청
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Sign up successful!"); // 성공 메시지 표시
      window.location.hash = "/login"; // 회원가입 후 로그인 페이지로 이동
    } catch (error) {
      // 회원가입 실패 시 오류 메시지 표시
      alert("Sign up failed: " + error.message);
    }
  });
}
