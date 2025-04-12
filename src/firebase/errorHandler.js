import { firebaseErrorMessages } from "./errorMessages.js";

export function getErrorMessage(error) {
  console.log("받은 에러 객체:", error); // 디버깅용

  // Firebase 에러인 경우
  if (error.code) {
    return (
      firebaseErrorMessages[error.code] ||
      `알 수 없는 오류가 발생했습니다. (코드: ${error.code})`
    );
  }

  // 커스텀 에러 메시지가 있는 경우
  if (error.message) {
    // 에러 메시지가 이미 한국어인 경우 그대로 반환
    if (error.message.includes("이미 동일한 일정이 존재합니다")) {
      return error.message;
    }
  }

  // 그 외의 모든 경우
  return "알 수 없는 오류가 발생했습니다.";
}
