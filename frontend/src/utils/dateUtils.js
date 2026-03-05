// Date formatting utilities for Threadify

export function formatJoinDate(dateString) {
  if (!dateString) return "Unknown";
  
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long' };
  return date.toLocaleDateString('en-US', options);
}

export function formatRelativeTime(dateString) {
  if (!dateString) return "Unknown";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffDays < 1) {
    return "Today";
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else if (diffDays < 30) {
    return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''}`;
  } else if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
  } else {
    return `${diffYears} year${diffYears !== 1 ? 's' : ''}`;
  }
}

export function calculateAccountAge(dateString) {
  return formatRelativeTime(dateString);
}
