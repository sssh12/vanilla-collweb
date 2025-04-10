import Sortable from "sortablejs";

export function initDragAndDrop(elementId) {
  const container = document.getElementById(elementId);

  new Sortable(container, {
    animation: 150,
    onEnd: (evt) => {
      console.log(`Item moved from ${evt.oldIndex} to ${evt.newIndex}`);
    },
  });
}
