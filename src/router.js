import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/auth.js";

const routes = {
  "/": () => import("./pages/group.js"), // 대시보드
  "/login": () => import("./pages/login.js"), // 로그인 페이지
  "/signup": () => import("./pages/signup.js"), // 회원가입 페이지
  "/planner": () => import("./pages/planner.js"), // 플래너 페이지

  "/group/:groupId": () => import("./pages/groupDetail.js"), // 그룹 상세 페이지
  "/group/:groupId/planner": () => import("./pages/groupPlanner.js"), // 그룹 플래너 페이지
  "/group/:groupId/chat": () => import("./pages/groupChat.js"), // 그룹 채팅 페이지
  "/join/:groupId": () => import("./pages/groupJoin.js"), // 그룹 참여 페이지
};

// CSS 동적 로드 함수
function loadCSS(filePath) {
  if (!document.querySelector(`link[href="${filePath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = filePath;
    document.head.appendChild(link);
  }
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
      // 로그아웃 시 사이드바 닫기
      setSidebarState(false);
      // 사이드바 DOM이 있으면 닫기
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) sidebar.classList.add("closed");
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      await auth.signOut();
      setSidebarState(false);
      // 사이드바 DOM에서 완전히 제거
      const sidebarRoot = document.getElementById("sidebar-root");
      if (sidebarRoot) sidebarRoot.innerHTML = "";
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

let currentCleanup = null;

// 라우트 로드 함수
async function loadRoute() {
  let path = window.location.hash.slice(1) || "/";
  let pageModuleLoader = routes[path];

  // 동적 라우트 매칭 추가
  if (!pageModuleLoader) {
    if (/^\/group\/[^/]+$/.test(path)) {
      pageModuleLoader = routes["/group/:groupId"];
    } else if (/^\/group\/[^/]+\/planner$/.test(path)) {
      pageModuleLoader = routes["/group/:groupId/planner"];
    } else if (/^\/group\/[^/]+\/chat$/.test(path)) {
      pageModuleLoader = routes["/group/:groupId/chat"];
    } else if (/^\/join\/[^/]+$/.test(path)) {
      pageModuleLoader = routes["/join/:groupId"];
    }
  }

  // 공통 CSS 로드
  loadCSS("/styles/main.css");
  loadCSS("/styles/components/header.css");
  loadCSS("/styles/components/footer.css");
  loadCSS("/styles/components/sidebar.css");

  // 페이지별 CSS 로드
  if (path === "/planner") {
    loadCSS("/styles/planner.css");
  } else if (path === "/chat") {
    loadCSS("/styles/components/chat.css");
  } else if (/^\/group\/[^/]+\/chat$/.test(path)) {
    loadCSS("/styles/components/chat.css");
  }

  // 보호된 라우트 처리
  // 여기에 "/chat"도 포함시켜야 함!
  if (
    path === "/planner" ||
    path === "/" ||
    path === "/chat" ||
    /^\/group\/[^/]+/.test(path)
  ) {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.hash = "/login";
      } else {
        const pageModule = await pageModuleLoader();
        document.getElementById("app").innerHTML = "";
        // render가 cleanup 함수를 반환하도록!
        currentCleanup = pageModule.render(document.getElementById("app"));
      }
    });
  } else {
    if (!pageModuleLoader) {
      // 404 처리
      document.getElementById("app").innerHTML =
        "<h2>페이지를 찾을 수 없습니다.</h2>";
      return;
    }
    const pageModule = await pageModuleLoader();
    document.getElementById("app").innerHTML = "";
    // render가 cleanup 함수를 반환하도록!
    currentCleanup = pageModule.render(document.getElementById("app"));
  }

  // 로그인/회원가입 등 비회원 페이지 진입 시 사이드바 완전 제거
  if (path === "/login" || path === "/signup") {
    setSidebarState(false);
    const sidebarRoot = document.getElementById("sidebar-root");
    if (sidebarRoot) sidebarRoot.innerHTML = "";
  }

  // 페이지 이동 전 cleanup
  if (typeof currentCleanup === "function") {
    currentCleanup();
    currentCleanup = null;
  }
}
