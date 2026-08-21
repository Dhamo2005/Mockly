import { Test, TestAttempt } from '../types';

/**
 * Extracts or formats a display date for a Test paper (Exam date or creation date).
 */
export function getTestDisplayDate(test?: Partial<Test> | null): string {
  if (!test) return '';

  // 1. Check for explicit exam date or year in metadata
  if (test.exam?.paper && /\d{4}/.test(test.exam.paper)) {
    const match = test.exam.paper.match(/\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/);
    if (match) return match[0];
  }

  // 2. Extract from title if it contains exam date like "(Held on 12 Sep 2025 S2)"
  if (test.title) {
    const heldOnMatch = test.title.match(/held\s+on\s+([0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{4})/i);
    if (heldOnMatch && heldOnMatch[1]) {
      return heldOnMatch[1];
    }
    const generalDateMatch = test.title.match(/\b([0-9]{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+[0-9]{4})\b/i);
    if (generalDateMatch && generalDateMatch[1]) {
      return generalDateMatch[1];
    }
  }

  // 3. Check for createdAt timestamp or string
  if (test.createdAt) {
    return formatDate(test.createdAt);
  }

  // 4. Check for exam year
  if (test.exam?.year) {
    return `Exam Year: ${test.exam.year}`;
  }

  // 5. Default fallback to current or recent date
  return formatDate(Date.now());
}

/**
 * Formats a timestamp / date string into a standard readable date: e.g., "21 Aug 2026"
 */
export function formatDate(timestamp?: number | string | Date | null): string {
  if (!timestamp) return '';
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return String(timestamp);
  
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formats a timestamp / date string into date & time: e.g., "21 Aug 2026 • 11:05 AM"
 */
export function formatDateTime(timestamp?: number | string | Date | null): string {
  if (!timestamp) return '';
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return String(timestamp);
  
  const datePart = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const timePart = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return `${datePart} • ${timePart}`;
}

/**
 * Formats a test attempt record's date & time
 */
export function getAttemptDate(attempt?: Partial<TestAttempt> | null): string {
  if (!attempt) return '';
  const time = attempt.endTime || attempt.startTime || attempt.createdAt;
  if (!time) return '';
  return formatDateTime(time);
}
