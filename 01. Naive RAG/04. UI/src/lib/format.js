/**
 * Formatting helpers.
 *
 * Small functions that turn raw numbers from the API into text people read
 * easily: counts with the right plural, file sizes, money, token counts,
 * durations and relative times.
 */

// Number plus a word, with an "s" when the count is not 1
export function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

// 885323 -> "865 KB"
export function formatBytes(bytes) {

  // Unknown size
  if (bytes === null || bytes === undefined) {
    return '-'
  }

  // Pick the largest unit that keeps the number at or above 1
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }

  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`
}

// 0.000198 -> "$0.000198"; larger amounts get fewer decimals
export function formatCost(usd) {
  if (usd >= 1) {
    return `$${usd.toFixed(2)}`
  }
  if (usd >= 0.01) {
    return `$${usd.toFixed(4)}`
  }
  return `$${usd.toFixed(6)}`
}

// 21198 -> "21.2K"
export function formatTokens(count) {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`
  }
  return String(count)
}

// 1503 -> "1.5 s", 412 -> "412 ms"
export function formatMs(ms) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`
}

// ISO time -> "5 min ago", "3 h ago", "2 d ago"
export function timeAgo(iso, now = Date.now()) {

  // Missing time
  if (!iso) {
    return '-'
  }

  // Seconds since the time
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))

  // Biggest unit that fits
  if (seconds < 60) {
    return 'just now'
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} min ago`
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} h ago`
  }
  return `${Math.floor(seconds / 86400)} d ago`
}
