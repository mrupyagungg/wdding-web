import { video } from "./video.js";
import { image } from "./image.js";
import { audio } from "./audio.js";
import { progress } from "./progress.js";
import { util } from "../../common/util.js";
import { bs } from "../../libs/bootstrap.js";
import { loader } from "../../libs/loader.js";
import { theme } from "../../common/theme.js";
import { lang } from "../../common/language.js";
import { storage } from "../../common/storage.js";
import { session } from "../../common/session.js";
import { offline } from "../../common/offline.js";
import { comment } from "../components/comment.js";
import * as confetti from "../../libs/confetti.js";
import { pool } from "../../connection/request.js";

export const guest = (() => {
  /**
   * @type {ReturnType<typeof storage>|null}
   */
  let information = null;

  /**
   * @type {ReturnType<typeof storage>|null}
   */
  let config = null;

  /**
   * @returns {void}
   */
  const countDownDate = () => {
    const timeAttr = document.body.getAttribute("data-time");

    if (!timeAttr) return;

    // Ubah ke format ISO
    const count = new Date(timeAttr.replace(" ", "T")).getTime();

    const pad = (num) => (num < 10 ? `0${num}` : `${num}`);

    const day = document.getElementById("day");
    const hour = document.getElementById("hour");
    const minute = document.getElementById("minute");
    const second = document.getElementById("second");

    const updateCountdown = () => {
      const now = Date.now();
      const distance = count - now;

      // Jika waktu sudah lewat
      if (distance <= 0) {
        day.textContent = "00";
        hour.textContent = "00";
        minute.textContent = "00";
        second.textContent = "00";
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      day.textContent = pad(days);
      hour.textContent = pad(hours);
      minute.textContent = pad(minutes);
      second.textContent = pad(seconds);

      // Sinkron ke detik berikutnya
      setTimeout(updateCountdown, 1000 - (now % 1000));
    };

    updateCountdown();
  };

  // Jalankan setelah DOM siap
  document.addEventListener("DOMContentLoaded", countDownDate);

  /**
   * @returns {void}
   */
  const urlParams = new URLSearchParams(window.location.search);
    const guestName = urlParams.get('to');

    const guestElement = document.getElementById('guest-name');

    function capitalizeWords(str) {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    }

    if (guestName) {
        const formattedName = capitalizeWords(decodeURIComponent(guestName));
        guestElement.innerHTML = `
            <p class="mb-1">Kepada Yth Bapak/Ibu/Saudara/i</p>
            <h4 class="mt-1">${formattedName}</h4>
        `;
    } else {
        guestElement.innerHTML = `
            <p>Kepada Yth Bapak/Ibu/Saudara/i</p>
            <h4>Nama Tamu</h4>
        `;
    }
  /**
   * @returns {Promise<void>}
   */
  const slide = async () => {
    const interval = 6000;
    const slides = document.querySelectorAll(".slide-desktop");

    if (!slides || slides.length === 0) {
      return;
    }

    const desktopEl = document
      .getElementById("root")
      ?.querySelector(".d-sm-block");
    if (!desktopEl) {
      return;
    }

    desktopEl.dispatchEvent(new Event("undangan.slide.stop"));

    if (window.getComputedStyle(desktopEl).display === "none") {
      return;
    }

    if (slides.length === 1) {
      await util.changeOpacity(slides[0], true);
      return;
    }

    let index = 0;
    for (const [i, s] of slides.entries()) {
      if (i === index) {
        s.classList.add("slide-desktop-active");
        await util.changeOpacity(s, true);
        break;
      }
    }

    let run = true;
    const nextSlide = async () => {
      await util.changeOpacity(slides[index], false);
      slides[index].classList.remove("slide-desktop-active");

      index = (index + 1) % slides.length;

      if (run) {
        slides[index].classList.add("slide-desktop-active");
        await util.changeOpacity(slides[index], true);
      }

      return run;
    };

    desktopEl.addEventListener("undangan.slide.stop", () => {
      run = false;
    });

    const loop = async () => {
      if (await nextSlide()) {
        util.timeOut(loop, interval);
      }
    };

    util.timeOut(loop, interval);
  };

  /**
   * @param {HTMLButtonElement} button
   * @returns {void}
   */
  const open = (button) => {
    button.disabled = true;
    document.body.scrollIntoView({ behavior: "instant" });
    document.getElementById("root").classList.remove("opacity-0");

    if (theme.isAutoMode()) {
      document.getElementById("button-theme").classList.remove("d-none");
    }

    slide();
    theme.spyTop();

    confetti.basicAnimation();
    util.timeOut(confetti.openAnimation, 1500);

    document.dispatchEvent(new Event("undangan.open"));
    util
      .changeOpacity(document.getElementById("welcome"), false)
      .then((el) => el.remove());
  };

  /**
   * @param {HTMLImageElement} img
   * @returns {void}
   */
  const modal = (img) => {
    document.getElementById("button-modal-click").setAttribute("href", img.src);
    document
      .getElementById("button-modal-download")
      .setAttribute("data-src", img.src);

    const i = document.getElementById("show-modal-image");
    i.src = img.src;
    i.width = img.width;
    i.height = img.height;
    bs.modal("modal-image").show();
  };

  /**
   * @returns {void}
   */
  const modalImageClick = () => {
    document
      .getElementById("show-modal-image")
      .addEventListener("click", (e) => {
        const abs =
          e.currentTarget.parentNode.querySelector(".position-absolute");

        abs.classList.contains("d-none")
          ? abs.classList.replace("d-none", "d-flex")
          : abs.classList.replace("d-flex", "d-none");
      });
  };

  /**
   * @param {HTMLDivElement} div
   * @returns {void}
   */
  const showStory = (div) => {
    if (navigator.vibrate) {
      navigator.vibrate(500);
    }

    confetti.tapTapAnimation(div, 100);
    util.changeOpacity(div, false).then((e) => e.remove());
  };

  /**
   * @returns {void}
   */
  const closeInformation = () => information.set("info", true);

  /**
   * @returns {void}
   */
  const normalizeArabicFont = () => {
    document.querySelectorAll(".font-arabic").forEach((el) => {
      el.innerHTML = String(el.innerHTML).normalize("NFC");
    });
  };

  /**
   * @returns {void}
   */
  const animateSvg = () => {
    document.querySelectorAll("svg").forEach((el) => {
      if (el.hasAttribute("data-class")) {
        util.timeOut(
          () => el.classList.add(el.getAttribute("data-class")),
          parseInt(el.getAttribute("data-time")),
        );
      }
    });
  };

  /**
   * @returns {void}
   */
  const buildGoogleCalendar = () => {
    /**
     * @param {string} d
     * @returns {string}
     */
    const formatDate = (d) =>
      new Date(d.replace(" ", "T") + ":00Z")
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")
        .shift();

    const url = new URL("https://calendar.google.com/calendar/render");
    const data = new URLSearchParams({
      action: "TEMPLATE",
      text: "The Wedding of Priyo and Ruli",
      dates: `${formatDate("2023-03-15 10:00")}/${formatDate("2023-03-15 11:00")}`,
      details:
        "Tanpa mengurangi rasa hormat, kami mengundang Anda untuk berkenan menghadiri acara pernikahan kami. Terima kasih atas perhatian dan doa restu Anda, yang menjadi kebahagiaan serta kehormatan besar bagi kami.",
      location:
        "RT 10 RW 02, Desa Pajerukan, Kec. Kalibagor, Kab. Banyumas, Jawa Tengah 53191.",
      ctz: config.get("tz"),
    });

    url.search = data.toString();
    document
      .querySelector("#home button")
      ?.addEventListener("click", () => window.open(url, "_blank"));
  };

  /**
   * @returns {object}
   */
  const loaderLibs = () => {
    progress.add();

    /**
     * @param {{aos: boolean, confetti: boolean}} opt
     * @returns {void}
     */
    const load = (opt) => {
      loader(opt)
        .then(() => progress.complete("libs"))
        .catch(() => progress.invalid("libs"));
    };

    return {
      load,
    };
  };

  /**
   * @returns {Promise<void>}
   */
  const booting = async () => {
    animateSvg();
    countDownDate();
    showGuestName();
    modalImageClick();
    normalizeArabicFont();
    buildGoogleCalendar();

    if (information.has("presence")) {
      document.getElementById("form-presence").value = information.get(
        "presence",
      )
        ? "1"
        : "2";
    }

    if (information.get("info")) {
      document.getElementById("information")?.remove();
    }

    // wait until welcome screen is show.
    await util.changeOpacity(document.getElementById("welcome"), true);

    // remove loading screen and show welcome screen.
    await util
      .changeOpacity(document.getElementById("loading"), false)
      .then((el) => el.remove());
  };

  /**
   * @returns {void}
   */
  const pageLoaded = () => {
    lang.init();
    offline.init();
    comment.init();
    progress.init();

    config = storage("config");
    information = storage("information");

    const vid = video.init();
    const img = image.init();
    const aud = audio.init();
    const lib = loaderLibs();
    const token = document.body.getAttribute("data-key");
    const params = new URLSearchParams(window.location.search);

    window.addEventListener("resize", util.debounce(slide));
    document.addEventListener("undangan.progress.done", () => booting());
    document.addEventListener("hide.bs.modal", () =>
      document.activeElement?.blur(),
    );
    document
      .getElementById("button-modal-download")
      .addEventListener("click", (e) => {
        img.download(e.currentTarget.getAttribute("data-src"));
      });

    if (!token || token.length <= 0) {
      document.getElementById("comment")?.remove();
      document
        .querySelector('a.nav-link[href="#comment"]')
        ?.closest("li.nav-item")
        ?.remove();

      vid.load();
      img.load();
      aud.load();
      lib.load({
        confetti: document.body.getAttribute("data-confetti") === "true",
      });
    }

    if (token && token.length > 0) {
      // add 2 progress for config and comment.
      // before img.load();
      progress.add();
      progress.add();

      // if don't have data-src.
      if (!img.hasDataSrc()) {
        img.load();
      }

      session
        .guest(params.get("k") ?? token)
        .then(({ data }) => {
          document.dispatchEvent(new Event("undangan.session"));
          progress.complete("config");

          if (img.hasDataSrc()) {
            img.load();
          }

          vid.load();
          aud.load();
          lib.load({ confetti: data.is_confetti_animation });

          comment
            .show()
            .then(() => progress.complete("comment"))
            .catch(() => progress.invalid("comment"));
        })
        .catch(() => progress.invalid("config"));
    }
  };

  /**
   * @returns {object}
   */
  const init = () => {
    theme.init();
    session.init();

    if (session.isAdmin()) {
      storage("user").clear();
      storage("owns").clear();
      storage("likes").clear();
      storage("session").clear();
      storage("comment").clear();
    }

    window.addEventListener("load", () => {
      pool.init(pageLoaded, ["image", "video", "audio", "libs", "gif"]);
    });

    return {
      util,
      theme,
      comment,
      guest: {
        open,
        modal,
        showStory,
        closeInformation,
      },
    };
  };

  return {
    init,
  };
})();
