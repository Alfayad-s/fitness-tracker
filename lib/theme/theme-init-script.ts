/** Inline script — force light theme before first paint and clear saved theme preference. */
export const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement;d.classList.remove('dark');d.classList.add('light');d.style.colorScheme='light';localStorage.removeItem('theme')}catch(e){}})();`;
