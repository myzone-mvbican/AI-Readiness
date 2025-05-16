import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name : string) {
      if (!name || typeof name !== 'string') return '';

      // Normalize spacing and split name into words
      const words = name.trim().split(/\s+/);

      let initials = '';

      if (words.length >= 2) {
          // First letter of first two words
          initials = words[0].charAt(0) + words[1].charAt(0);
      } else if (words.length === 1) {
          // Handle hyphenated or long single names
          const subWords = words[0].split('-');
          if (subWords.length >= 2) {
              initials = subWords[0].charAt(0) + subWords[1].charAt(0);
          } else {
              initials = words[0].substring(0, 2); // first two letters
          }
      }

      return initials.toUpperCase();
  }

