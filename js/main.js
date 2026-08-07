document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  const dotMenuToggle = document.querySelector('.dot-menu-toggle');
  const dotMenu = document.querySelector('.dot-menu');

  if (dotMenuToggle && dotMenu) {
    dotMenuToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = !dotMenu.classList.contains('hidden');
      dotMenu.classList.toggle('hidden');
      dotMenuToggle.setAttribute('aria-expanded', String(!isOpen));
    });

    document.addEventListener('click', (event) => {
      if (!dotMenu.contains(event.target) && !dotMenuToggle.contains(event.target)) {
        dotMenu.classList.add('hidden');
        dotMenuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const yearNode = document.getElementById('current-year');
  if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
  }

  const homeSearchForm = document.getElementById('home-search-form');
  if (homeSearchForm) {
    homeSearchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const searchInput = document.getElementById('home-search-input');
      const value = searchInput ? searchInput.value.trim() : '';
      if (value) {
        window.location.href = `./products.html?search=${encodeURIComponent(value)}`;
      } else {
        window.location.href = './products.html';
      }
    });
  }

  const compactSearchForm = document.getElementById('home-compact-search');
  if (compactSearchForm) {
    compactSearchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const searchInput = document.getElementById('home-search-field');
      const value = searchInput ? searchInput.value.trim() : '';
      if (value) {
        window.location.href = `./products.html?search=${encodeURIComponent(value)}`;
      } else {
        window.location.href = './products.html';
      }
    });
  }
});
