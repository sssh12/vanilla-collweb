import { auth } from "../firebase/auth.js";
import { db } from "../firebase/firestore.js";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

export async function render(container) {
  // groupId 파싱
  const hash = window.location.hash;
  const match = hash.match(/^#\/join\/([^/]+)/);
  const groupId = match ? match[1] : null;

  container.innerHTML = `
    <div class="dashboard-container" style="max-width:400px;margin:2rem auto;">
      <h2>그룹 가입</h2>
      <div id="join-result">처리 중...</div>
    </div>
  `;

  if (!groupId) {
    document.getElementById("join-result").textContent = "잘못된 링크입니다.";
    return;
  }

  // 로그인된 사용자만 가입 가능
  const user = auth.currentUser;
  if (!user) {
    document.getElementById("join-result").innerHTML =
      '로그인이 필요합니다. <a href="#/login">로그인</a>';
    return;
  }

  // 이미 멤버인지 확인
  const groupDoc = await getDoc(doc(db, "groups", groupId));
  if (!groupDoc.exists()) {
    document.getElementById("join-result").textContent =
      "그룹이 존재하지 않습니다.";
    return;
  }
  const group = groupDoc.data();
  if (group.membersUid && group.membersUid.includes(user.uid)) {
    document.getElementById("join-result").textContent =
      "이미 그룹 멤버입니다.";
    return;
  }

  // 그룹에 멤버 추가
  await updateDoc(doc(db, "groups", groupId), {
    members: arrayUnion({ email: user.email, uid: user.uid, role: "member" }),
    membersUid: arrayUnion(user.uid),
  });
  document.getElementById("join-result").textContent = "그룹에 가입되었습니다!";
}
