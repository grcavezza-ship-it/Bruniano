const WHATSAPP_NUMBER = "393343755885";
const WHATSAPP_MESSAGE = "Buongiorno, vorrei ricevere informazioni e prenotare un appuntamento presso Bruniano.";

function whatsappUrl(message = WHATSAPP_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

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

function setupHomeVideos() {
  const home = document.querySelector(".tech-showcase");
  if (!home) return;

  const videos = [
    {
      selector: ".machine-card:nth-child(1) .machine-visual",
      label: "VIDEO BRUNIANO",
      src: "https://res.cloudinary.com/pomzhih4/video/upload/q_auto,c_limit,w_1280/v1787742244/Tecar.mp4",
      poster: "https://res.cloudinary.com/pomzhih4/video/upload/so_0/q_auto:good,c_limit,w_1280/v1787742244/Tecar.jpg",
      alt: "Video reale del trattamento Tecar Bruniano"
    },
    {
      selector: ".machine-card:nth-child(2) .machine-visual",
      label: "VIDEO BRUNIANO",
      src: "https://res.cloudinary.com/pomzhih4/video/upload/q_auto,c_limit,w_1280/v1787742255/Laser.mp4",
      poster: "https://res.cloudinary.com/pomzhih4/video/upload/so_0/q_auto:good,c_limit,w_1280/v1787742255/Laser.jpg",
      alt: "Video reale del trattamento Laser Bruniano"
    },
    {
      selector: ".machine-card:nth-child(3) .machine-visual",
      label: "VIDEO DI RIFERIMENTO",
      src: "https://res.cloudinary.com/pomzhih4/video/upload/q_auto,c_limit,w_1280/v1787742226/WhatsApp_Video_2026-08-17_at_11.50.58.mp4",
      poster: "https://res.cloudinary.com/pomzhih4/video/upload/so_0/q_auto:good,c_limit,w_1280/v1787742226/WhatsApp_Video_2026-08-17_at_11.50.58.jpg",
      alt: "Video provvisorio di riferimento per Onde d'urto"
    }
  ];

  videos.forEach(({ selector, label, src, poster, alt }) => {
    const box = document.querySelector(selector);
    if (!box) return;

    box.querySelectorAll(".machine-badge, .image-credit-note, .visual-play").forEach((node) => node.remove());
    box.style.backgroundImage = "none";
    box.style.position = "relative";
    box.style.overflow = "hidden";

    const video = document.createElement("video");
    video.src = src;
    video.poster = poster;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("aria-label", alt);
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.minHeight = "270px";
    video.style.objectFit = "cover";
    video.style.display = "block";
    video.addEventListener("error", () => {
      video.controls = true;
      video.autoplay = false;
    });
    box.appendChild(video);

    const badge = document.createElement("span");
    badge.className = "machine-badge";
    badge.textContent = label;
    box.appendChild(badge);
  });

  const demoFrame = document.querySelector(".video-frame");
  if (demoFrame) {
    const iframe = demoFrame.querySelector("iframe");
    const label = demoFrame.querySelector(".demo-video-label");
    if (iframe) {
      const video = document.createElement("video");
      video.src = "https://res.cloudinary.com/pomzhih4/video/upload/q_auto,c_limit,w_1280/v1787742244/Tecar.mp4";
      video.poster = "https://res.cloudinary.com/pomzhih4/video/upload/so_0/q_auto:good,c_limit,w_1280/v1787742244/Tecar.jpg";
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.controls = true;
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      iframe.replaceWith(video);
    }
    if (label) label.textContent = "VIDEO REALE — TECAR";
  }
}

setupHomeVideos();

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
