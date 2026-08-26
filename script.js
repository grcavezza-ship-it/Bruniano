const WHATSAPP_NUMBER = "393343755885";
const WHATSAPP_MESSAGE = "Buongiorno, vorrei ricevere informazioni e prenotare un appuntamento presso Bruniano.";

function whatsappUrl(message = WHATSAPP_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

const style = document.createElement("link");
style.rel = "stylesheet";
style.href = "site-v2.css";
document.head.appendChild(style);

document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  link.href = whatsappUrl();
  link.target = "_blank";
  link.rel = "noopener noreferrer";
});

const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");
if (menuToggle && mobileNav) {
  menuToggle.addEventListener("click", () => {
    const open = mobileNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  mobileNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
