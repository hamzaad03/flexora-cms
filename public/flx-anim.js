/* FlxOraCMS animation runtime. Loaded only when a page contains [data-anim]
   elements (injected by the server). Lazily loads GSAP + ScrollTrigger, honors
   prefers-reduced-motion, and is SSR/SEO-safe: content is visible without JS;
   gsap.from() animates from the initial state to the natural (rendered) state. */
(function () {
  "use strict";

  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function loadScript(src, cb) {
    var s = document.createElement("script");
    s.src = src;
    s.onload = cb;
    s.onerror = cb;
    document.head.appendChild(s);
  }

  function loadGsap(cb) {
    if (window.gsap && window.ScrollTrigger) return cb();
    loadScript("/vendor/gsap/gsap.min.js", function () {
      loadScript("/vendor/gsap/ScrollTrigger.min.js", function () {
        if (window.gsap && window.ScrollTrigger) {
          window.gsap.registerPlugin(window.ScrollTrigger);
        }
        cb();
      });
    });
  }

  function fromVars(type) {
    switch (type) {
      case "fade":
        return { opacity: 0 };
      case "slide-up":
        return { opacity: 0, y: 40 };
      case "slide-down":
        return { opacity: 0, y: -40 };
      case "slide-left":
        return { opacity: 0, x: 40 };
      case "slide-right":
        return { opacity: 0, x: -40 };
      case "zoom-in":
        return { opacity: 0, scale: 0.85 };
      case "zoom-out":
        return { opacity: 0, scale: 1.15 };
      case "flip":
        return { opacity: 0, rotationX: 90, transformPerspective: 600 };
      case "rotate":
        return { opacity: 0, rotation: -8 };
      case "blur":
        return { opacity: 0, filter: "blur(10px)" };
      default:
        return { opacity: 0 };
    }
  }

  function num(v, d) {
    var n = parseFloat(v);
    return isNaN(n) ? d : n;
  }

  function animate(els) {
    var gsap = window.gsap;
    if (!gsap) return;
    Array.prototype.forEach.call(els, function (el) {
      var type = el.getAttribute("data-anim");
      if (!type || type === "none") return;
      var trigger = el.getAttribute("data-anim-trigger") || "onscroll";
      var stagger = el.getAttribute("data-anim-stagger");
      var once = el.getAttribute("data-anim-once") !== "0";
      var target = stagger ? el.children : el;

      var vars = fromVars(type);
      vars.duration = num(el.getAttribute("data-anim-duration"), 0.6);
      vars.delay = num(el.getAttribute("data-anim-delay"), 0);
      vars.ease = el.getAttribute("data-anim-ease") || "power2.out";
      vars.clearProps = "all";
      if (stagger) vars.stagger = num(stagger, 0.1);
      if (trigger === "onscroll" && window.ScrollTrigger) {
        vars.scrollTrigger = { trigger: el, start: "top 85%", once: once };
      }
      gsap.from(target, vars);
    });
  }

  function init() {
    var els = document.querySelectorAll("[data-anim]");
    if (!els.length || reduce) return; // content already visible — nothing to do
    loadGsap(function () {
      animate(els);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
