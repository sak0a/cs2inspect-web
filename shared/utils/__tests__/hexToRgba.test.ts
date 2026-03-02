import { describe, it, expect } from 'bun:test'
import { hexToRgba } from '../hexToRgba'

describe('hexToRgba', () => {
  it('should convert 6-digit hex with # to rgba', () => {
    expect(hexToRgba('#ff0000')).toBe('rgba(255, 0, 0, 1)')
    expect(hexToRgba('#00ff00')).toBe('rgba(0, 255, 0, 1)')
    expect(hexToRgba('#0000ff')).toBe('rgba(0, 0, 255, 1)')
  })

  it('should convert 6-digit hex without # to rgba', () => {
    expect(hexToRgba('ff0000')).toBe('rgba(255, 0, 0, 1)')
  })

  it('should apply string alpha', () => {
    expect(hexToRgba('#000000', '0.5')).toBe('rgba(0, 0, 0, 0.5)')
  })

  it('should apply numeric alpha', () => {
    expect(hexToRgba('#ffffff', 0.75)).toBe('rgba(255, 255, 255, 0.75)')
  })

  it('should handle mixed case hex', () => {
    expect(hexToRgba('#FF8800')).toBe('rgba(255, 136, 0, 1)')
  })

  it('should convert black correctly', () => {
    expect(hexToRgba('#000000')).toBe('rgba(0, 0, 0, 1)')
  })

  it('should convert white correctly', () => {
    expect(hexToRgba('#ffffff')).toBe('rgba(255, 255, 255, 1)')
  })
})
