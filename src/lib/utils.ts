import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'CLP'): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-CL').format(num)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Transaction statuses
    authorized: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    captured: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    reversed: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    settled: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    // Settlement statuses
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    // Reconciliation
    reconciled: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    mismatch: 'bg-red-500/10 text-red-400 border-red-500/20',
    investigating: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    // Clearing
    generated: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    sent: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    // Disputes
    open: 'bg-red-500/10 text-red-400 border-red-500/20',
    under_review: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    representment: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    won: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    lost: 'bg-red-500/10 text-red-400 border-red-500/20',
    expired: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    // General
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    inactive: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  }
  return colors[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return colors[severity] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}
