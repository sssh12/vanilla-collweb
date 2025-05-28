import { defineConfig } from "vite";

export default defineConfig({
  base: "./", // 상대 경로로 설정
  server: {
    open: true, // 개발 서버 실행 시 브라우저 자동 열기
  },
  publicDir: "public", // 정적 파일 디렉터리 설정
  build: {
    rollupOptions: {
      input: {
        main: "./index.html", // 엔트리 파일 설정
      },
      output: {
        manualChunks(id) {
          if (id.includes("src/pages")) {
            return "pages"; // 페이지별로 번들 분리
          }
        },
      },
    },
  },
});
