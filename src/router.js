const routes = {
  "/": () => import("./pages/home.js"),
  "/schedule": () => import("./pages/schedule.js"),
  "/chat": () => import("./pages/chat.js"),
  "/login": () => import("./pages/login.js"), // 로그인 페이지
  "/signup": () => import("./pages/signup.js"), // 회원가입 페이지
};

export function initRouter() {
  window.addEventListener("hashchange", loadRoute);
  loadRoute();
}

async function loadRoute() {
  const path = window.location.hash.slice(1) || "/";
  console.log("Current path:", path); // 현재 경로 출력
  const pageModule = routes[path];

  if (pageModule) {
    const page = await pageModule();
    document.getElementById("app").innerHTML = "";
    page.render(document.getElementById("app"));
  } else {
    document.getElementById("app").innerHTML = "<h1>404 - Page Not Found</h1>";
  }
}
