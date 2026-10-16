// Classy Fit uses US dollars only. There is no currency conversion and no currency selection.
export const APP_CURRENCY_CODE = 'USD'

const usdFormatter = (() => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: APP_CURRENCY_CODE,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  } catch {
    return null
  }
})()

/** Formats an amount as US dollars with two decimals, e.g. $12.50. Non-numeric input is shown as $0.00. */
export const formatUsd = (value?: number | string | null): string => {
  const amount = Number(value ?? 0)
  const safeAmount = Number.isFinite(amount) ? amount : 0

  if (usdFormatter) {
    return usdFormatter.format(safeAmount)
  }

  return `${safeAmount < 0 ? '-' : ''}$${Math.abs(safeAmount).toFixed(2)}`
}

/** Like formatUsd, but shows "Free" for zero or negative prices (sessions, classes and plans that cost nothing). */
export const formatUsdOrFree = (value?: number | string | null): string => {
  const amount = Number(value ?? 0)

  return !Number.isFinite(amount) || amount <= 0 ? 'Free' : formatUsd(amount)
}
