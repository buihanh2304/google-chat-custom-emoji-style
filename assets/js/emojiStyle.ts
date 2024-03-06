import "../css/emoji.css";

const createTooltip = (): [HTMLElement, HTMLElement] => {
  const tooltipId = "hbtEmojiTooltip";
  const tooltipContainerId = "hbtEmojiTooltipContainer";
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

  const observer = new MutationObserver((items: MutationRecord[]) => {
    items.forEach((item) => {
      (item.addedNodes as NodeListOf<HTMLElement>).forEach((addedItem) => {
        if (
          addedItem.nodeType === 1 &&
          addedItem.getAttribute("role") === "presentation"
        ) {
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
              {
                capture: true,
              }
            );

            icon.addEventListener("mouseleave", () => {
              tooltip.style.display = "none";
            },
            {
              capture: true,
            });
          });

          addedItem.addEventListener("mouseleave", () => {
            tooltip.style.display = "none";
          },
          {
            capture: true,
          });
        }
      });
    });
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
  });
})();