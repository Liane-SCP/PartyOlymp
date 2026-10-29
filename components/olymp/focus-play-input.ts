/** Keep automatic game focus below any open settings or private dialog. */
export function focusPlayInput(node: HTMLInputElement | HTMLTextAreaElement | null): boolean {
  if (document.hidden || !node || node.disabled || !node.isConnected || node.closest('[inert]') || !node.getClientRects().length) return false;
  const dialogs = [...document.querySelectorAll<HTMLElement>('.modal-backdrop [role="dialog"], [aria-modal="true"]')];
  const top = dialogs.filter(dialog => dialog.getClientRects().length > 0).at(-1);
  if (top && !top.contains(node)) return false;
  node.focus({preventScroll:true});
  return document.activeElement === node;
}
