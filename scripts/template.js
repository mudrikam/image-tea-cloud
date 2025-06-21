
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
  
  // Redirect homepage to landing page - works on all devices
  if ((window.location.pathname === '/' || window.location.pathname === '/index.html') && !window.location.search && !window.location.hash) {
    window.location.replace('/p/home.html');
  }
});