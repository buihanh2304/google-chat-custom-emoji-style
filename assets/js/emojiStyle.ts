/*
 * File: emojiStyle.ts
 * Created Date: 5th Mar 2024 16:00:40
 * Author: HanhBT <buihanh2304@gmail.com>
 * -----
 * Copyright (c) 2024 HanhBT
 * -----
 */
import "../css/emoji.css";

const createTooltip = (): [HTMLElement, HTMLElement] => {
  const tooltipId = "hbtTooltip";
  const tooltipContainerId = "hbtTooltipContainer";
  let tooltip = document.getElementById(tooltipId);
  let container = document.getElementById(tooltipContainerId);

  if (tooltip && container) {
    return [tooltip, container];
  }

  container = document.createElement("div");
  container.setAttribute("id", tooltipContainerId);

  tooltip = document.createElement("div");
  tooltip.setAttribute("id", tooltipId);
  tooltip.appendChild(container);

  document.documentElement.appendChild(tooltip);

  return [tooltip, container];
};

(() => {
  const [tooltip, container] = createTooltip();

  document.addEventListener(
    "mouseout",
    () => {
      tooltip.style.display = "none";
    },
    true
  );

  const observer = new MutationObserver((items: MutationRecord[]) => {
    items.forEach((item) => {
      if (item.type === "attributes" && item.attributeName === "style") {
        const target = item.target as HTMLElement;

        if (
          target.nodeType === Node.ELEMENT_NODE &&
          target.tagName.toLowerCase() === "c-wiz" &&
          target.hasAttribute("c-wiz") &&
          target.style.height &&
          parseInt(target.style.height) === 0
        ) {
          setTimeout(() => {
            tooltip.style.display = "none";
          }, 0);
        }
      }

      (item.addedNodes as NodeListOf<HTMLElement>).forEach((addedItem) => {
        const isElement = addedItem.nodeType === Node.ELEMENT_NODE;
        const role = isElement ? addedItem.getAttribute("role") : null;

        if (role && ["none", "presentation"].includes(role)) {
          const icons: NodeListOf<HTMLElement> = addedItem.querySelectorAll(
            '[data-resource-url*="get_custom_emoji_image"], [data-resource-url*="chat_custom_emoji"]'
          );

          icons.forEach((icon) => {
            icon.addEventListener(
              "mouseenter",
              () => {
                const src = icon.dataset.resourceUrl;

                if (src) {
                  const { x, y } = icon.getBoundingClientRect();

                  tooltip.style.left = `${x}px`;
                  tooltip.style.top = `${y - 160 - 16}px`;

                  const img = document.createElement("img");
                  img.src = src;
                  img.addEventListener("load", () => {
                    tooltip.style.display = "block";
                  });
                  container.replaceChildren(img);
                }
              },
              true
            );

            icon.addEventListener(
              "mouseleave",
              () => {
                tooltip.style.display = "none";
              },
              true
            );
          });
        }
      });
    });
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
  });
})();
