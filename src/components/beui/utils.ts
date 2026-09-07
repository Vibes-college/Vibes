// beUI preview: Copyright (c) 2026 Saurabh Chauhan, MIT. See /licenses/beui.txt.
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
