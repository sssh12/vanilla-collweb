import { auth } from "../firebase/auth.js";

const ICON_MENU = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect y="6" width="28" height="3" rx="1.5" fill="#007bff"/><rect y="13" width="28" height="3" rx="1.5" fill="#007bff"/><rect y="20" width="28" height="3" rx="1.5" fill="#007bff"/></svg>`;
const ICON_CLOSE = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><line x1="6" y1="6" x2="22" y2="22" stroke="#007bff" stroke-width="3" stroke-linecap="round"/><line x1="22" y1="6" x2="6" y2="22" stroke="#007bff" stroke-width="3" stroke-linecap="round"/></svg>`;

function getSidebarState() {
  return localStorage.getItem("sidebarState") === "open";
}
function setSidebarState(isOpen) {
  localStorage.setItem("sidebarState", isOpen ? "open" : "closed");
}

export function renderSidebar(container, activeMenu = "group", options = {}) {
  const { groupName, groupId } = options;
  const user = auth.currentUser;
  if (!user) {
    container.innerHTML = ""; // 아예 사이드바를 렌더하지 않음
    return;
  }

  container.innerHTML = `
    <nav class="sidebar" id="sidebar-nav">
      <ul class="sidebar-menu">
        <li class="${activeMenu === "group" ? "active" : ""}">
          <a href="#/">그룹</a>
        </li>
        <li class="${activeMenu === "planner" ? "active" : ""}">
          <a href="#/planner">개인 플래너</a>
        </li>
        ${
          activeMenu === "group-planner" && groupId
            ? `<li class="active">
                <a href="#/group/${groupId}/planner" style="color:#007bff; font-weight:bold;">
                  ${groupName ? groupName + " " : ""}그룹 플래너
                </a>
              </li>`
            : ""
        }
        ${
          activeMenu === "group-chat" && groupId
            ? `<li class="active">
                <a href="#/group/${groupId}/chat" style="color:#007bff; font-weight:bold;">
                  ${groupName ? groupName + " " : ""}그룹 채팅
                </a>
              </li>`
            : ""
        }
      </ul>
    </nav>
  `;

  const sidebar = container.querySelector("#sidebar-nav");
  const toggleBtn = document.getElementById("sidebar-toggle");
  if (toggleBtn && sidebar) {
    // 상태에 따라 초기화
    const isOpen = getSidebarState();
    if (isOpen) {
      sidebar.classList.remove("closed");
      toggleBtn.innerHTML = `<span class="sidebar-toggle-icon">${ICON_CLOSE}</span>`;
      toggleBtn.setAttribute("aria-label", "메뉴 닫기");
    } else {
      sidebar.classList.add("closed");
      toggleBtn.innerHTML = `<span class="sidebar-toggle-icon">${ICON_MENU}</span>`;
      toggleBtn.setAttribute("aria-label", "메뉴 열기");
    }

    toggleBtn.onclick = () => {
      const nowOpen = sidebar.classList.toggle("closed") === false;
      setSidebarState(nowOpen);
      if (nowOpen) {
        toggleBtn.innerHTML = `<span class="sidebar-toggle-icon">${ICON_CLOSE}</span>`;
        toggleBtn.setAttribute("aria-label", "메뉴 닫기");
      } else {
        toggleBtn.innerHTML = `<span class="sidebar-toggle-icon">${ICON_MENU}</span>`;
        toggleBtn.setAttribute("aria-label", "메뉴 열기");
      }
    };
  }
}
