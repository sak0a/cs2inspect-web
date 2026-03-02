/**
 * Shared input props for numeric-only NInputNumber fields.
 * Prevents non-digit input via keyboard and paste.
 */
export const digitOnlyInputProps = {
  inputmode: 'numeric' as const,
  pattern: '\\d*',
  onKeydown: (e: KeyboardEvent) => {
    const allow = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter']
    const meta = e.ctrlKey || e.metaKey
    if (allow.includes(e.key) || (meta && /[acvxy]/i.test(e.key))) return
    if (!/^[0-9]$/.test(e.key)) e.preventDefault()
  },
  onPaste: (e: ClipboardEvent) => {
    const t = e.clipboardData?.getData('text') || ''
    if (/[^0-9]/.test(t)) e.preventDefault()
  },
}
