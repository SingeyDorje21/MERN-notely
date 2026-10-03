// Per-browser view preferences for the notes list. Storage can be unavailable
// (private mode, blocked site data), so every access falls back to defaults.
const STORAGE_KEY = "notely:prefs";
const DEFAULTS = { sort: "updated", view: "grid" };

export function loadPrefs() {
    try {
        return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
    } catch {
        return { ...DEFAULTS };
    }
}

export function savePrefs(prefs) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
        // Not persisted; the in-memory choice still applies for this visit
    }
}
