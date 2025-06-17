import {
  doc,
  updateDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/firestore.js";
import { auth } from "../firebase/auth.js";

// 직책 가져오기 유틸
async function getRoleByEmail(groupId, email) {
  if (!groupId || !email) return "";
  const groupSnap = await getDoc(doc(db, "groups", groupId));
  const group = groupSnap.exists() ? groupSnap.data() : null;
  if (!group || !group.members) return "";
  const member = group.members.find((m) => m.email === email);
  return member && member.role ? member.role : "";
}

export function openScheduleModal(schedule, onClose, members = []) {
  let editingCommentId = null;
  let lastSnapshot = null;

  // 코멘트 컬렉션 참조 정의
  const commentsRef = collection(db, "schedules", schedule.id, "comments");

  // 모달 생성
  const modal = document.createElement("div");
  modal.className = "schedule-modal-overlay";
  modal.innerHTML = `
  <div class="schedule-modal">
    <button class="close-btn" aria-label="닫기">&times;</button>
    <h3 class="modal-title">${schedule.title}</h3>
    <div class="modal-section">
      <b>일정 전체 진행 상황:</b>
      <select id="main-progress-select" style="margin-left:0.5em;">
        <option value="doing">진행 중</option>
        <option value="done">완료</option>
      </select>
    </div>
    <div class="comments-section modal-section">
      <h4>진행 로그</h4>
      <ul id="comments-list"></ul>
      <div id="no-comments" class="no-comments">아직 진행 로그가 없습니다.</div>
    </div>
    <div class="modal-btn-row">
      <button id="new-comment-btn">신규 등록</button>
    </div>
    <div id="edit-section" style="display:none;">
      <div class="modal-section">
        <label>진행 상황:
          <select id="comment-progress-select">
            <option value="doing">진행 중</option>
            <option value="done">완료</option>
          </select>
        </label>
      </div>
      <div class="modal-section" style="display:flex;gap:0.5em;">
        <input type="text" id="comment-input" placeholder="로그 입력" style="flex:1;"/>
        <button id="add-comment-btn">등록</button>
        <button id="cancel-add-comment-btn" type="button">취소</button>
      </div>
    </div>
  </div>
`;
  document.body.appendChild(modal);

  // 오버레이 스타일
  Object.assign(modal.style, {
    position: "fixed",
    left: 0,
    top: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.3)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  // 내부 모달 스타일
  const inner = modal.querySelector(".schedule-modal");
  Object.assign(inner.style, {
    background: "#fff",
    borderRadius: "12px",
    padding: "2rem 2.2rem 1.5rem 2.2rem",
    minWidth: "320px",
    maxWidth: "95vw",
    boxShadow: "0 4px 24px #0003",
    position: "relative",
  });

  // 닫기 버튼
  const closeBtn = modal.querySelector(".close-btn");
  closeBtn.onclick = () => {
    if (unsubscribeComments) unsubscribeComments();
    modal.remove();
    if (onClose) onClose();
  };

  // 전체 진행상황 select
  const mainProgressSelect = modal.querySelector("#main-progress-select");
  mainProgressSelect.value = schedule.progress || "doing";
  mainProgressSelect.onchange = async (e) => {
    await updateDoc(doc(db, "schedules", schedule.id), {
      progress: e.target.value,
    });
  };

  // 코멘트 불러오기
  const commentsList = modal.querySelector("#comments-list");
  const noComments = modal.querySelector("#no-comments");

  // 진행 로그 렌더링 함수
  function renderComments(snapshot) {
    lastSnapshot = snapshot;
    commentsList.innerHTML = "";

    if (editingCommentId) {
      // 수정 폼만
      const docSnap = snapshot.docs.find((doc) => doc.id === editingCommentId);
      if (docSnap) {
        const c = docSnap.data();
        const li = document.createElement("li");
        li.innerHTML = `
        <input type="text" class="edit-comment-input" value="${c.text}" />
        <select class="edit-comment-progress">
          <option value="doing" ${
            c.progress === "doing" ? "selected" : ""
          }>진행 중</option>
          <option value="done" ${
            c.progress === "done" ? "selected" : ""
          }>완료</option>
        </select>
        <div class="comment-actions">
          <button class="save-comment-btn" data-id="${docSnap.id}">저장</button>
          <button class="cancel-comment-btn" data-id="${
            docSnap.id
          }">취소</button>
        </div>
      `;
        commentsList.appendChild(li);

        // 폼 렌더링 후 이벤트 핸들러 등록
        li.querySelector(".save-comment-btn").onclick = async () => {
          const newText = li.querySelector(".edit-comment-input").value.trim();
          const newProgress = li.querySelector(".edit-comment-progress").value;
          const c = docSnap.data();

          // 변경사항 없으면 바로 목록으로
          if (newText === c.text && newProgress === c.progress) {
            editingCommentId = null;
            renderComments(lastSnapshot);
            return;
          }

          try {
            await updateDoc(
              doc(db, "schedules", schedule.id, "comments", docSnap.id),
              {
                text: newText,
                progress: newProgress,
              }
            );
            editingCommentId = null;
            renderComments(lastSnapshot);
          } catch (e) {
            alert("수정 중 오류가 발생했습니다.");
          }
        };

        li.querySelector(".cancel-comment-btn").onclick = () => {
          editingCommentId = null;
          renderComments(lastSnapshot);
        };
      }
      noComments.style.display = "none";
      return;
    }

    if (snapshot.size === 0) {
      noComments.style.display = "";
    } else {
      noComments.style.display = "none";
    }

    snapshot.forEach((docSnap) => {
      const c = docSnap.data();
      const li = document.createElement("li");
      let role = "";
      if (members && members.length > 0 && c.user) {
        const member = members.find(
          (m) => m.email && m.email.toLowerCase() === c.user.toLowerCase()
        );
        role = member && member.role ? member.role : "";
      }
      const canEdit = canEditOrDelete(c.user);

      li.innerHTML = `
  <div class="comment-meta">
    <b>${c.user}</b>${role ? ` / <span>${role}</span>` : ""}
  </div>
  <div class="comment-text">${c.text}</div>
  <span class="comment-progress-badge ${c.progress === "done" ? "done" : ""}">
    ${progressText(c.progress)}
  </span>
  ${
    canEdit
      ? `<div class="comment-actions">
          <button class="edit-comment-btn" data-id="${docSnap.id}">수정</button>
          <button class="delete-comment-btn" data-id="${docSnap.id}">삭제</button>
        </div>`
      : ""
  }
`;
      commentsList.appendChild(li);
    });

    // 수정 버튼
    commentsList.querySelectorAll(".edit-comment-btn").forEach((btn) => {
      btn.onclick = () => {
        editingCommentId = btn.dataset.id;
        renderComments(lastSnapshot);
      };
    });
    // 저장 버튼
    commentsList.querySelectorAll(".save-comment-btn").forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const li = btn.closest("li");
        const newText = li.querySelector(".edit-comment-input").value.trim();
        const newProgress = li.querySelector(".edit-comment-progress").value;
        const commentDoc = lastSnapshot.docs.find((doc) => doc.id === id);
        if (!commentDoc) return;
        const c = commentDoc.data();

        btn.disabled = true;
        btn.textContent = "저장 중...";

        // 변경사항 없으면 Firestore update 없이 즉시 목록으로
        if (newText === c.text && newProgress === c.progress) {
          editingCommentId = null;
          renderComments(lastSnapshot); // 즉시 목록으로
          btn.disabled = false;
          btn.textContent = "저장";
          return;
        }

        try {
          await updateDoc(doc(db, "schedules", schedule.id, "comments", id), {
            text: newText,
            progress: newProgress,
          });
          editingCommentId = null;
          renderComments(lastSnapshot); // 즉시 목록으로
        } catch (e) {
          alert("수정 중 오류가 발생했습니다.");
        } finally {
          btn.disabled = false;
          btn.textContent = "저장";
        }
      };
    });
    // 취소 버튼: 즉시 목록으로
    commentsList.querySelectorAll(".cancel-comment-btn").forEach((btn) => {
      btn.onclick = () => {
        editingCommentId = null;
        renderComments(lastSnapshot);
      };
    });
    // 삭제 버튼
    commentsList.querySelectorAll(".delete-comment-btn").forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (confirm("정말 삭제하시겠습니까?")) {
          await deleteDoc(doc(db, "schedules", schedule.id, "comments", id));
        }
      };
    });
  }

  // 실시간 리스너에서만 renderComments 호출
  let unsubscribeComments = onSnapshot(
    query(
      collection(db, "schedules", schedule.id, "comments"),
      orderBy("createdAt", "asc")
    ),
    (snapshot) => {
      renderComments(snapshot);
    }
  );

  // 내 계정 또는 관리자 여부 확인
  function canEditOrDelete(email) {
    const user = auth.currentUser;
    if (!user) return false;

    // 개인 플래너: 본인만 가능
    if (!schedule.groupId) return user.email === email;

    // 그룹 플래너: owner는 모두, 일반 멤버는 본인만
    if (members && members.length > 0) {
      const me = members.find((m) => m.email === user.email);
      if (me && me.role === "owner") return true;
    }
    return user.email === email;
  }

  // 신규 등록 버튼
  const newBtn = modal.querySelector("#new-comment-btn");
  const editSection = modal.querySelector("#edit-section");
  newBtn.onclick = () => {
    editSection.style.display = "";
    newBtn.style.display = "none";
    modal.querySelector("#comment-input").value = "";
    modal.querySelector("#comment-progress-select").value = "doing";
  };

  // 취소 버튼 이벤트
  modal.querySelector("#cancel-add-comment-btn").onclick = () => {
    editSection.style.display = "none";
    newBtn.style.display = "";
    modal.querySelector("#comment-input").value = "";
  };

  // 코멘트+진행상황 등록
  modal.querySelector("#add-comment-btn").onclick = async () => {
    const input = modal.querySelector("#comment-input");
    const text = input.value.trim();
    const commentProgress = modal.querySelector(
      "#comment-progress-select"
    ).value;
    if (!text) return;
    const user = auth.currentUser?.email || "익명";
    await addDoc(commentsRef, {
      text,
      user,
      progress: commentProgress,
      createdAt: serverTimestamp(),
    });
    input.value = "";
    editSection.style.display = "none";
    newBtn.style.display = "";
  };

  // 모달이 닫힐 때 리스너 해제(메모리 누수 방지)
  modal.addEventListener("remove", () => {
    isUnmounted = true;
    if (unsubscribeComments) unsubscribeComments();
  });
}

// 진행상황 한글 변환 함수
function progressText(val) {
  if (val === "done") return "완료";
  return "진행 중";
}
