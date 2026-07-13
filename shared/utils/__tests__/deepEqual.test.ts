import { describe, it, expect } from 'bun:test'
import { deepEqual } from '../deepEqual'

describe('deepEqual', () => {
  it('should return true for identical primitives', () => {
    expect(deepEqual(1, 1)).toBe(true)
    expect(deepEqual('a', 'a')).toBe(true)
    expect(deepEqual(true, true)).toBe(true)
  })

  it('should return false for different primitives', () => {
    expect(deepEqual(1, 2)).toBe(false)
    expect(deepEqual('a', 'b')).toBe(false)
    expect(deepEqual(true, false)).toBe(false)
  })

  it('should return true for same reference', () => {
    const obj = { a: 1 }
    expect(deepEqual(obj, obj)).toBe(true)
  })

  it('should handle null comparisons', () => {
    expect(deepEqual(null, null)).toBe(true)
    expect(deepEqual(null, undefined)).toBe(false)
    expect(deepEqual(null, { a: 1 })).toBe(false)
    expect(deepEqual({ a: 1 }, null)).toBe(false)
  })

  it('should compare flat objects', () => {
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false)
  })

  it('should return false for objects with different key counts', () => {
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false)
  })

  it('should return false for objects with different keys', () => {
    expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false)
  })

  it('should compare nested objects', () => {
    expect(deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } })).toBe(true)
    expect(deepEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } })).toBe(false)
  })

  it('should compare arrays', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false)
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false)
  })

  it('should compare mixed types correctly', () => {
    expect(deepEqual(1, '1')).toBe(false)
    expect(deepEqual(0, false)).toBe(false)
    expect(deepEqual('', false)).toBe(false)
  })
})
