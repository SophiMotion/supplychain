const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function getFocusableElements(container) {
  if (!container) return []
  return [...container.querySelectorAll(FOCUSABLE_SELECTOR)].filter((element) => {
    if (element.closest('[hidden], [inert]')) return false
    const view = element.ownerDocument?.defaultView
    const style = view?.getComputedStyle(element)
    return style?.display !== 'none' && style?.visibility !== 'hidden'
  })
}

export function trapDialogFocus(event, dialog) {
  if (event.key !== 'Tab' || !dialog) return false
  const focusable = getFocusableElements(dialog)
  if (!focusable.length) {
    event.preventDefault()
    dialog.focus()
    return true
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = dialog.ownerDocument.activeElement
  if (event.shiftKey && (active === first || !dialog.contains(active))) {
    event.preventDefault()
    last.focus()
    return true
  }
  if (!event.shiftKey && (active === last || !dialog.contains(active))) {
    event.preventDefault()
    first.focus()
    return true
  }
  return false
}
