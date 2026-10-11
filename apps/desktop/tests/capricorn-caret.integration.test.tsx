// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { CapricornEditor } from '@/components/EditorArea/CapricornEditor'
import type { CapricornRuntimeAdapter } from '@/components/EditorArea/capricornRuntimeAdapter'

vi.mock('@/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const geometry = ['getClientRects', 'getBoundingClientRect'].map(
  (name) => [name, Object.getOwnPropertyDescriptor(Range.prototype, name)] as const,
)
const scrollToDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo')
const matchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia')
beforeAll(async () => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => new DOMRect(0, 0, 1000, 24),
  )
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  })
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  })
  Object.defineProperties(Range.prototype, {
    getClientRects: {
      configurable: true,
      value(this: Range) {
        return [new DOMRect(20 + this.startOffset * 8, 0, (this.endOffset - this.startOffset) * 8, 24)]
      },
    },
    getBoundingClientRect: {
      configurable: true,
      value() {
        return new DOMRect(20, 0, 8, 24)
      },
    },
  })
  // Match Capricorn's package test fixture: initialize browser selection
  // without changing the package. Geometry remains simulated in jsdom.
  const nodeVersion = Object.getOwnPropertyDescriptor(process.versions, 'node')!
  Reflect.deleteProperty(process.versions, 'node')
  try {
    await import('virtual:markflowy-capricorn-runtime')
  } finally {
    Object.defineProperty(process.versions, 'node', nodeVersion)
  }
})
afterEach(cleanup)
afterAll(() => {
  vi.restoreAllMocks()
  for (const [name, descriptor] of geometry) {
    if (descriptor) Object.defineProperty(Range.prototype, name, descriptor)
    else Reflect.deleteProperty(Range.prototype, name)
  }
  if (scrollToDescriptor) Object.defineProperty(HTMLElement.prototype, 'scrollTo', scrollToDescriptor)
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
  if (matchMediaDescriptor) Object.defineProperty(window, 'matchMedia', matchMediaDescriptor)
  else Reflect.deleteProperty(window, 'matchMedia')
})

function getCaret(container: HTMLElement) {
  for (const layer of container.querySelectorAll('[data-cap-selection-layer]')) {
    const caret = (layer.shadowRoot ?? layer).querySelector('[data-cap-caret]')
    if (caret) return caret
  }
  return null
}

it('toggles body caret animation in the retained runtime without losing edits, selection or undo', async () => {
  const onEditorChange = vi.fn()
  const onChange = vi.fn()
  const onError = vi.fn()
  const original = 'abcdef'
  const props = {
    active: true,
    initialMarkdown: original,
    onEditorChange,
    onChange,
    onError,
    onUnavailable: onError,
  }
  const options = { virtualize: { enable: false } }
  const { container, rerender } = render(<CapricornEditor {...props} options={options} />)
  await waitFor(() => expect(onEditorChange.mock.calls.some(([editor]) => editor)).toBe(true))
  const adapter = onEditorChange.mock.calls.find(([editor]) => editor)![0] as CapricornRuntimeAdapter
  await act(async () => {
    adapter.focus()
    expect(adapter.resume!.restore({
      kind: 'capricorn',
      anchor: { path: [0, 0], offset: 2 },
      focus: { path: [0, 0], offset: 2 },
    })).toBe(true)
    adapter.commands.setBlockType('heading-2')
  })
  await waitFor(() => expect(getCaret(container)).not.toBeNull())
  expect(getCaret(container)!.querySelector('svg')).toBeNull()
  const content = container.querySelector('[data-cap-content]')
  const selection = adapter.resume!.capture()
  const edited = adapter.getMarkdown()
  expect(edited).toBe('## abcdef')
  expect(adapter.getUiState().canUndo).toBe(true)
  onChange.mockClear()

  for (const caretAnimation of [true, false, true, undefined]) {
    rerender(<CapricornEditor {...props} options={{ ...options, caretAnimation }} />)
    await waitFor(() => {
      expect(getCaret(container)).not.toBeNull()
      expect(Boolean(getCaret(container)!.querySelector('svg'))).toBe(caretAnimation === true)
    })
    expect(container.querySelector('[data-cap-content]')).toBe(content)
    expect(adapter.getMarkdown()).toBe(edited)
    expect(adapter.resume!.capture()).toEqual(selection)
    expect(adapter.getUiState().canUndo).toBe(true)
  }
  expect(onEditorChange.mock.calls.filter(([editor]) => editor)).toHaveLength(1)
  expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ documentChanged: true }))
  await act(async () => adapter.commands.undo())
  expect(adapter.getMarkdown()).toBe(original)
  expect(onError).not.toHaveBeenCalled()
})
