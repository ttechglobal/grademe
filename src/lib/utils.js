import { clsx } from 'clsx'

// Combines Tailwind classes conditionally
// Usage: cn('px-4', isActive && 'bg-brand-800', 'text-white')
export function cn(...inputs) {
  return clsx(inputs)
}

// Format date nicely: "25 Mar 2026"
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Format relative time: "2 hrs ago"
export function timeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000)
  const intervals = [
    { label: 'yr',  secs: 31536000 },
    { label: 'mo',  secs: 2592000  },
    { label: 'day', secs: 86400    },
    { label: 'hr',  secs: 3600     },
    { label: 'min', secs: 60       },
  ]
  for (const { label, secs } of intervals) {
    const count = Math.floor(seconds / secs)
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`
  }
  return 'Just now'
}