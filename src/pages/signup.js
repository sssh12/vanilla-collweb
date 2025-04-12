// Firebase Authentication에서 회원가입 함수 가져오기
import { createUserWithEmailAndPassword } from "firebase/auth";
// Firebase Authentication 객체 가져오기
import { auth } from "../firebase/auth.js";
// Firebase 에러 메시지 처리 함수 가져오기
import { getErrorMessage } from "../firebase/errorHandler.js";

// 회원가입 페이지 렌더링 함수
export function render(container) {
  // 회원가입 UI 생성
  container.innerHTML = `
    <h1>회원 가입</h1>
    <form id="signup-form">
      <input type="email" id="email" placeholder="이메일" required />
      <input type="password" id="password" placeholder="비밀번호" required />
      <input type="password" id="confirm-password" placeholder="비밀번호 확인" required />
      <button type="submit">가입하기</button>
    </form>
    <div id="error-message" style="color: red; margin-top: 10px;"></div> <!-- 에러 메시지 표시 영역 -->
    <p>이미 계정이 있으신가요? <a href="#/login">로그인</a></p>
  `;

  // 폼 제출 이벤트 리스너 추가
  const form = document.getElementById("signup-form");
  const errorMessageDiv = document.getElementById("error-message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // 폼 제출 기본 동작 방지

    // 사용자가 입력한 이메일과 비밀번호 가져오기
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // 비밀번호 확인
    if (password !== confirmPassword) {
      errorMessageDiv.textContent =
        "비밀번호가 일치하지 않습니다. 다시 입력해주세요."; // 비밀번호 불일치 에러 메시지
      return; // 비밀번호가 일치하지 않으면 회원가입 중단
    }

    try {
      // Firebase Authentication을 사용하여 회원가입 요청
      errorMessageDiv.textContent = ""; // 에러 메시지 초기화
      await createUserWithEmailAndPassword(auth, email, password);
      window.location.hash = "/login"; // 회원가입 후 로그인 페이지로 이동
    } catch (error) {
      // 회원가입 실패 시 오류 메시지 표시
      errorMessageDiv.textContent = getErrorMessage(error); // 에러 메시지 표시
    }
  });
}
