import { listenToMyGroups, createGroup } from "../features/group/group.js";
import { auth } from "../firebase/auth.js";
import { renderSidebar } from "../components/sidebar.js";

export function render(container) {
  const sidebarToggle = document.getElementById("sidebar-toggle");
  if (sidebarToggle) sidebarToggle.style.display = "";

  // 로그인한 사용자 정보
  const user = auth.currentUser;

  container.innerHTML = `
    <div class="dashboard-container" style="margin:0;max-width:900px;">
      <h2 style="margin-bottom:0.5rem;">환영합니다, <span style="color:#007bff;">${
        user?.email || ""
      }</span>님!</h2>
     
      <form id="create-group-form" style="margin-bottom:2rem;display:flex;gap:1rem;align-items:center;">
        <input type="text" id="group-name" placeholder="새 그룹 이름" required style="flex:1;"/>
        <button type="submit" style="min-width:120px;">그룹 생성</button>
      </form>
      <div id="group-list-container">
        <ul id="group-list" class="group-list"></ul>
      </div>
      <div id="group-error" style="color:red; margin-top:10px;"></div>
    </div>
  `;
  renderSidebar(document.getElementById("sidebar-root"), "group");

  const groupList = container.querySelector("#group-list");
  const form = container.querySelector("#create-group-form");
  const errorDiv = container.querySelector("#group-error");

  // 실시간 그룹 목록 리스너
  let unsubscribe = null;
  function setupGroupListener() {
    if (unsubscribe) unsubscribe();
    unsubscribe = listenToMyGroups((groups) => {
      if (groups.length === 0) {
        groupList.innerHTML = `<li style="color:#888;text-align:center;padding:2rem 0;grid-column:1/3;">가입된 그룹이 없습니다.<br>새 그룹을 만들어보세요!</li>`;
      } else {
        groupList.innerHTML = groups
          .map(
            (g) => `
      <li class="group-card" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px #0001;padding:1.2rem;margin-bottom:1.2rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;">
        <div>
          <a href="#/group/${
            g.id
          }" style="font-size:1.2rem;font-weight:bold;color:#007bff;text-decoration:none;">${
              g.name
            }</a>
          <div style="font-size:0.95rem;color:#666;margin-top:0.3rem;">
            생성일: ${
              g.createdAt
                ? new Date(g.createdAt).toLocaleDateString("ko-KR")
                : "-"
            }
            &nbsp;|&nbsp; 멤버: ${g.members ? g.members.length : 1}명
          </div>
        </div>
        <div style="display:flex;gap:0.5rem;">
          <a href="#/group/${g.id}/planner" class="link-button">플래너</a>
          <a href="#/group/${g.id}/chat" class="link-button">채팅</a>
        </div>
      </li>
    `
          )
          .join("");
      }
    });
  }
  setupGroupListener();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorDiv.textContent = "";
    const name = container.querySelector("#group-name").value.trim();
    if (!name) return;
    try {
      await createGroup(name);
      form.reset();
    } catch (err) {
      errorDiv.textContent = err.message || "그룹 생성 실패";
    }
  });

  return function cleanup() {
    if (unsubscribe) unsubscribe();
  };
}
