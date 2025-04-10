import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/auth.js";

const routes = {
  "/": () => import("./pages/dashboard.js"), // 대시보드
  "/login": () => import("./pages/login.js"), // 로그인 페이지
  "/signup": () => import("./pages/signup.js"), // 회원가입 페이지
  "/planner": () => import("./pages/planner.js"), // 플래너 페이지
  "/chat": () => import("./pages/chat.js"), // 채팅 페이지
};

// CSS 동적 로드 함수
function loadCSS(filePath) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = filePath;
  document.head.appendChild(link);
}

let isAuthInitialized = false;

function initLogoutButton() {
  if (isAuthInitialized) return; // 중복 초기화 방지
  isAuthInitialized = true;

  const logoutButton = document.getElementById("logout-button");
  if (!logoutButton) return;

  onAuthStateChanged(auth, (user) => {
    if (user) {
      logoutButton.classList.remove("hidden");
    } else {
      logoutButton.classList.add("hidden");
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      await auth.signOut();
      window.location.hash = "/login";
    } catch (error) {
      console.error("Error during logout:", error);
    }
  });
}

// 라우터 초기화 함수
export function initRouter() {
  initLogoutButton(); // 로그아웃 버튼 초기화
  window.addEventListener("hashchange", loadRoute);
  loadRoute();
}

// 라우트 로드 함수
async function loadRoute() {
  const path = window.location.hash.slice(1) || "/";
  const pageModule = routes[path];

  // 공통 CSS 로드
  loadCSS("/styles/main.css");
  loadCSS("/styles/components/header.css");
  loadCSS("/styles/components/footer.css");

  // 페이지별 CSS 로드
  if (path === "/planner") {
    loadCSS("/styles/planner.css");
  } else if (path === "/chat") {
    loadCSS("/styles/components/chat.css");
  }

  // 보호된 라우트 처리
  if (path === "/planner" || path === "/") {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.hash = "/login";
      } else {
        const page = await pageModule();
        document.getElementById("app").innerHTML = "";
        page.render(document.getElementById("app"));
      }
    });
  } else {
    const page = await pageModule();
    document.getElementById("app").innerHTML = "";
    page.render(document.getElementById("app"));
  }
}
