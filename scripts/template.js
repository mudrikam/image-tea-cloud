
// Image Tea Cloud Template Scripts
// Theme management and homepage redirect functionality

function setTheme(theme) {
  if (theme === 'auto') {
    document.documentElement.removeAttribute('data-bs-theme');
    const autoTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', autoTheme);
  } else {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }
  localStorage.setItem('theme', theme);
}

function getStoredTheme() {
  return localStorage.getItem('theme');
}

function getPreferredTheme() {
  const storedTheme = getStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }
  return 'auto';
}

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

function handleThemeChange() {
  const storedTheme = getStoredTheme();
  if (storedTheme === 'auto') {
    const newTheme = mediaQuery.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', newTheme);
  }
}

mediaQuery.addEventListener('change', handleThemeChange);

const theme = getPreferredTheme();
setTheme(theme);

window.addEventListener('DOMContentLoaded', () => {
  const theme = getPreferredTheme();
  setTheme(theme);
  
  // Redirect homepage to landing page - works on all devices including mobile
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  const currentHash = window.location.hash;
  
  // Check if it's homepage (desktop or mobile with ?m=1) and redirect
  if ((currentPath === '/' || currentPath === '/index.html') && !currentHash) {
    // Allow redirect even with ?m=1 parameter for mobile
    window.location.replace('/p/home.html');
  }
});