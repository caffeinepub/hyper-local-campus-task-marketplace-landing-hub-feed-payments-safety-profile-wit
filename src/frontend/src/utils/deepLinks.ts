import { UPI_ID } from '@/config/constants';

export function buildTelegramLink(handle: string): string {
  // Remove @ if present
  const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
  
  // Try tg:// protocol first (works on mobile), fallback to https://
  return `https://t.me/${cleanHandle}`;
}

export function buildUPILink(price: bigint): string {
  // Calculate amount with 10% platform fee
  const baseAmount = Number(price);
  const totalAmount = (baseAmount * 1.10).toFixed(2);
  
  // Build UPI deep link
  return `upi://pay?pa=${UPI_ID}&pn=CampusApp&am=${totalAmount}`;
}

// Generate UPI deep link for QR code generation
export function generateUPIDeepLink(price: number): string {
  // Calculate amount with 10% platform fee
  const totalAmount = (price * 1.10).toFixed(2);
  
  // Build UPI deep link
  return `upi://pay?pa=${UPI_ID}&pn=PROXIIS&am=${totalAmount}&cu=INR`;
}
