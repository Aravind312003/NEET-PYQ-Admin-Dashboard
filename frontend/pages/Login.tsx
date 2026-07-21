import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Turnstile from '../components/Turnstile';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const token = localStorage.getItem('adminToken');
    if (token) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide your administrator email and password.');
      return;
    }

    if (!turnstileToken) {
      setError('Please complete the Turnstile security challenge to prove you are not a bot.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken }),
      });

      // Check if response is HTML (redirected by Google AI Studio preview auth flow / cookie check)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html') || response.redirected) {
        setError('Google AI Studio preview proxy requires authentication setup. Please click the "Open in new tab" icon (top right corner of preview pane) to bypass local iframe cookie block and sign in successfully.');
        setLoading(false);
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        setError('Received an unexpected response. Please open this application in a New Tab (top right icon) to log in.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        if (response.status === 403) {
          setError('Access Denied. You are not authorized to access the Admin Dashboard.');
        } else {
          setError(data.message || data.detail || 'Invalid login credentials.');
        }
        setLoading(false);
        return;
      }

      // Login success
      setSuccess(true);
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));

      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1000);
    } catch (err) {
      console.error('Login request failed:', err);
      setError('Connection failed. Please verify that your dev server is active, or try opening this application in a New Tab (top right icon) to bypass preview sandbox restrictions.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="max-w-md w-full z-10">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">NEET PYQ PLATFORM</h1>
          <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mt-1">
            Secure Admin Sign In
          </p>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 shadow-2xl relative">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-t-2xl" />

          {error && (
            <div className="mb-6 rounded-lg border border-red-950 bg-red-950/40 p-4 text-sm text-red-400 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold leading-none">Security Alert</p>
                <p className="mt-1 text-xs leading-normal opacity-90">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-emerald-950 bg-emerald-950/40 p-4 text-sm text-emerald-400 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Access Granted</p>
                <p className="text-xs opacity-90">Redirecting to administrator space...</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || success}
                  placeholder="admin@neetplatform.com"
                  className="block w-full pl-11 pr-4 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Secure Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || success}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-11 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-sm transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Turnstile Widget */}
            <Turnstile onVerify={(token) => setTurnstileToken(token)} />

            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex justify-center items-center py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-950/30 transition-all focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying Admin Access...' : 'Authenticate Securely'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-neutral-900 text-center text-[11px] text-neutral-500">
            Authorized administrative use only. System activity is logged and auditable under strict security protocols.
          </div>
        </div>
      </div>
    </div>
  );
}
