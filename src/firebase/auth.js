// Firebase Authentication 모듈 가져오기
import { getAuth } from "firebase/auth";
// Firebase 앱 초기화 객체 가져오기
import app from "./config.js";

// Firebase Authentication 객체 생성
// 이 객체를 통해 회원가입, 로그인, 로그아웃 등의 작업을 수행할 수 있음
export const auth = getAuth(app);
