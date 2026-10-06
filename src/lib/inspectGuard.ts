/**
 * Browser "Inspect" deterrent.
 *
 * ⚠️ THIS IS COSMETIC, NOT SECURITY. It blocks the usual DevTools shortcuts and
 * the right-click menu so a casual user cannot casually open the inspector — but
 * anyone determined can still reach it (browser menu → More tools → Developer
 * tools, `view-source:`, or a plain HTTP client). Never treat it as protection.
 *
 * The protections that actually matter are enforced server-side and are entirely
 * unaffected by this file:
 *   • Row Level Security on every table — the database decides what a signed-in
 *     user may read or write.
 *   • The `service_role` key lives only inside the `admin-staff` Edge Function.
 *   • Staff account operations require an MFA-verified administrator.
 *
 * Set `VITE_BLOCK_INSPECT=false` in `.env.local` to disable while developing.
 */

interface Combo {
  code: string;
  ctrl?: boolean;
  shift?: boolean;
}

/** Keyboard shortcuts that normally open DevTools or the page source. */
const COMBOS: Combo[] = [
  { code: 'F12' }, // DevTools (all browsers)
  { code: 'KeyI', ctrl: true, shift: true }, // DevTools (Chrome / Edge)
  { code: 'KeyJ', ctrl: true, shift: true }, // Console (Chrome / Edge)
  { code: 'KeyC', ctrl: true, shift: true }, // Inspect element
  { code: 'KeyK', ctrl: true, shift: true }, // Console (Firefox)
  { code: 'KeyU', ctrl: true }, // View source
];

/** The parts of a keyboard event this guard cares about. */
export interface KeyLike {
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

/** True when the key event matches one of the DevTools / view-source shortcuts. */
export function isBlockedShortcut(event: KeyLike): boolean {
  return COMBOS.some((combo) => {
    if (combo.code !== event.code) return false;
    if (Boolean(combo.ctrl) !== (event.ctrlKey || event.metaKey)) return false;
    if (Boolean(combo.shift) !== event.shiftKey) return false;
    return true;
  });
}

/** True for text fields, where the native right-click menu (paste) is kept. */
function isTextEntry(target: EventTarget | null): boolean {
  return Boolean(
    (target as HTMLElement | null)?.closest?.('input, textarea, [contenteditable="true"]'),
  );
}

/**
 * Installs the listeners and returns a teardown function. It is a no-op when
 * `VITE_BLOCK_INSPECT` is explicitly set to `false`.
 */
export function installInspectGuard(): () => void {
  if (import.meta.env.VITE_BLOCK_INSPECT === 'false') return () => {};

  const blockContextMenu = (event: MouseEvent) => {
    /* Keep paste/undo available in form fields — only the page chrome is blocked. */
    if (isTextEntry(event.target)) return;
    event.preventDefault();
  };

  const blockShortcut = (event: KeyboardEvent) => {
    if (isBlockedShortcut(event)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  document.addEventListener('contextmenu', blockContextMenu);
  window.addEventListener('keydown', blockShortcut, true);

  return () => {
    document.removeEventListener('contextmenu', blockContextMenu);
    window.removeEventListener('keydown', blockShortcut, true);
  };
}
