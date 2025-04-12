import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase/firestore.js";
import { getErrorMessage } from "../../firebase/errorHandler.js";

// 캐싱을 위한 상수 설정
const CACHE_KEY = "schedules_cache";
const CACHE_EXPIRY = 15 * 60 * 1000; // 15분 캐시 유효기간

// 캐시 관련 유틸리티 함수
function cacheSchedules(schedules) {
  const cacheData = {
    data: schedules,
    timestamp: Date.now(),
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
}

function getCachedSchedules() {
  const cacheJSON = localStorage.getItem(CACHE_KEY);
  if (!cacheJSON) return null;

  try {
    const cache = JSON.parse(cacheJSON);
    // 캐시 만료 확인
    if (Date.now() - cache.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cache.data;
  } catch (error) {
    console.error("캐시 파싱 오류:", error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

// 실시간 리스너 (읽기 작업 최적화)
let activeListener = null;

export function listenToSchedules(callback) {
  // 기존 리스너가 있으면 제거
  if (activeListener) {
    activeListener();
  }

  // 캐시 데이터 우선 사용
  const cachedData = getCachedSchedules();
  if (cachedData) {
    callback(cachedData);
  }

  // 실시간 데이터 리스닝 설정
  const schedulesRef = collection(db, "schedules");
  activeListener = onSnapshot(
    schedulesRef,
    (snapshot) => {
      const schedules = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 캐시 업데이트
      cacheSchedules(schedules);
      callback(schedules);
    },
    (error) => {
      console.error("리스너 오류:", error);
    }
  );

  return activeListener;
}

// 일정 추가 함수 최적화
export async function addSchedule(schedule) {
  try {
    // 중복 검사를 효율적으로 수행
    const isDuplicate = await checkDuplicate(schedule.title, schedule.date);

    if (isDuplicate) {
      console.log(
        "중복된 일정이 감지되었습니다. Firestore 쓰기 작업을 건너뜁니다."
      );
      throw new Error("이미 동일한 일정이 존재합니다.");
    }

    const docRef = await addDoc(collection(db, "schedules"), schedule);
    console.log("일정 추가 완료, ID: ", docRef.id);

    // 리스너가 있어도 캐시 즉시 업데이트
    updateCacheOnAdd({ ...schedule, id: docRef.id });

    return docRef.id;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("일정 추가 중 오류: ", errorMessage);
    throw new Error(errorMessage);
  }
}

// 중복 일정 체크
async function checkDuplicate(title, date) {
  const q = query(
    collection(db, "schedules"),
    where("title", "==", title),
    where("date", "==", date)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// 캐시에 항목 추가 (리스너 외에도 업데이트)
function updateCacheOnAdd(schedule) {
  const cachedData = getCachedSchedules();
  if (cachedData) {
    const updated = [...cachedData, schedule];
    cacheSchedules(updated);
  }
}

// 일정 조회 최적화 (캐시 활용)
export async function getSchedules() {
  try {
    // 먼저 캐시 데이터 확인
    const cachedData = getCachedSchedules();

    if (cachedData) {
      console.log("캐시된 일정 데이터 사용");
      // 백그라운드에서 최신 데이터 로드 (UI 차단 없이)
      setTimeout(() => refreshCacheInBackground(), 0);
      return cachedData;
    }

    // 캐시 데이터가 없으면 Firestore에서 로드
    const querySnapshot = await getDocs(collection(db, "schedules"));
    const schedules = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 새로 로드한 데이터 캐싱
    cacheSchedules(schedules);
    return schedules;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("일정 조회 중 오류: ", errorMessage);

    // 오류 발생 시 캐시 데이터 반환 시도
    const cachedData = getCachedSchedules();
    if (cachedData) {
      console.log("오류로 인해 캐시 데이터 사용");
      return cachedData;
    }

    throw new Error(errorMessage); // 한국어 메시지를 던짐
  }
}

// 백그라운드에서 캐시 갱신
async function refreshCacheInBackground() {
  try {
    const querySnapshot = await getDocs(collection(db, "schedules"));
    const schedules = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    cacheSchedules(schedules);
    console.log("백그라운드에서 캐시 갱신 완료");
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("백그라운드 캐시 갱신 실패:", errorMessage);
  }
}

// 일정 삭제 최적화
export async function deleteSchedule(id) {
  try {
    // 먼저 캐시 바로 업데이트 (UI 즉시 반영)
    updateCacheOnDelete(id);

    // 실제 문서 존재 여부 확인 (불필요한 삭제 작업 방지)
    const scheduleRef = doc(db, "schedules", id);
    const scheduleSnap = await getDoc(scheduleRef);

    if (!scheduleSnap.exists()) {
      console.log("문서가 존재하지 않습니다. 삭제 작업을 건너뜁니다.");
      return;
    }

    // Firestore에서 삭제
    await deleteDoc(scheduleRef);
    console.log("일정 삭제 완료, ID: ", id);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("일정 삭제 중 오류: ", errorMessage);
    throw new Error(errorMessage); // 한국어 메시지를 던짐
  }
}

// 캐시에서 항목 삭제
function updateCacheOnDelete(id) {
  const cachedData = getCachedSchedules();
  if (cachedData) {
    const updated = cachedData.filter((item) => item.id !== id);
    cacheSchedules(updated);
  }
}

// 일정 업데이트 최적화
export async function updateSchedule(id, updatedData) {
  try {
    // 이미 존재하는 문서인지 확인
    const scheduleRef = doc(db, "schedules", id);
    const scheduleSnap = await getDoc(scheduleRef);

    if (!scheduleSnap.exists()) {
      console.error("업데이트할 일정이 존재하지 않습니다.");
      return;
    }

    const existingSchedule = scheduleSnap.data();

    // 변경된 필드만 확인 (불필요한 업데이트 방지)
    const changedFields = {};
    let hasChanges = false;

    Object.keys(updatedData).forEach((key) => {
      if (updatedData[key] !== existingSchedule[key]) {
        changedFields[key] = updatedData[key];
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      console.log("변경사항이 없습니다. 업데이트를 건너뜁니다.");
      return;
    }

    // 캐시 먼저 업데이트 (UI 즉시 반영)
    const updatedSchedule = { ...existingSchedule, ...changedFields, id };
    updateCacheOnUpdate(id, updatedSchedule);

    // 변경된 필드만 Firestore 업데이트
    await updateDoc(scheduleRef, changedFields);
    console.log("일정 업데이트 완료, ID: ", id);
  } catch (error) {
    console.error("일정 업데이트 중 오류:", error);

    // 에러 객체를 새로 생성하지 않고 원본 에러 전달
    // 또는 code 속성을 명시적으로 추가
    if (!error.code) {
      error.code = "firestore/unknown-error";
    }

    throw error; // 원본 에러 객체를 그대로 전달
  }
}

// 캐시에서 항목 업데이트
function updateCacheOnUpdate(id, updatedSchedule) {
  const cachedData = getCachedSchedules();
  if (cachedData) {
    const updated = cachedData.map((item) =>
      item.id === id ? updatedSchedule : item
    );
    cacheSchedules(updated);
  }
}

// 배치 업데이트 함수 추가
export async function batchUpdateSchedules(updates) {
  if (!updates || updates.length === 0) return;

  try {
    // 캐시 먼저 업데이트
    updateCacheForBatch(updates);

    // 배치 작업 준비
    const batch = writeBatch(db);

    // 각 업데이트 항목을 배치에 추가
    for (const update of updates) {
      const { id, data } = update;
      const scheduleRef = doc(db, "schedules", id);
      batch.update(scheduleRef, data);
    }

    // 배치 실행 (단일 네트워크 요청)
    await batch.commit();
    console.log(`${updates.length}개 일정 배치 업데이트 완료`);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error("배치 업데이트 중 오류:", errorMessage);
    throw new Error(errorMessage); // 한국어 메시지를 던짐
  }
}

// 배치 업데이트를 위한 캐시 업데이트
function updateCacheForBatch(updates) {
  const cachedData = getCachedSchedules();
  if (!cachedData) return;

  const updated = [...cachedData];

  updates.forEach(({ id, data }) => {
    const index = updated.findIndex((item) => item.id === id);
    if (index !== -1) {
      updated[index] = { ...updated[index], ...data };
    }
  });

  cacheSchedules(updated);
}
