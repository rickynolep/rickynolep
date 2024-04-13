document.addEventListener("DOMContentLoaded", function() {
  const bgVideo = document.getElementById("bg-video");
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.navbar-menu li a');
  const content = document.getElementById('content');
  const joinDiscordButton = document.querySelector('.navbar-menu .join-discord');

  bgVideo.addEventListener('loadeddata', function() {
    bgVideo.classList.add('loaded');
    navbar.classList.add('loaded');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const url = link.getAttribute('href');
      navigateTo(url);
    });
  });

  function navigateTo(url) {
    fetch(url)
      .then(response => response.text())
      .then(html => {
        content.classList.remove('fade-in');
        setTimeout(() => {
          content.innerHTML = html;
          content.classList.add('fade-in');
        }, 300);
      })
      .catch(error => {
        console.log(`Error loading ${url}:`, error);
      });
  }

  joinDiscordButton.addEventListener('click', function(event) {
    event.preventDefault();
    const discordLink = 'https://discord.gg/yneN8g7kVy';
    window.location.href = discordLink;
  });
});
