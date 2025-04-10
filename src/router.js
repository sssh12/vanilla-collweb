// Firebase Authentication에서 인증 상태 확인 함수 가져오기
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/auth.js";

// 라우트 정의
const routes = {
  "/": () => import("./pages/dashboard.js"), // 대시보드
  "/login": () => import("./pages/login.js"), // 로그인 페이지
  "/signup": () => import("./pages/signup.js"), // 회원가입 페이지
  "/planner": () => import("./pages/planner.js"), // 플래너 페이지
};

// 라우터 초기화 함수
export function initRouter() {
  window.addEventListener("hashchange", loadRoute); // URL 변경 시 라우트 로드
  loadRoute(); // 초기 라우트 로드
}

// 라우트 로드 함수
async function loadRoute() {
  const path = window.location.hash.slice(1) || "/"; // 현재 경로 가져오기
  const pageModule = routes[path]; // 경로에 해당하는 페이지 모듈 가져오기

  // 보호된 라우트 처리
  if (path === "/planner" || path === "/") {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
        alert("You must be logged in to access this page.");
        window.location.hash = "/login";
      } else {
        // 인증된 사용자는 해당 페이지 로드
        const page = await pageModule();
        document.getElementById("app").innerHTML = "";
        page.render(document.getElementById("app"));
      }
    });
  } else {
    // 보호되지 않은 페이지 로드
    const page = await pageModule();
    document.getElementById("app").innerHTML = "";
    page.render(document.getElementById("app"));
  }
}
