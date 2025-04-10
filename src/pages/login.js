import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/auth.js"; // Firebase Authentication 객체 가져오기

export function render(container) {
  container.innerHTML = `
    <h1>Login</h1>
    <form id="login-form">
      <input type="email" id="email" placeholder="Email" required />
      <input type="password" id="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
    <p>Don't have an account? <a href="#/signup">Sign up</a></p>
  `;

  const form = document.getElementById("login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // 폼 제출 기본 동작 방지
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      // Firebase Authentication을 사용하여 로그인
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      window.location.hash = "/"; // 로그인 후 홈 페이지로 이동
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  });
}
