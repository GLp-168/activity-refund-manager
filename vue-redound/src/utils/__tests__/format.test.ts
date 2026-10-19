import { describe, expect, it } from 'vitest'
import { formatCurrency } from '../format'

describe('refund currency display', () => {
  it('renders MySQL DECIMAL strings and numeric amounts', () => {
    expect(formatCurrency('12.50')).toBe('￥12.50')
    expect(formatCurrency(12.5)).toBe('￥12.50')
    expect(formatCurrency('0.00')).toBe('￥0.00')
  })

  it('handles absent and invalid amounts without crashing the table', () => {
    for (const value of [undefined, null, '', 'invalid', NaN, Infinity]) {
      expect(formatCurrency(value)).toBe('￥0.00')
    }
  })
})
