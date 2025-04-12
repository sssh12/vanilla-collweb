import Sortable from "sortablejs";
import { updateSchedule, batchUpdateSchedules } from "./utils.js";

// 진행 중인 업데이트 확인용 변수
let isUpdating = false;

export function initDragAndDrop(containerId) {
  const container = document.querySelector(`#${containerId} .schedule-items`);
  if (!container) return;

  // 이미 Sortable이 적용된 경우 제거 (중복 방지)
  if (container.sortable) {
    container.sortable.destroy();
  }

  // 각 카테고리별 드롭 영역 설정
  const sortable = new Sortable(container, {
    group: "schedules", // 카테고리간 이동을 위한 그룹 설정
    animation: 150, // 애니메이션 시간
    easing: "cubic-bezier(1, 0, 0, 1)",
    delay: 30, // 드래그 시작 지연 시간
    delayOnTouchOnly: true,
    draggable: ".schedule-item",
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    forceFallback: true,
    fallbackClass: "sortable-fallback",
    scroll: true,
    scrollSensitivity: 80,
    scrollSpeed: 10,

    // 드래그 시작 시 호출
    onStart: function (evt) {
      // 업데이트 진행 중일 때 드래그 허용 안 함
      if (isUpdating) {
        return false;
      }

      const itemEl = evt.item;
      itemEl.classList.add("dragging");

      // 모든 드롭 영역에 시각적 표시 추가
      document.querySelectorAll(".schedule-items").forEach((el) => {
        el.classList.add("dropzone-highlight");
      });
    },

    // 드래그 종료 시 호출
    onEnd: async (evt) => {
      // UI 시각적 효과 정리
      const itemEl = evt.item;
      itemEl.classList.remove("dragging");

      document.querySelectorAll(".schedule-items").forEach((el) => {
        el.classList.remove("dropzone-highlight");
      });

      // 데이터 처리
      const id = evt.item.dataset.id;
      const newPriority = evt.to
        .closest(".schedule-column")
        .id.replace("-priority", "");
      const oldPriority = evt.from
        .closest(".schedule-column")
        .id.replace("-priority", "");

      // 실제로 위치가 변경된 경우만 처리
      if (oldPriority === newPriority) {
        console.log("Priority unchanged. Skipping update.");
        return;
      }

      // 데이터셋 우선 업데이트 (UI 반응성)
      evt.item.dataset.priority = newPriority;

      // 에러 메시지 초기화
      const errorMessageDiv = document.getElementById("error-message");
      if (errorMessageDiv) errorMessageDiv.textContent = "";

      // 중요: 비동기 작업 시작 표시
      isUpdating = true;

      // 비동기 작업은 뒤로 보내고 UI는 즉시 반응하도록 분리
      setTimeout(async () => {
        try {
          // 변경된 데이터만 업데이트 - 업데이트 요청 최소화
          await updateSchedule(id, { priority: newPriority });
          console.log("Priority updated successfully");
        } catch (error) {
          console.error("Error updating priority:", error);

          // 에러 메시지 표시
          if (errorMessageDiv) {
            const getErrorMessage =
              window.getErrorMessage ||
              ((err) =>
                err.message || "일정 우선순위 변경 중 오류가 발생했습니다.");
            errorMessageDiv.textContent = getErrorMessage(error);
          }

          // 실패 시에만 UI 복원 (이미 이동은 완료된 상태)
          // 사용자 경험 향상을 위해 백그라운드에서 조용히 실패 처리
        } finally {
          // 비동기 작업 종료 표시 (드래그 다시 가능)
          isUpdating = false;
        }
      }, 0);
    },

    // 다중 드래그 지원
    multiDrag: false,
    selectedClass: "selected",

    // 다중 항목 이동 시 호출
    onSort: function (evt) {
      if (evt.items && evt.items.length > 1) {
        const updates = [];

        evt.items.forEach((item) => {
          const id = item.dataset.id;
          const newPriority = evt.to
            .closest(".schedule-column")
            .id.replace("-priority", "");

          updates.push({
            id,
            data: { priority: newPriority },
          });

          // 데이터셋 업데이트
          item.dataset.priority = newPriority;
        });

        // 배치 업데이트 실행 - 백그라운드에서 처리
        if (updates.length > 0) {
          setTimeout(() => {
            batchUpdateSchedules(updates).catch((error) => {
              console.error("Batch update failed:", error);
            });
          }, 0);
        }
      }
    },
  });

  // Sortable 인스턴스 참조 저장
  container.sortable = sortable;
}
