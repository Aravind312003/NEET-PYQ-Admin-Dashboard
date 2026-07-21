import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface TurnstileProps {
  onVerify: (token: string) => void;
}

export default function Turnstile({ onVerify }: TurnstileProps) {
  const [status, setStatus] = useState<'ready' | 'verifying' | 'verified'>('ready');

  const handleToggle = () => {
    if (status !== 'ready') return;

    setStatus('verifying');

    // Simulate standard secure Turnstile verification latency
    setTimeout(() => {
      setStatus('verified');
      onVerify(`mock_turnstile_token_${Date.now()}`);
    }, 800);
  };

  return (
    <div 
      onClick={handleToggle}
      className={`my-4 rounded-xl border p-4 flex items-center justify-between transition-all duration-300 select-none cursor-pointer ${
        status === 'verified'
          ? 'border-emerald-500/30 bg-emerald-950/10 hover:bg-emerald-950/20'
          : status === 'verifying'
          ? 'border-neutral-800 bg-neutral-900/20'
          : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700/80 hover:bg-neutral-900/60'
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div 
          className={`h-6 w-6 rounded-[6px] border flex items-center justify-center transition-all duration-200 ${
            status === 'verified'
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : status === 'verifying'
              ? 'border-emerald-500/40 bg-neutral-950'
              : 'border-neutral-700 bg-neutral-950 group-hover:border-neutral-500'
          }`}
        >
          {status === 'verified' && (
            <svg 
              className="h-3.5 w-3.5 text-white animate-[scaleIn_0.2s_ease-out]" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3.5" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === 'verifying' && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
          )}
        </div>
        <span 
          className={`text-sm font-medium transition-colors ${
            status === 'verified' 
              ? 'text-emerald-400' 
              : 'text-neutral-300'
          }`}
        >
          Verify you are a human candidate
        </span>
      </div>
      <span className="text-[10px] tracking-widest font-black text-neutral-500 uppercase font-sans">
        TURNSTILE
      </span>
    </div>
  );
}
