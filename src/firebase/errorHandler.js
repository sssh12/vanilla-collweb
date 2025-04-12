import { firebaseErrorMessages } from "./errorMessages.js";

export function getErrorMessage(error) {
  const errorCode = error.code || "unknown";
  return firebaseErrorMessages[errorCode] || "알 수 없는 오류가 발생했습니다.";
}
