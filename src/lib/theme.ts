/** Key under which the chosen theme is stored in the browser. */
export const THEME_STORAGE_KEY = "tzar-theme";

/**
 * Runs before the page paints (inlined in the root layout) so a returning visitor never sees a flash of the
 * wrong theme. Light is the default; only an explicit "dark" choice turns dark on.
 * A plain string, so it can be used from both server and client code.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var d=localStorage.getItem("${THEME_STORAGE_KEY}")==="dark";document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;
