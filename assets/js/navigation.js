const button = document.getElementById("mobile-menu-button");
const menu = document.getElementById("mobile-menu");

if (button && menu) {
  const closeMenu = () => {
    menu.classList.add("hidden");
    button.setAttribute("aria-expanded", "false");
    button.textContent = "☰";
    document.body.classList.remove("overflow-hidden");
  };

  const openMenu = () => {
    menu.classList.remove("hidden");
    button.setAttribute("aria-expanded", "true");
    button.textContent = "✕";
    document.body.classList.add("overflow-hidden");
  };

  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";

    if (expanded) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      !menu.classList.contains("hidden") &&
      !menu.contains(event.target) &&
      !button.contains(event.target)
    ) {
      closeMenu();
    }
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
}
