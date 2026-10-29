// Applies the saved admin color theme before first paint (no flash).
// Loaded from the root layout via next/script `beforeInteractive`.
// Kept in sync with src/components/theme-provider.tsx (storage key + class).
(function () {
  try {
    var dark = localStorage.getItem("flx-theme") === "dark";
    var root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  } catch (e) {
    /* storage blocked: stay light */
  }
})();
