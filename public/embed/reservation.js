(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;

  var locationId = script.getAttribute("data-location-id");
  if (!locationId) {
    console.error("[Settlo] Missing data-location-id attribute on embed script.");
    return;
  }

  var baseUrl = script.src.replace(/\/embed\/reservation\.js.*$/, "");
  var src = baseUrl + "/reserve/" + locationId;

  // Create container
  var container = document.createElement("div");
  container.id = "settlo-reservation-widget";
  container.style.width = "100%";
  container.style.maxWidth = "540px";
  container.style.margin = "0 auto";

  // Create iframe
  var iframe = document.createElement("iframe");
  iframe.src = src;
  iframe.style.width = "100%";
  iframe.style.border = "none";
  iframe.style.minHeight = "600px";
  iframe.style.borderRadius = "12px";
  iframe.style.overflow = "hidden";
  iframe.setAttribute("title", "Settlo Reservation Booking");
  iframe.setAttribute("loading", "lazy");
  iframe.setAttribute(
    "allow",
    "clipboard-write"
  );

  container.appendChild(iframe);

  // Insert after the script tag
  if (script.parentNode) {
    script.parentNode.insertBefore(container, script.nextSibling);
  }

  // Listen for height messages from the widget
  window.addEventListener("message", function (event) {
    if (event.data && event.data.type === "settlo-reservation-height") {
      iframe.style.height = event.data.height + "px";
    }
  });
})();
