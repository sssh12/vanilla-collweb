import { renderSidebar } from "../components/sidebar.js";
import { listenToGroupChats, sendGroupChat } from "../features/chat/chat.js";
import { auth } from "../firebase/auth.js";
import { db } from "../firebase/firestore.js";
import { doc, getDoc } from "firebase/firestore";

let unsubscribeListener = null;

export async function render(container) {
  // groupId 파싱
  const hash = window.location.hash;
  const match = hash.match(/^#\/group\/([^/]+)\/chat/);
  const groupId = match ? match[1] : null;

  // 그룹 정보 및 멤버 체크
  let groupName = "";
  let isMember = false;
  let members = [];
  if (groupId) {
    try {
      const groupDoc = await getDoc(doc(db, "groups", groupId));
      if (groupDoc.exists()) {
        const group = groupDoc.data();
        groupName = group.name || "";
        members = group.members || [];
        const user = auth.currentUser;
        if (user && group.membersUid && group.membersUid.includes(user.uid)) {
          isMember = true;
        }
      }
    } catch (e) {
      groupName = "";
    }
  }

  renderSidebar(document.getElementById("sidebar-root"), "group-chat", {
    groupName,
    groupId,
  });

  if (!isMember) {
    container.innerHTML = `
      <div class="chat-container">
        <h2>접근 불가</h2>
        <p>이 그룹의 멤버가 아니므로 그룹 채팅을 볼 수 없습니다.</p>
        <a href="#/" class="link-button">돌아가기</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="chat-container">
      <h2 style="text-align:left; margin-bottom:1.5rem;">
        ${
          groupName
            ? `<span style="font-size:1.2rem; color:#007bff;">${groupName}</span> 그룹 채팅`
            : "그룹 채팅"
        }
      </h2>
      <div id="group-chat-list" >로딩 중...</div>
      <form id="group-chat-form" >
        <input type="text" id="chat-message" placeholder="메시지 입력" required  />
        <button type="submit">전송</button>
      </form>
    </div>
  `;

  // 실시간 채팅 리스너
  unsubscribeListener = listenToGroupChats(groupId, (chats) => {
    const user = auth.currentUser;
    let list = "";
    if (chats.length === 0) {
      list = `<li class="no-message">채팅이 없습니다.</li>`;
    } else {
      list = chats
        .map((c) => {
          const isMe = user && c.user === user.email;
          // 멤버 role 찾기
          const member = members.find((m) => m.email === c.user);
          const role = member ? member.role : "";
          // createdAt이 Timestamp면 toDate(), 아니면 Date로 변환
          let dateObj;
          if (c.createdAt && typeof c.createdAt.toDate === "function") {
            dateObj = c.createdAt.toDate();
          } else if (typeof c.createdAt === "string") {
            dateObj = new Date(c.createdAt);
          } else {
            dateObj = new Date();
          }
          const time = !isNaN(dateObj)
            ? dateObj.toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          return `<li class="${isMe ? "me" : ""}">
            <div class="chat-meta">
              <b>${c.user || "익명"}</b>
              ${
                role
                  ? `<span style="color:#888;font-size:0.95em;">[${role}]</span>`
                  : ""
              }
              <span>${time}</span>
            </div>
            <div>${c.message}</div>
          </li>`;
        })
        .join("");
    }
    document.getElementById("group-chat-list").innerHTML = `<ul>${list}</ul>`;

    // 스크롤 아래로
    const chatList = document.getElementById("group-chat-list");
    chatList.scrollTop = chatList.scrollHeight;
  });

  // 전송 이벤트
  document.getElementById("group-chat-form").onsubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const msg = document.getElementById("chat-message").value.trim();
    if (!msg) return;
    await sendGroupChat(groupId, {
      message: msg,
      user: user?.email || "익명",
      createdAt: new Date().toISOString(),
    });
    document.getElementById("chat-message").value = "";
  };

  // cleanup 함수 반환
  return function cleanup() {
    if (unsubscribeListener) {
      unsubscribeListener();
      unsubscribeListener = null;
    }
  };
}
