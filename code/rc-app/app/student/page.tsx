'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '../components/Input';
import Button from '../components/Button';
import ProtectedRoute from '../components/ProtectedRoute';
import QRScanner from '../components/QRScanner';

export default function StudentPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [error, setError] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const router = useRouter();

  const handleScanQR = () => {
    setError('');
    setShowQRScanner(true);
  };

  const handleQRScan = (data: string) => {
    console.log('QR code scanned:', data);
    setShowQRScanner(false);
    
    // Validate the scanned data and force uppercase
    const trimmedData = data.trim().toUpperCase();
    if (!trimmedData) {
      setError('Ongeldige QR code gescand');
      return;
    }
    
    // Navigate to the scanned tracking number
    router.push(`/student/handle/${trimmedData}`);
  };

  const handleCloseQRScanner = () => {
    setShowQRScanner(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!trackingNumber.trim()) {
      setError('Vul een volgnummer in');
      return;
    }

    // Navigate directly - ensure uppercase and trim
    router.push(`/student/handle/${trackingNumber.trim().toUpperCase()}`);
  };

  return (
    <ProtectedRoute allowedRoles={['Admin', 'Student']}>
      <div className="min-h-screen bg-[#03091C] flex items-center justify-center p-9">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        {/* QR Code Section */}
        <div className="flex items-center gap-2.5">
          <svg
            className="w-14 h-14 flex-shrink-0"
            viewBox="0 0 54 54"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.5 18.9001H18.9V13.5001H13.5V18.9001ZM8.10001 12.1501C8.10001 9.91416 9.91407 8.1001 12.15 8.1001H20.25C22.4859 8.1001 24.3 9.91416 24.3 12.1501V20.2501C24.3 22.486 22.4859 24.3001 20.25 24.3001H12.15C9.91407 24.3001 8.10001 22.486 8.10001 20.2501V12.1501ZM13.5 40.5001H18.9V35.1001H13.5V40.5001ZM8.10001 33.7501C8.10001 31.5142 9.91407 29.7001 12.15 29.7001H20.25C22.4859 29.7001 24.3 31.5142 24.3 33.7501V41.8501C24.3 44.086 22.4859 45.9001 20.25 45.9001H12.15C9.91407 45.9001 8.10001 44.086 8.10001 41.8501V33.7501ZM35.1 13.5001V18.9001H40.5V13.5001H35.1ZM33.75 8.1001H41.85C44.0859 8.1001 45.9 9.91416 45.9 12.1501V20.2501C45.9 22.486 44.0859 24.3001 41.85 24.3001H33.75C31.5141 24.3001 29.7 22.486 29.7 20.2501V12.1501C29.7 9.91416 31.5141 8.1001 33.75 8.1001ZM32.4 35.1001C30.9066 35.1001 29.7 33.8935 29.7 32.4001C29.7 30.9067 30.9066 29.7001 32.4 29.7001C33.8934 29.7001 35.1 30.9067 35.1 32.4001C35.1 33.8935 33.8934 35.1001 32.4 35.1001ZM32.4 40.5001C33.8934 40.5001 35.1 41.7067 35.1 43.2001C35.1 44.6935 33.8934 45.9001 32.4 45.9001C30.9066 45.9001 29.7 44.6935 29.7 43.2001C29.7 41.7067 30.9066 40.5001 32.4 40.5001ZM40.5 43.2001C40.5 41.7067 41.7066 40.5001 43.2 40.5001C44.6934 40.5001 45.9 41.7067 45.9 43.2001C45.9 44.6935 44.6934 45.9001 43.2 45.9001C41.7066 45.9001 40.5 44.6935 40.5 43.2001ZM43.2 35.1001C41.7066 35.1001 40.5 33.8935 40.5 32.4001C40.5 30.9067 41.7066 29.7001 43.2 29.7001C44.6934 29.7001 45.9 30.9067 45.9 32.4001C45.9 33.8935 44.6934 35.1001 43.2 35.1001ZM40.5 37.8001C40.5 39.2935 39.2934 40.5001 37.8 40.5001C36.3066 40.5001 35.1 39.2935 35.1 37.8001C35.1 36.3067 36.3066 35.1001 37.8 35.1001C39.2934 35.1001 40.5 36.3067 40.5 37.8001Z"
              fill="white"
            />
          </svg>
          <Button variant="primary" onClick={handleScanQR}>
            Scan QR
          </Button>
        </div>

        <div className="text-white font-open-sans text-2xl font-normal">OR</div>

        {/* Manual Input */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-2.5">
          {error && (
            <div className="w-full bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded text-center mb-2">
              {error}
            </div>
          )}
          <Input
            label="Volgnummer"
            placeholder="H78K"
            required
            value={trackingNumber}
            onChange={(e) => { setTrackingNumber(e.target.value.toUpperCase()); setError(''); }}
          />
          <Button variant="primary" type="submit" className="mt-2">
            Voorwerp behandelen
          </Button>
        </form>
      </div>
    </div>

    {showQRScanner && (
      <QRScanner onScan={handleQRScan} onClose={handleCloseQRScanner} />
    )}
    </ProtectedRoute>
  );
}
