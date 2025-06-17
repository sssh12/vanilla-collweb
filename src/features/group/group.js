import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase/firestore.js";
import { auth } from "../../firebase/auth.js";

// 내 그룹 목록 가져오기
export async function getMyGroups() {
  const user = auth.currentUser;
  if (!user) return [];
  const q = query(
    collection(db, "groups"),
    where("membersUid", "array-contains", user.uid)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// 그룹 생성
export async function createGroup(name) {
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  const group = {
    name,
    createdAt: new Date().toISOString(),
    createdBy: user.uid,
    members: [{ uid: user.uid, email: user.email, role: "owner" }],
    membersUid: [user.uid],
  };
  const docRef = await addDoc(collection(db, "groups"), group);
  return docRef.id;
}

// 멤버 추가
export async function addMemberToGroup(groupId, member) {
  const groupRef = doc(db, "groups", groupId);
  await updateDoc(groupRef, {
    members: arrayUnion(member),
    membersUid: arrayUnion(member.uid),
  });
}

// 멤버 삭제
export async function removeMemberFromGroup(groupId, uid) {
  const groupRef = doc(db, "groups", groupId);
  const groupDoc = await getDoc(groupRef);
  if (!groupDoc.exists()) return;
  const group = groupDoc.data();
  const memberObj = (group.members || []).find((m) => m.uid === uid);
  if (!memberObj) return;
  await updateDoc(groupRef, {
    members: arrayRemove(memberObj),
    membersUid: arrayRemove(uid),
  });
}

// 권한 변경
export async function updateMemberRole(groupId, uid, newRole) {
  const groupRef = doc(db, "groups", groupId);
  const groupDoc = await getDoc(groupRef);
  if (!groupDoc.exists()) return;
  const group = groupDoc.data();
  const members = (group.members || []).map((m) =>
    m.uid === uid ? { ...m, role: newRole } : m
  );
  await updateDoc(groupRef, { members });
}

// 그룹 채팅
export function listenToGroupChats(groupId, callback) {
  const q = query(collection(db, "chats"), where("groupId", "==", groupId));
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(chats);
  });
}

// 그룹 채팅 보내기
export async function sendGroupChat(groupId, chat) {
  await addDoc(collection(db, "chats"), { ...chat, groupId });
}

// 초대만 추가 (멤버로 바로 추가 X)
export async function inviteMemberToGroup(groupId, invitee) {
  const groupRef = doc(db, "groups", groupId);
  await updateDoc(groupRef, {
    pendingInvites: arrayUnion(invitee.uid),
  });
  const userRef = doc(db, "users", invitee.uid);
  await updateDoc(userRef, {
    groupInvites: arrayUnion({ groupId, groupName: invitee.groupName }),
  });
}

// 초대 수락
export async function acceptGroupInvite(groupId, user) {
  const groupRef = doc(db, "groups", groupId);
  await updateDoc(groupRef, {
    members: arrayUnion({ email: user.email, uid: user.uid, role: "member" }),
    membersUid: arrayUnion(user.uid),
    pendingInvites: arrayRemove(user.uid),
  });

  // groupInvites에서 해당 groupId만 제거 (객체 전체 일치가 아니라 groupId만 비교)
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const invites = userSnap.data().groupInvites || [];
  const filtered = invites.filter((invite) => invite.groupId !== groupId);
  await updateDoc(userRef, { groupInvites: filtered });
}

// 초대 거절
export async function rejectGroupInvite(groupId, user) {
  const groupRef = doc(db, "groups", groupId);
  await updateDoc(groupRef, {
    pendingInvites: arrayRemove(user.uid),
  });

  // groupInvites에서 해당 groupId만 제거
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const invites = userSnap.data().groupInvites || [];
  const filtered = invites.filter((invite) => invite.groupId !== groupId);
  await updateDoc(userRef, { groupInvites: filtered });
}

// 내 그룹 실시간 업데이트 듣기
export function listenToMyGroups(callback) {
  const user = auth.currentUser;
  if (!user) return () => {};
  const q = query(
    collection(db, "groups"),
    where("membersUid", "array-contains", user.uid)
  );
  return onSnapshot(q, (snapshot) => {
    const groups = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(groups);
  });
}

// 그룹 삭제
export async function deleteGroup(groupId) {
  const groupRef = doc(db, "groups", groupId);
  await deleteDoc(groupRef);
}
