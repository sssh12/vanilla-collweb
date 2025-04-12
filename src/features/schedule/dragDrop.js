import Sortable from "sortablejs";
import { updateSchedule, batchUpdateSchedules } from "./utils.js";

export function initDragAndDrop(containerId) {
  const container = document.querySelector(`#${containerId} .schedule-items`);
  if (!container) return;

  // 이미 Sortable이 적용된 경우 제거 (중복 방지)
  if (container.sortable) {
    container.sortable.destroy();
  }

  // 각 카테고리별 드롭 영역 설정
  new Sortable(container, {
    group: "schedules", // 카테고리간 이동을 위한 그룹 설정
    animation: 300,
    easing: "cubic-bezier(1, 0, 0, 1)",
    delay: 50,
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

      try {
        // 변경된 데이터만 업데이트 - 업데이트 요청 최소화
        await updateSchedule(id, { priority: newPriority });
        console.log("Priority updated successfully");
      } catch (error) {
        console.error("Error updating priority:", error);
        // 오류 시 UI 복원 (원래 위치로)
        evt.item.dataset.priority = oldPriority;

        // 원래 부모 요소로 복원
        if (evt.from && evt.item.parentNode !== evt.from) {
          evt.from.appendChild(evt.item);
        }
      }
    },

    // 다중 드래그 지원 (추가 기능)
    multiDrag: false, // SortableJS의 멀티드래그 기능 (선택적)
    selectedClass: "selected",

    // 다중 항목 이동 시 호출
    onSort: function (evt) {
      // 만약 멀티드래그 기능이 활성화된 경우 일괄 업데이트 처리
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

        // 배치 업데이트 실행 (단일 네트워크 요청)
        if (updates.length > 0) {
          batchUpdateSchedules(updates).catch((error) => {
            console.error("Batch update failed:", error);
          });
        }
      }
    },
  });
}
