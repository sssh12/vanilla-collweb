import { getDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firestore.js";
import { renderSidebar } from "../components/sidebar.js";
import { getDocs, collection, query, where } from "firebase/firestore";
import {
  removeMemberFromGroup,
  updateMemberRole,
  inviteMemberToGroup,
  deleteGroup,
} from "../features/group/group.js";
import { auth } from "../firebase/auth.js";

export async function render(container) {
  const sidebarToggle = document.getElementById("sidebar-toggle");
  if (sidebarToggle) sidebarToggle.style.display = "";

  // groupId 파싱
  const hash = window.location.hash;
  const match = hash.match(/^#\/group\/([^/]+)/);
  const groupId = match ? match[1] : null;

  container.innerHTML = `
    <div class="dashboard-container" style="max-width: 600px; margin: 2rem auto;">
      <div id="group-detail-content">로딩 중...</div>
    </div>
  `;
  renderSidebar(document.getElementById("sidebar-root"), "group");

  if (!groupId) {
    document.getElementById("group-detail-content").textContent =
      "잘못된 접근입니다.";
    return;
  }

  const groupRef = doc(db, "groups", groupId);

  const unsubscribe = onSnapshot(groupRef, (groupDoc) => {
    if (!groupDoc.exists()) {
      document.getElementById("group-detail-content").textContent =
        "그룹이 존재하지 않습니다.";
      return;
    }
    const group = groupDoc.data();
    const members = group.members || [];
    const user = auth.currentUser;
    const isOwner =
      group.members?.find((m) => m.uid === user.uid)?.role === "owner";

    document.getElementById("group-detail-content").innerHTML = `
  <div style="margin-bottom:2.5rem; position:relative; text-align:center;">
    <h2 style="margin-bottom:0.7rem; display:inline-flex; align-items:center; gap:1rem;">
      <span>${group.name}</span>
      ${
        isOwner
          ? `<button id="delete-group-btn" class="link-button" style="
                position:absolute;
                top:0;
                right:0;
                
                font-size:0.95rem;
                padding:0.45rem 1.2rem;
                margin:0;
                z-index:2;
            ">그룹 삭제</button>`
          : ""
      }
    </h2>
    <div style="color:#666;font-size:0.98rem; margin-bottom:1.2rem;">
      생성일: ${
        group.createdAt
          ? new Date(group.createdAt).toLocaleDateString("ko-KR")
          : "-"
      }
      &nbsp;|&nbsp; 멤버: ${members.length}명
    </div>
    <div style="margin-top:0.5rem; display:flex; justify-content:center; gap:0.7rem;">
      <a href="#/group/${groupId}/planner" class="link-button" style="margin:0;">그룹 플래너</a>
      <a href="#/group/${groupId}/chat" class="link-button" style="margin:0;">그룹 채팅</a>
    </div>
  </div>
  <div style="margin-bottom:2.5rem;">
    <h3 style="margin-bottom:1rem; text-align:center;">멤버 목록</h3>
    <div style="overflow-x:auto;">
    <table style="width:90%;margin:0 auto;border-collapse:collapse; background:#fafbfc;">
      <thead>
        <tr style="background:#f6f8fa;">
          <th class="email-col" style="padding:0.7rem 0.5rem;">이메일</th>
          <th style="padding:0.7rem 0.5rem;">직책</th>
          ${isOwner ? `<th style="padding:0.7rem 0.5rem;">관리</th>` : ""}
        </tr>
      </thead>
      <tbody>
        ${members
          .map(
            (m) => `
            <tr>
              <td class="email-col" style="padding:0.6rem 0.5rem;">${
                m.email || m.uid
              }</td>
              <td style="padding:0.6rem 0.5rem;">${m.role || "member"}</td>
              ${
                isOwner
                  ? `<td style="padding:0.6rem 0.5rem;">
                  ${
                    m.uid !== user.uid
                      ? `
                        <div class="member-action-btns">
                          <button class="remove-member-btn link-button" data-uid="${m.uid}">추방</button>
                          <button class="change-role-btn link-button" data-uid="${m.uid}">직책 변경</button>
                        </div>
                      `
                      : ""
                  }
                </td>`
                  : ""
              }
            </tr>
          `
          )
          .join("")}
      </tbody>
    </table>
    </div>
  </div>
  ${
    isOwner
      ? `
    <div style="margin-bottom:2.5rem; text-align:center;">
      <h3 style="margin-bottom:1rem; text-align:center;">멤버 초대</h3>
      <div class="invite-row" style="margin-bottom:0.7rem;">
        <input type="email" id="invite-email" placeholder="이메일로 초대" />
        <button id="invite-btn" class="link-button" style="margin:0;">초대</button>
      </div>
      <div id="invite-result" style="color:green;margin-bottom:0.7rem;min-height:1.2em;"></div>
      <div style="display:flex;align-items:center;gap:0.5rem; justify-content:center;">
        <span>초대 링크:</span>
        <input type="text" id="invite-link" value="${location.origin}${location.pathname}#/join/${groupId}" readonly style="width:250px;">
        <button id="copy-link-btn" class="link-button" style="margin:0;">복사</button>
      </div>
    </div>
    `
      : ""
  }
`;

    // 초대 버튼 이벤트
    const inviteBtn = document.getElementById("invite-btn");
    if (inviteBtn) {
      inviteBtn.onclick = async () => {
        const email = document.getElementById("invite-email").value.trim();
        if (!email) return;
        try {
          // Firestore users 컬렉션에서 해당 이메일의 uid 찾기
          const q = query(collection(db, "users"), where("email", "==", email));
          const snap = await getDocs(q);
          if (snap.empty) {
            document.getElementById("invite-result").textContent =
              "해당 이메일로 가입된 사용자가 없습니다. 회원가입 후 초대 링크를 이용하세요.";
            return;
          }
          const userDoc = snap.docs[0];
          const uid = userDoc.id;

          // ★ 이미 멤버인지 체크
          if (group.membersUid && group.membersUid.includes(uid)) {
            document.getElementById("invite-result").textContent =
              "이미 그룹 멤버입니다.";
            return;
          }
          // ★ 이미 pendingInvites에 있으면 중복 초대 방지
          if (group.pendingInvites && group.pendingInvites.includes(uid)) {
            document.getElementById("invite-result").textContent =
              "이미 초대된 사용자입니다.";
            return;
          }

          await inviteMemberToGroup(groupId, {
            email,
            uid,
            groupName: group.name,
          });
          document.getElementById("invite-result").textContent = "초대 완료!";
        } catch (e) {
          document.getElementById("invite-result").textContent = "초대 실패";
        }
      };
    }

    // 초대 링크 복사
    document.getElementById("copy-link-btn").onclick = () => {
      const link = document.getElementById("invite-link");
      link.select();
      document.execCommand("copy");
    };

    // ★ 그룹 삭제 버튼 이벤트 등록 (관리자만)
    if (isOwner) {
      const deleteBtn = document.getElementById("delete-group-btn");
      if (deleteBtn) {
        deleteBtn.onclick = async () => {
          const ok = confirm(
            "정말로 이 그룹을 삭제하시겠습니까?\n삭제하면 복구할 수 없습니다."
          );
          if (!ok) return;
          try {
            await deleteGroup(groupId);
            alert("그룹이 삭제되었습니다.");
            window.location.hash = "#/";
          } catch (e) {
            alert("그룹 삭제에 실패했습니다.");
          }
        };
      }
    }

    // 추방/직책 변경 버튼 이벤트 등록 (isOwner 체크 포함)
    if (isOwner) {
      document.querySelectorAll(".remove-member-btn").forEach((btn) => {
        btn.onclick = async () => {
          const uid = btn.dataset.uid;
          const ok = confirm("정말로 이 멤버를 추방하시겠습니까?");
          if (!ok) return;
          await removeMemberFromGroup(groupId, uid);
        };
      });
      document.querySelectorAll(".change-role-btn").forEach((btn) => {
        btn.onclick = async () => {
          const uid = btn.dataset.uid;
          const newRole = prompt("직책을 입력하세요.", "member");
          if (newRole) {
            await updateMemberRole(groupId, uid, newRole);
          }
        };
      });
    }
  });

  // 페이지 이동 시 리스너 해제
  return function cleanup() {
    unsubscribe();
  };
}
