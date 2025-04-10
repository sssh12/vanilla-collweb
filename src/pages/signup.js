import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/auth.js";

export function render(container) {
  container.innerHTML = `
    <h1>Sign Up</h1>
    <form id="signup-form">
      <input type="email" id="email" placeholder="Email" required />
      <input type="password" id="password" placeholder="Password" required />
      <button type="submit">Sign Up</button>
    </form>
    <p>Already have an account? <a href="#/login">Log in</a></p>
  `;

  const form = document.getElementById("signup-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Sign up successful!");
      window.location.hash = "/login"; // 회원가입 후 로그인 페이지로 이동
    } catch (error) {
      alert("Sign up failed: " + error.message);
    }
  });
}
