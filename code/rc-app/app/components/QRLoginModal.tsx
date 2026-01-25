'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRLoginModalProps {
  readonly isOpen: boolean;
  readonly token: string | null;
  readonly onClose: () => void;
  readonly userName: string;
}

export default function QRLoginModal({
  isOpen,
  token,
  onClose,
  userName
}: QRLoginModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && token && canvasRef.current) {
      // Generate QR code on canvas
      QRCode.toCanvas(
        canvasRef.current,
        token,
        {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        },
        (error) => {
          if (error) {
            console.error('Error generating QR code:', error);
          }
        }
      );
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      tabIndex={-1}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
        aria-describedby="qr-modal-desc"
        className="w-[547px] rounded-2xl bg-[#ED532A] p-8 flex flex-col gap-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="qr-modal-title" className="text-white font-inter text-xl font-bold leading-[30px] tracking-[-0.4px]">
          QR Login voor {userName}
        </h2>

        <div className="flex flex-col items-center mt-2">
          <div className="bg-white p-4 rounded-lg mb-4">
            <canvas ref={canvasRef} />
          </div>

          <p className="text-white font-inter text-base font-normal leading-[22px] tracking-[-0.32px] text-center mb-2">
            Scan deze QR code om in te loggen
          </p>

          <p className="text-white font-inter text-sm font-normal leading-[18px] tracking-[-0.28px] text-center">
            Deze code heeft geen vervaldatum
          </p>
        </div>

        <div className="flex items-center gap-4 mt-6 px-4">
          <button
            onClick={onClose}
            className="flex-1 h-12 px-4 py-3 flex items-center justify-center rounded-md bg-[#EEF1F4] cursor-pointer hover:bg-[#dde1e4]"
          >
            <span className="text-[#545F71] font-inter text-base font-semibold leading-[22px] tracking-[-0.32px]">Sluiten</span>
          </button>
        </div>
      </div>
    </div>
  );
}
