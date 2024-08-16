/*
 * File: emojiStyle.ts
 * Created Date: 5th Mar 2024 16:00:40
 * Author: HanhBT <buihanh2304@gmail.com>
 * -----
 * Copyright (c) 2024 HanhBT
 * -----
 */
import "../css/emoji.css";

enum MessageType {
  ShowProfilePhoto = "show_profile_photo",
}

const eventDataPrefix = "hbt";
const contactsHost = "contacts.google.com";

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
    (e) => {
      if (!tooltip.classList.contains("full-screen")) {
        tooltip.style.display = "none";
      }
    },
    true
  );

  const handleMessage = (evt: MessageEvent<string>) => {
    if (
      evt.origin.slice(-contactsHost.length) === contactsHost &&
      evt.data.startsWith(eventDataPrefix)
    ) {
      const data = JSON.parse(evt.data.slice(eventDataPrefix.length));

      switch (data.type) {
        case MessageType.ShowProfilePhoto:
          const iframe = document.querySelector(
            'iframe[src*="//contacts.google.com/widget/"], iframe[src*="//contacts.google.com/u/"]'
          );

          if (!iframe) {
            return;
          }

          const clientWidth = document.documentElement.clientWidth;
          const clientHeight = document.documentElement.clientHeight;

          const { x, y } = iframe.getBoundingClientRect();

          const left = x > 200 && x + 280 < clientWidth ? x - 200 : x + 280 > clientWidth ? clientWidth - 500 : 20;
          const top = y > 200 && y + 280 < clientHeight ? y - 200 : y + 280 > clientHeight ? clientHeight - 500 : 20;

          tooltip.style.left = `${left}px`;
          tooltip.style.top = `${top}px`;

          const img = document.createElement("img");
          img.src = data.data.src;
          img.addEventListener("load", () => {
            tooltip.style.display = "block";
            tooltip.classList.add("full-screen");
          });
          img.addEventListener("click", () => {
            tooltip.style.display = "none";
            tooltip.classList.remove("full-screen");
          });
          img.addEventListener("mouseout", () => {
            tooltip.style.display = "none";
            tooltip.classList.remove("full-screen");
          });
          container.replaceChildren(img);
          break;

        default:
          break;
      }
    }
  };

  window.addEventListener("message", handleMessage, false);

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
        const ariaLabel = isElement
          ? addedItem.getAttribute("aria-label")
          : null;

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
        } else if (ariaLabel && ariaLabel.toLowerCase() === "person info") {
          const avatar: HTMLElement | null = addedItem.querySelector(
            '[src*="googleusercontent.com"][alt="Profile Photo"]'
          );

          if (avatar) {
            let timeout: number | undefined;

            avatar.parentElement?.classList.add('circle');

            avatar.parentElement?.addEventListener(
              "mouseover",
              () => {
                const src = avatar.getAttribute("src");

                if (src) {
                  timeout = setTimeout(() => {
                    window.parent.postMessage(
                      eventDataPrefix +
                      JSON.stringify({
                        type: MessageType.ShowProfilePhoto,
                        data: {
                          src: src.replace(/=s(\d+)(-[a-z]+)+$/, "=s480$2"),
                        },
                      }),
                      "*"
                    );
                  }, 500);
                }
              },
              true
            );

            avatar.parentElement?.addEventListener(
              "mouseleave",
              () => {
                clearTimeout(timeout);
              },
              true
            );
          }
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
