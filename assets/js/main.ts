/*
 * File: main.ts
 * Created Date: 5th Mar 2024 16:00:40
 * Author: HanhBT <buihanh2304@gmail.com>
 * -----
 * Copyright (c) 2024 HanhBT
 * -----
 */
import dayjs, { Dayjs } from 'dayjs';
import { computePosition, offset } from '@floating-ui/dom';

import "../css/styles.css";

enum MessageType {
  ShowProfilePhoto = "show_profile_photo",
}

enum ShowType {
  WORKED = "Worked",
  TIME_LEFT = "Time left",
  CHECKOUT_TIME = "Checkout time",
}

enum WorkFor {
  SIX = "6",
  EIGHT = "8",
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

(async () => {
  async function workTime () {
    const formEl = document.querySelector('form#aso_search_form_anchor');

    if (formEl?.parentElement && formEl.parentElement.nextElementSibling) {
      const options = [
        ShowType.WORKED,
        ShowType.TIME_LEFT,
        ShowType.CHECKOUT_TIME
      ];

      const workForOptions = [
        WorkFor.EIGHT,
        WorkFor.SIX,
      ];

      let time = await chrome.storage.local.get(['start_working_time', 'display_mode', 'work_for']);
      let workingTime: Dayjs = time.start_working_time
        ? dayjs(time.start_working_time) :
        dayjs();
      workingTime = workingTime.startOf('minute');

      let mode = time.display_mode && options.includes(time.display_mode) ? time.display_mode : options[0];
      let workFor = time.work_for && workForOptions.includes(time.work_for) ? time.work_for : workForOptions[0];

      const isCurrentDate = workingTime.isSame(dayjs(), 'day');

      if (!time.start_working_time || !isCurrentDate) {
        if (!isCurrentDate) {
          workingTime = dayjs().startOf('minute');
        }

        await chrome.storage.local.set({ start_working_time: workingTime.toISOString() });
      }

      const timeEl = document.createElement("div");
      timeEl.classList.add('working-time');

      const input = document.createElement("input");
      input.type = "time";
      input.value = workingTime.format('HH:mm:00');

      input.addEventListener('change', async (e) => {
        const target = e.target as HTMLInputElement;

        if (target.value === '') {
          return;
        }

        let [hours, minutes] = target.value.split(':').map((v) => parseInt(v));

        workingTime = workingTime.set('hour', hours)
          .set('minute', minutes);
        await chrome.storage.local.set({ start_working_time: workingTime.toISOString() });

        timeEl.innerText = calculateWorkTime(workingTime, mode, workFor);
      });

      const label = document.createElement("label");
      label.innerText = "Check-in";

      const workForSelect = document.createElement("select");

      workForOptions.forEach((option) => {
        const optionEl = document.createElement("option");
        optionEl.value = option;
        optionEl.innerText = option + ' hours';
        if (option === workFor) {
          optionEl.selected = true;
        }
        workForSelect.appendChild(optionEl);
      });

      workForSelect.addEventListener('change', async (e) => {
        const target = e.target as HTMLSelectElement;
        let value = target.value as WorkFor;
        value = workForOptions.includes(value) ? value : workForOptions[0];
        workFor = value;
        await chrome.storage.local.set({ work_for: workFor });


        timeEl.innerText = calculateWorkTime(workingTime, mode, workFor);
      });

      const workForLabel = document.createElement("label");
      workForLabel.innerText = 'Work for';

      const modeSelect = document.createElement("select");

      options.forEach((option) => {
        const optionEl = document.createElement("option");
        optionEl.value = option;
        optionEl.innerText = option;
        if (option === mode) {
          optionEl.selected = true;
        }
        modeSelect.appendChild(optionEl);
      });

      modeSelect.addEventListener('change', async (e) => {
        const target = e.target as HTMLSelectElement;
        let value = target.value as ShowType;
        value = options.includes(value) ? value : options[0];
        mode = value;
        await chrome.storage.local.set({ display_mode: mode });


        timeEl.innerText = calculateWorkTime(workingTime, mode, workFor);
      });

      const modeLabel = document.createElement("label");
      modeLabel.innerText = 'Mode';

      const modalEl = document.createElement("div");
      modalEl.classList.add('working-time-modal');
      modalEl.hidden = true;

      modalEl.appendChild(label);
      modalEl.appendChild(input);
      modalEl.appendChild(workForLabel);
      modalEl.appendChild(workForSelect);
      modalEl.appendChild(modeLabel);
      modalEl.appendChild(modeSelect);

      const updatePosition = () => {
        computePosition(timeEl, modalEl, {
          middleware: [offset(10)]
        }).then(({ x, y }) => {
          Object.assign(modalEl.style, {
            left: `${x}px`,
            top: `${y}px`,
          });
        });
      };

      timeEl.addEventListener("click", () => {
        modalEl.hidden = !modalEl.hidden;
        updatePosition();
      }, true);

      timeEl.innerText = calculateWorkTime(workingTime, mode, workFor);

      formEl.parentElement.nextElementSibling.prepend(timeEl);
      formEl.parentElement.nextElementSibling.append(modalEl);

      document.documentElement.addEventListener('click', (e) => {
        const target = e.target as Node | null;

        if (modalEl.hidden === false && !timeEl.isSameNode(target) && !modalEl.contains(e.target as Node | null)) {
          modalEl.hidden = true;
        }
      }, true);

      window.addEventListener("blur", () => {
        setTimeout(() => {
          if (document.activeElement?.tagName === "IFRAME") {
            modalEl.hidden = true;
          }
        });
      });

      setInterval(() => {
        timeEl.innerText = calculateWorkTime(workingTime, mode, workFor);
      }, 5000);
    }
  }

  const calculateWorkTime = (from: Dayjs, mode: string, workFor: WorkFor = WorkFor.EIGHT) => {
    if (mode === ShowType.CHECKOUT_TIME) {
      const checkoutAt = from.add(parseInt(workFor), 'hours').add(75, 'minute');

      return `Checkout at ${checkoutAt.format('HH:mm')}`;
    }

    if (dayjs().isBefore(from)) {
      return '00:00';
    }

    let minutes = dayjs().diff(from, 'minutes');

    if (mode === ShowType.WORKED) {
      if (minutes > 315) {
        minutes -= 75;
      } else if (minutes > 240) {
        minutes = 240;
      }
    }

    if (mode === ShowType.TIME_LEFT) {
      minutes = Math.max(0, parseInt(workFor) * 60 + 75 - minutes);
    }

    const hours = Math.floor(minutes / 60);
    minutes = minutes - hours * 60;

    if (mode === ShowType.TIME_LEFT) {
      return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes} left`;
    }

    return `Worked ${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
  };

  setTimeout(() => {
    workTime();
  }, 5000);

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

          const left = x > 200 && x + 280 < clientWidth ? x - 200 : x + 280 >= clientWidth ? clientWidth - 500 : 20;
          const top = y > 200 && y + 280 < clientHeight ? y - 200 : y + 280 >= clientHeight ? clientHeight - 500 : 20;

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
