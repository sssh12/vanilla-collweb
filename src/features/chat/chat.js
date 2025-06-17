import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firestore.js";

export async function getGroupChats(groupId) {
  const q = query(collection(db, "chats"), where("groupId", "==", groupId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export function listenToGroupChats(groupId, callback) {
  // createdAt 기준 오름차순 정렬
  const q = query(
    collection(db, "chats"),
    where("groupId", "==", groupId),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(chats);
  });
}

export async function sendGroupChat(groupId, chat) {
  await addDoc(collection(db, "chats"), {
    ...chat,
    groupId,
    createdAt: Timestamp.now(), // Firestore Timestamp로 저장
  });
}

export function listenToAllChats(callback) {
  const q = query(collection(db, "chats"), where("groupId", "==", null));
  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(chats);
  });
}

export async function sendChat(chat) {
  await addDoc(collection(db, "chats"), { ...chat, groupId: null });
}
