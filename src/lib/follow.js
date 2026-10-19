// "Theo dõi" (follow) list. The original stores it on the server; this copy keeps it in the browser.
const KEY = 'sts-bid:theo-doi';

export function loadFollowed() {
  try {
    const raw = window.localStorage.getItem(KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function saveFollowed(ids) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    // Storage unavailable (private mode); following still works for this visit.
  }
}
