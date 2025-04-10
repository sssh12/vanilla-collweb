import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/auth.js";

export function render(container) {
  container.innerHTML = `
    <h1>Login</h1>
    <form id="login-form">
      <input type="email" id="email" placeholder="Email" required />
      <input type="password" id="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  `;

  const form = document.getElementById("login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      window.location.hash = "/"; // 로그인 후 홈으로 이동
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  });
}
