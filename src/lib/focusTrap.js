function focusables(root) {
  return Array.from(
    root.querySelectorAll("a[href],button,input,select,textarea,[tabindex],[contenteditable='true']"),
  ).filter(
    el => !el.disabled && el.tabIndex >= 0 && el.getAttribute('aria-hidden') !== 'true' && el.getClientRects().length > 0,
  );
}

// Keeps Tab focus inside `root`. Returns a release function that restores the previous focus.
export function trapFocus(root) {
  const previous = document.activeElement;
  const focusEdge = (last = false) => {
    const items = focusables(root);
    const target = last ? items[items.length - 1] : items[0];
    (target ?? root).focus();
  };
  if (!root.contains(document.activeElement)) focusEdge();

  const onKeyDown = e => {
    if (e.key !== 'Tab') return;
    const items = focusables(root);
    const active = document.activeElement;
    if (items.length === 0) {
      e.preventDefault();
      root.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (!active || active === root || !root.contains(active)) {
      e.preventDefault();
      focusEdge(e.shiftKey);
      return;
    }
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };
  const onFocusIn = e => {
    if (e.target instanceof Node && !root.contains(e.target)) focusEdge();
  };

  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('focusin', onFocusIn, true);
  return (restore = true) => {
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('focusin', onFocusIn, true);
    if (restore && previous && document.contains(previous)) previous.focus();
  };
}
