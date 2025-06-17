import {
  acceptGroupInvite,
  rejectGroupInvite,
} from "../../features/group/group.js";
import { auth } from "../../firebase/auth.js";
import { db } from "../../firebase/firestore.js";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

let unsubscribe = null;
let lastUserUid = null;
let popupOpen = false;

export function initInviteNotificationBadge() {
  const badge = document.getElementById("notification-badge");
  const btn = document.getElementById("notification-btn");
  if (!badge || !btn) return;

  // 로그인 상태 감시
  auth.onAuthStateChanged((user) => {
    // 팝업/뱃지/버튼 숨김
    if (!user) {
      badge.style.display = "none";
      btn.style.display = "none";
      closeInvitePopup();
      if (unsubscribe) unsubscribe();
      lastUserUid = null;
      return;
    }
    btn.style.display = ""; // 버튼 보이기
    // 리스너 중복 방지
    if (unsubscribe) unsubscribe();
    lastUserUid = user.uid;
    const userRef = doc(db, "users", user.uid);
    unsubscribe = onSnapshot(userRef, (snap) => {
      const invites = snap.data()?.groupInvites || [];
      if (invites.length > 0) {
        badge.textContent = invites.length;
        badge.style.display = "inline-block";
      } else {
        badge.style.display = "none";
      }
      // 팝업이 열려 있으면 실시간으로 내용 갱신
      if (popupOpen) renderInvitePopup(invites, user);
    });
  });

  // 토글 방식: 이미 열려 있으면 닫기, 아니면 열기
  btn.onclick = async () => {
    if (popupOpen) {
      closeInvitePopup();
      return;
    }
    const user = auth.currentUser;
    if (!user) return;
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const invites = userSnap.data()?.groupInvites || [];
    renderInvitePopup(invites, user);
  };
}

function closeInvitePopup() {
  document.querySelector("#invite-popup")?.remove();
  popupOpen = false;
}

// 팝업 렌더링 함수
function renderInvitePopup(invites, user) {
  closeInvitePopup();

  let html = `<div id="invite-popup" style="position:fixed;top:60px;right:30px;z-index:999;background:#fff;border:1px solid #ccc;padding:1rem;box-shadow:0 2px 8px #0002;min-width:220px;">
    <h4 style="margin-top:0;">알림</h4>
    <ul style="list-style:none;padding:0;min-height:32px;">`;

  if (!invites || invites.length === 0) {
    html += `<li style="color:#888;text-align:center;padding:1rem 0;">알림이 없습니다.</li>`;
  } else {
    invites.forEach((invite) => {
      html += `<li style="margin-bottom:8px;">
        <b>${invite.groupName || invite.groupId}</b>
        <button class="accept-invite-btn" data-group="${
          invite.groupId
        }">수락</button>
        <button class="reject-invite-btn" data-group="${
          invite.groupId
        }">거절</button>
      </li>`;
    });
  }
  html += `</ul>
    <button id="close-invite-popup" style="margin-top:8px;width:100%;">닫기</button>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);
  popupOpen = true;

  document.querySelectorAll(".accept-invite-btn").forEach((btn) => {
    btn.onclick = async () => {
      await acceptGroupInvite(btn.dataset.group, user);
      // 팝업은 실시간으로 onSnapshot에서 자동 갱신
    };
  });
  document.querySelectorAll(".reject-invite-btn").forEach((btn) => {
    btn.onclick = async () => {
      await rejectGroupInvite(btn.dataset.group, user);
      // 팝업은 실시간으로 onSnapshot에서 자동 갱신
    };
  });
  document.getElementById("close-invite-popup").onclick = () => {
    closeInvitePopup();
  };
}

export function showNotification(title, options) {
  if (Notification.permission === "granted") {
    new Notification(title, options);
  }
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
}
