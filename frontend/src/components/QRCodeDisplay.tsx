import { useEffect, useRef } from 'react';
import { generateUPIDeepLink } from '@/utils/deepLinks';

interface QRCodeDisplayProps {
  taskId: bigint;
  price: bigint;
}

// Declare QRCode as a global type from the CDN library
declare global {
  interface Window {
    QRCode: any;
  }
}

export default function QRCodeDisplay({ taskId, price }: QRCodeDisplayProps) {
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<any>(null);

  const upiLink = generateUPIDeepLink(Number(price));

  useEffect(() => {
    // Wait for QRCode library to be loaded
    if (!window.QRCode || !qrContainerRef.current) return;

    // Clear previous QR code if it exists
    if (qrInstanceRef.current) {
      qrContainerRef.current.innerHTML = '';
    }

    // Generate new QR code
    try {
      qrInstanceRef.current = new window.QRCode(qrContainerRef.current, {
        text: upiLink,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.H,
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }

    // Cleanup function
    return () => {
      if (qrContainerRef.current) {
        qrContainerRef.current.innerHTML = '';
      }
    };
  }, [upiLink]);

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-muted/50 border border-border">
      <div className="text-center">
        <h3 className="font-semibold text-lg mb-1">Scan to Pay</h3>
        <p className="text-sm text-muted-foreground">
          Scan this QR code with any UPI app
        </p>
      </div>
      
      <div className="bg-white p-4 rounded-lg">
        <div ref={qrContainerRef} className="flex items-center justify-center min-h-[200px] min-w-[200px]" />
      </div>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Amount: <span className="font-semibold text-foreground">₹{(Number(price) * 1.10).toFixed(2)}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          (includes 10% platform fee)
        </p>
      </div>
    </div>
  );
}
