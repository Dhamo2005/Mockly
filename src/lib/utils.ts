import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLocalizedText(textObj: any, language: string = 'en'): string {
  if (!textObj) return '';
  if (typeof textObj === 'string') return textObj;
  return textObj[language] || textObj['en'] || '';
}
