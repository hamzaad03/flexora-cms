/* FlxOraCMS first-party analytics beacon. Sends one page view per load.
   Skips the admin area. No cookies. */
(function () {
  "use strict";
  try {
    if (location.pathname.indexOf("/admin") === 0) return;
    var data = JSON.stringify({
      path: location.pathname,
      referrer: document.referrer || null,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/track",
        new Blob([data], { type: "application/json" }),
      );
    } else {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data,
        keepalive: true,
      });
    }
  } catch (e) {
    /* ignore */
  }
})();
