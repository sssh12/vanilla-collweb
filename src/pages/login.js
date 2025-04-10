// Firebase Authentication에서 로그인 함수 가져오기
import { signInWithEmailAndPassword } from "firebase/auth";
// Firebase Authentication 객체 가져오기
import { auth } from "../firebase/auth.js";

// 로그인 페이지 렌더링 함수
export function render(container) {
  // 로그인 UI 생성
  container.innerHTML = `
    <h1>로그인</h1>
    <form id="login-form">
      <input type="email" id="email" placeholder="이메일" required />
      <input type="password" id="password" placeholder="비밀번호" required />
      <button type="submit">로그인</button>
    </form>
    <div id="error-message" style="color: red; margin-top: 10px;"></div> <!-- 에러 메시지 표시 영역 -->
    <p>계정이 없으신가요? <a href="#/signup">회원 가입</a></p>
  `;

  // 폼 제출 이벤트 리스너 추가
  const form = document.getElementById("login-form");
  const errorMessageDiv = document.getElementById("error-message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // 폼 제출 기본 동작 방지

    // 사용자가 입력한 이메일과 비밀번호 가져오기
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      // Firebase Authentication을 사용하여 로그인 요청
      errorMessageDiv.textContent = ""; // 에러 메시지 초기화
      await signInWithEmailAndPassword(auth, email, password);
      window.location.hash = "/"; // 로그인 후 대시보드로 이동
    } catch (error) {
      // 로그인 실패 시 오류 메시지 표시
      errorMessageDiv.textContent = `Error: ${error.message}`; // 에러 메시지 표시
    }
  });
}
