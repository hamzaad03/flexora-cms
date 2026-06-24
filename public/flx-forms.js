/* FlxOraCMS forms: progressive enhancement. Posts via fetch and shows inline
   success/error. Works as a normal POST without JS (server returns JSON). */
(function () {
  "use strict";

  function clearErrors(form) {
    form.querySelectorAll(".flx-form__error").forEach(function (el) {
      el.textContent = "";
    });
    var status = form.querySelector(".flx-form__status");
    if (status) {
      status.textContent = "";
      status.className = "flx-form__status";
    }
  }

  function showErrors(form, errors) {
    Object.keys(errors).forEach(function (key) {
      if (key === "_form") return;
      var el = form.querySelector('.flx-form__error[data-for="' + key + '"]');
      if (el) el.textContent = errors[key];
    });
  }

  function enhance(form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearErrors(form);
      var status = form.querySelector(".flx-form__status");
      var btn = form.querySelector(".flx-form__submit");
      if (btn) btn.disabled = true;

      fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (res) {
          if (btn) btn.disabled = false;
          if (res && res.ok) {
            form.reset();
            if (status) {
              status.textContent = res.message || "Thanks!";
              status.className = "flx-form__status is-success";
            }
          } else {
            if (res && res.errors) showErrors(form, res.errors);
            if (status) {
              status.textContent =
                (res && res.errors && res.errors._form) ||
                "Please fix the errors and try again.";
              status.className = "flx-form__status is-error";
            }
          }
        })
        .catch(function () {
          if (btn) btn.disabled = false;
          if (status) {
            status.textContent = "Something went wrong. Please try again.";
            status.className = "flx-form__status is-error";
          }
        });
    });
  }

  function init() {
    document.querySelectorAll("form.flx-form").forEach(enhance);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
