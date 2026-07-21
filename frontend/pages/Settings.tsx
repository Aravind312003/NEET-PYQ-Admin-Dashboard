import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  LogOut,
  History,
  ShieldCheck,
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Database,
  Sun,
  Moon,
  Search,
  Filter
} from 'lucide-react';
import { AuditLog } from '../types';

export default function Settings() {
  const navigate = useNavigate();

  // States
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [adminEmail, setAdminEmail] = useState('');
  const [adminId, setAdminId] = useState('');

  // Audit Logs filters
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('all');

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? saved === 'true' : true;
  });

  useEffect(() => {
    const handleThemeChange = () => {
      const saved = localStorage.getItem('darkMode');
      setDarkMode(saved ? saved === 'true' : true);
    };
    window.addEventListener('theme-changed', handleThemeChange);
    return () => {
      window.removeEventListener('theme-changed', handleThemeChange);
    };
  }, []);

  const handleThemeToggle = (toDark: boolean) => {
    setDarkMode(toDark);
    localStorage.setItem('darkMode', String(toDark));
    if (toDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    window.dispatchEvent(new Event('theme-changed'));
  };

  useEffect(() => {
    const userJson = localStorage.getItem('adminUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        setAdminEmail(user.email);
        setAdminId(user.id);
      } catch (e) {
        // ignore
      }
    }

    const fetchAuditLogs = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      try {
        const response = await fetch('/api/admin/audit-logs', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error('Failed to query audit logs:', err);
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchAuditLogs();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Please provide values for all password credentials.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must contain at least 8 characters.');
      return;
    }

    setSavingPassword(true);
    const token = localStorage.getItem('adminToken');

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Verification of current password failed.');
      }

      setSuccess('Administrator access credentials updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password save failed:', err);
      setError(err.message || 'System failed to write new credentials.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  // Client-side advanced search and filtering for audit logs
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.admin_email.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.question_id && log.question_id.toLowerCase().includes(logSearch.toLowerCase())) ||
      (log.new_value && log.new_value.toLowerCase().includes(logSearch.toLowerCase()));

    const matchesAction =
      logActionFilter === 'all' ||
      (logActionFilter === 'create' && (log.action.includes('CREATE') || log.action.includes('ADD'))) ||
      (logActionFilter === 'update' && (log.action.includes('UPDATE') || log.action.includes('EDIT'))) ||
      (logActionFilter === 'delete' && (log.action.includes('DELETE') || log.action.includes('PURGE')));

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Upper Title Block */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
          Portal Settings & Audit Logs
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Adjust security parameters, update administrative credentials, and view system action logs.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Profile Card & Password Update */}
        <div className="space-y-6 lg:col-span-1">
          {/* Admin Profile */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-3.5 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="h-11 w-11 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-50 truncate">
                  Admin Account
                </h3>
                <p className="text-xs text-neutral-400 truncate">{adminEmail || 'admin@neetplatform.com'}</p>
              </div>
            </div>

            <div className="pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-neutral-400">ID Reference:</span>
                <span className="text-neutral-600 dark:text-neutral-300 font-mono text-[10px] truncate max-w-[120px]">
                  {adminId || 'usr_adm_9210'}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-neutral-400">Access Tier:</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider text-[10px]">
                  Administrator
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-neutral-400">Security Key:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  SHA-256 Enabled
                </span>
              </div>
            </div>
          </div>

          {/* Theme Preferences */}
          <div id="theme-preferences-section" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-50 flex items-center gap-2 mb-3">
              <Sun className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              Theme Preferences
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-normal">
              Toggle between Light and Dark interface modes to suit your work environment.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                id="light-theme-btn"
                onClick={() => handleThemeToggle(false)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border font-semibold transition-all cursor-pointer ${
                  !darkMode
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/60 dark:text-emerald-400'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900'
                }`}
              >
                <Sun className="h-4 w-4 shrink-0" />
                <span>Light</span>
              </button>
              <button
                type="button"
                id="dark-theme-btn"
                onClick={() => handleThemeToggle(true)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border font-semibold transition-all cursor-pointer ${
                  darkMode
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/60 dark:text-emerald-400'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-950 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900'
                }`}
              >
                <Moon className="h-4 w-4 shrink-0" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* Change Password Panel */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-50 flex items-center gap-2 mb-4">
              <Lock className="h-4.5 w-4.5 text-emerald-600" />
              Update Password
            </h3>

            {error && (
              <div className="mb-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-red-950/40 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/40 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-500 font-semibold mb-1.5 uppercase">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 font-semibold mb-1.5 uppercase">New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200"
                  placeholder="At least 8 chars"
                />
              </div>

              <div>
                <label className="block text-neutral-500 font-semibold mb-1.5 uppercase">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200"
                  placeholder="Repeat new password"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full flex justify-center py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md cursor-pointer"
              >
                {savingPassword ? 'Committing Credentials...' : 'Save New Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4 gap-3">
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                <History className="h-4.5 w-4.5 text-emerald-600" />
                Administrative Audit Logs
              </h3>
              <p className="text-[11px] text-neutral-400">Verifiable logging of write operations in NEET platform databases.</p>
            </div>
          </div>

          {/* Real-time search and action filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-neutral-50 dark:bg-neutral-950/40 p-3 rounded-lg border border-neutral-100 dark:border-neutral-850">
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search logs by email, question ID, or keywords..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[10px] focus:border-emerald-500 focus:outline-hidden text-neutral-700 dark:text-neutral-300"
              />
            </div>
            <div>
              <select
                value={logActionFilter}
                onChange={(e) => setLogActionFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-[10px] focus:border-emerald-500 focus:outline-hidden text-neutral-600 dark:text-neutral-400"
              >
                <option value="all">All Action Categories</option>
                <option value="create">CREATE Actions</option>
                <option value="update">UPDATE Actions</option>
                <option value="delete">DELETE Actions</option>
              </select>
            </div>
          </div>

          {loadingLogs ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <p className="text-[11px] text-neutral-400 font-semibold">Scanning transaction blocks...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-xs text-neutral-400">
              No matching audit logs match your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="max-h-[360px] overflow-y-auto border border-neutral-100 dark:border-neutral-800 rounded-lg">
                <table className="w-full text-left border-collapse text-[10px] font-mono">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-950 text-neutral-400 uppercase font-bold border-b border-neutral-100 dark:border-neutral-800">
                      <th className="px-3.5 py-2">Timestamp</th>
                      <th className="px-3.5 py-2">Administrator</th>
                      <th className="px-3.5 py-2">Action Taken</th>
                      <th className="px-3.5 py-2">Details / Values</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-600 dark:text-neutral-400">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-[9px]">
                          {new Date(log.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="px-3.5 py-2.5 truncate max-w-[110px]" title={log.admin_email}>
                          {log.admin_email}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded-sm font-bold text-[8px] tracking-wide uppercase ${
                              log.action.includes('CREATE') || log.action.includes('ADD')
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : log.action.includes('DELETE') || log.action.includes('PURGE')
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 max-w-xs leading-normal">
                          <div className="space-y-1">
                            {log.question_id && (
                              <p className="text-[9px] font-bold text-neutral-400">
                                Target Question ID: {log.question_id}
                              </p>
                            )}
                            {log.new_value && (
                              <p className="text-[9px] line-clamp-2">
                                <span className="font-bold text-emerald-600">Applied:</span> {log.new_value}
                              </p>
                            )}
                            {log.old_value && (
                              <p className="text-[9px] line-clamp-1 opacity-70">
                                <span className="font-bold text-neutral-400">Previous:</span> {log.old_value}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
