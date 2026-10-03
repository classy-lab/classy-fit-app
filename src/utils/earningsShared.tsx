import React from 'react'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { AppColors } from '../styles/colors'
import type { EarningsCategoryKey, EarningsPeriod } from '../types/earnings'

export const categoryOrder: EarningsCategoryKey[] = [
  'classes',
  'memberships',
  'personal_training',
  'products',
]

export const categoryCards: Record<
  EarningsCategoryKey,
  {
    title: string
    icon: React.ReactNode
    color: string
  }
> = {
  classes: {
    title: 'Classes',
    icon: <FontAwesome5 name="calendar-alt" size={24} color={AppColors.blue} />,
    color: '#4C6FFF',
  },
  memberships: {
    title: 'Memberships',
    icon: <MaterialCommunityIcons name="credit-card-outline" size={30} color={AppColors.blue} />,
    color: '#FF6C40',
  },
  personal_training: {
    title: 'Personal Training',
    icon: <MaterialCommunityIcons name="dumbbell" size={30} color={AppColors.blue} />,
    color: '#2BB673',
  },
  products: {
    title: 'Products',
    icon: <MaterialCommunityIcons name="shopping" size={30} color={AppColors.blue} />,
    color: '#F5B700',
  },
}

export const PERIOD_OPTIONS: {
  key: EarningsPeriod
  label: string
  title: string
  previousLabel: string
}[] = [
  { key: '7d', label: '7D', title: 'Last 7 days', previousLabel: 'prior 7 days' },
  { key: '30d', label: '30D', title: 'Last 30 days', previousLabel: 'prior 30 days' },
  { key: '90d', label: '90D', title: 'Last 90 days', previousLabel: 'prior 90 days' },
  { key: '1y', label: '1Y', title: 'Last 12 months', previousLabel: 'prior year' },
]

// Used by the combined "All Earnings" card and screen.
export const allEarningsCard = {
  title: 'All Earnings',
  icon: <MaterialCommunityIcons name="cash-multiple" size={30} color={AppColors.blue} />,
  color: AppColors.blue,
}

export const POSITIVE_COLOR = '#2BB673'
export const NEGATIVE_COLOR = '#E5484D'

export type Delta = { label: string; direction: 'up' | 'down' | 'flat' }

export const getDelta = (current: number, previous?: number | null): Delta | null => {
  if (previous === undefined || previous === null) {
    return null
  }

  if (previous <= 0) {
    return current > 0 ? { label: 'New', direction: 'up' } : null
  }

  const change = (current - previous) / previous
  return {
    label: `${Math.abs(Math.round(change * 100))}%`,
    direction: change > 0.005 ? 'up' : change < -0.005 ? 'down' : 'flat',
  }
}

// Weekly buckets for 90 days and 30-day buckets for a year keep the trend chart readable.
export const getBucketSize = (period: EarningsPeriod) =>
  period === '90d' ? 7 : period === '1y' ? 30 : 1

export const formatCompactAxis = (label: string) => {
  const value = Number(String(label).replace(/,/g, ''))
  if (!Number.isFinite(value) || value < 1000) {
    return label
  }

  return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
}

export const formatPercent = (value: number) => `${Math.round(value * 100)}%`

export const parseApiDate = (value?: string | null) => {
  if (!value) {
    return null
  }

  // Accepts both 'YYYY-MM-DD' and 'YYYY-MM-DD HH:mm:ss'.
  const normalized = value.includes(' ')
    ? value.replace(' ', 'T')
    : `${value}T00:00:00`
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

export const formatShortDate = (value?: string | null) => {
  const date = parseApiDate(value)
  return date
    ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
    : value ?? '—'
}

export const formatDayAndDate = (value?: string | null) => {
  const date = parseApiDate(value)
  return date
    ? new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(date)
    : value ?? '—'
}

export const formatDateTime = (value?: string | null) => {
  const date = parseApiDate(value)
  return date
    ? new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(date)
    : '—'
}

export const getInitials = (name?: string | null) => {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

const currencyFormatters = new Map<string, Intl.NumberFormat>()

export const formatMoney = (value: number, currency = 'USD') => {
  let formatter = currencyFormatters.get(currency)

  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    } catch {
      formatter = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }
    currencyFormatters.set(currency, formatter)
  }

  return formatter.format(value)
}

export const roundMoney = (value: number) => Math.round(value * 100) / 100
