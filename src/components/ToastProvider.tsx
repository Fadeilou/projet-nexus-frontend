'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1f2937',
          color: '#f9fafb',
          border: '1px solid #374151',
        },
        success: {
          style: {
            background: '#059669',
            color: '#ffffff',
          },
        },
        error: {
          style: {
            background: '#dc2626',
            color: '#ffffff',
          },
        },
      }}
    />
  );
}
