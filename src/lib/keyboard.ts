const TEXT_FIELDS = 'input, textarea, select, [contenteditable="true"]'
const OVERLAYS = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]'

// True when a key press belongs to what has focus, so single-key shortcuts
// ("C", "G then B", "[") must not fire: a text field, an editable area, or an
// open dialog, menu or listbox. Pass `overlays: false` to only skip text
// fields, for a handler that already ignores keys from outside its own element.
export function isTyping(target: EventTarget | null, { overlays = true }: { overlays?: boolean } = {}) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return !!target.closest(overlays ? `${TEXT_FIELDS}, ${OVERLAYS}` : TEXT_FIELDS)
}
