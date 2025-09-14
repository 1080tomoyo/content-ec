import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 価格を日本語形式でフォーマットする
 * @param price 価格（数値）
 * @returns フォーマットされた価格文字列
 */
export function formatPrice(price: number): string {
  return price === 0 ? "無料" : `¥${price.toLocaleString()}`
}
