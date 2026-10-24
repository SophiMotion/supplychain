import assert from 'node:assert/strict'
import test from 'node:test'

import { JSDOM } from 'jsdom'

import { trapDialogFocus } from '../src/data/focus.js'

function setupDialog() {
  const dom = new JSDOM(`
    <button id="outside">outside</button>
    <aside id="dialog">
      <button id="close">close</button>
      <a id="source" href="https://example.com">source</a>
    </aside>
  `, { pretendToBeVisual: true })
  const document = dom.window.document
  return {
    dom,
    dialog: document.querySelector('#dialog'),
    close: document.querySelector('#close'),
    source: document.querySelector('#source'),
  }
}

test('Tab from the last control loops to the first control in the dialog', () => {
  const { dom, dialog, close, source } = setupDialog()
  source.focus()
  const event = new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })

  assert.equal(trapDialogFocus(event, dialog), true)
  assert.equal(event.defaultPrevented, true)
  assert.equal(dom.window.document.activeElement, close)
})

test('Shift+Tab from the first control loops to the last control in the dialog', () => {
  const { dom, dialog, close, source } = setupDialog()
  close.focus()
  const event = new dom.window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })

  assert.equal(trapDialogFocus(event, dialog), true)
  assert.equal(event.defaultPrevented, true)
  assert.equal(dom.window.document.activeElement, source)
})

test('non-Tab keys are not intercepted', () => {
  const { dom, dialog, close } = setupDialog()
  close.focus()
  const event = new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })

  assert.equal(trapDialogFocus(event, dialog), false)
  assert.equal(event.defaultPrevented, false)
  assert.equal(dom.window.document.activeElement, close)
})
