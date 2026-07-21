import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, FileQuestion, ArrowLeft } from 'lucide-react';

interface ErrorProps {
  type: '403' | '404' | '500';
}

export default function ErrorPages({ type }: ErrorProps) {
  const navigate = useNavigate();

  const configs = {
    403: {
      title: 'Access Denied',
      subtitle: 'You are not authorized to access the Admin Dashboard.',
      description: 'Your account does not possess the administrator credentials required for this secure section. If you believe this is in error, please contact the main administrator.',
      icon: ShieldAlert,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    },
    404: {
      title: 'Resource Not Found',
      subtitle: 'The requested page or record could not be found.',
      description: 'The URL or database reference might be incorrect, deleted, or temporarily offline. Verify your path or return to safety below.',
      icon: FileQuestion,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    500: {
      title: 'System Server Error',
      subtitle: 'An unexpected internal error has occurred.',
      description: 'The secure server failed to process the transaction or communication line collapsed. Please try again or inspect system audit logs.',
      icon: AlertTriangle,
      color: 'text-red-500 bg-red-500/10 border-red-500/20',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 transition-colors duration-200 dark:bg-neutral-950 dark:text-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 shadow-xl text-center">
        <div className={`mx-auto h-16 w-16 flex items-center justify-center rounded-2xl border ${config.color} mb-6`}>
          <Icon className="h-8 w-8" />
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight font-sans text-neutral-900 dark:text-neutral-50">
          {type}
        </h1>
        <h2 className="text-xl font-bold mt-2 text-neutral-800 dark:text-neutral-200">
          {config.title}
        </h2>
        <p className="text-sm font-semibold mt-1 text-emerald-600 dark:text-emerald-400">
          {config.subtitle}
        </p>

        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-4 leading-relaxed">
          {config.description}
        </p>

        <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex flex-col gap-3">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors text-sm shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </button>
          <button
            onClick={() => navigate('/admin/login')}
            className="w-full text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Relogin with Different Account
          </button>
        </div>
      </div>
    </div>
  );
}
