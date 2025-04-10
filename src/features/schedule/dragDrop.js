import Sortable from "sortablejs";
import { updateSchedule } from "./utils.js";

export function initDragAndDrop(elementId) {
  const container = document.getElementById(elementId);

  new Sortable(container, {
    animation: 150,
    onEnd: async (evt) => {
      const oldIndex = evt.oldIndex;
      const newIndex = evt.newIndex;

      if (oldIndex === newIndex) {
        console.log("Item position unchanged. Skipping Firestore update.");
        return; // 위치가 변경되지 않았으면 업데이트 중단
      }

      const id = evt.item.dataset.id;
      const newPriority = evt.to.parentElement.id.replace("-priority", "");

      try {
        await updateSchedule(id, { priority: newPriority });
      } catch (error) {
        console.error("Error updating schedule:", error);
      }
    },
  });
}
