import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  X,
  Bell,
  Info,
  AlertTriangle
} from 'lucide-react';
import Modal from '../components/Modal';

export default function Announcements() {
  const navigate = useNavigate();

  // States
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Creation form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formType, setFormType] = useState<'info' | 'warning' | 'success'>('info');
  const [formTag, setFormTag] = useState('all');

  // Deletion modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch('/api/admin/announcements', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to retrieve announcements.');
      }

      setAnnouncements(data.announcements || []);
    } catch (err: any) {
      console.error('Failed to load announcements:', err);
      setError(err.message || 'System failed to query announcement channels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleStartAdd = () => {
    setFormTitle('');
    setFormBody('');
    setFormType('info');
    setFormTag('all');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formTitle.trim() || !formBody.trim()) {
      setError('Both title and body text are required to publish broadcasts.');
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formTitle,
          body: formBody,
          type: formType,
          tag: formTag,
        }),
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.message || 'Failed to dispatch broadcast.');
      }

      setSuccess('Broadcast announcement published to live student dashboards.');
      setTimeout(() => setSuccess(''), 3000);
      setIsFormOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err.message || 'Failed to broadcast announcement.');
    }
  };

  const triggerDelete = (id: string) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    setIsDeleteOpen(false);

    try {
      const response = await fetch(`/api/admin/announcements/${deletingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to retract announcement.');
      }

      setSuccess('Broadcast retraction finalized. Deleted from live streams.');
      setTimeout(() => setSuccess(''), 3000);
      fetchAnnouncements();
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(err.message || 'Failed to retract active broadcast.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            In-App Announcements Center
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Broadcast platform bulletins, exam alerts, schedules, or syllabus notifications directly to student live-streams.
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-center shadow-md"
        >
          <Plus className="h-4.5 w-4.5" />
          Broadcast Bulletin
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-950/50 dark:bg-emerald-950/30 p-4 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-950/50 dark:bg-red-950/30 p-4 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Announcements Stream */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-2 min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="text-xs text-neutral-400 font-semibold">Tuning broadcast channels...</span>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <Bell className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2 animate-bounce" />
          <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">Broadcast Streams Clear</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            All quiet on the bulletins network! Push an announcement to notify students of upcoming mock schedule periods.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {announcements.map((ann) => {
            const isWarning = ann.type === 'warning';
            const isSuccess = ann.type === 'success';

            return (
              <div
                key={ann.id}
                className={`border rounded-xl p-5 shadow-xs flex gap-4 transition-colors relative group ${
                  isWarning
                    ? 'bg-amber-500/5 border-amber-500/10 dark:border-amber-950/40'
                    : isSuccess
                    ? 'bg-emerald-500/5 border-emerald-500/10 dark:border-emerald-950/40'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                }`}
              >
                {/* Left icon wrapper */}
                <div className="shrink-0">
                  {isWarning ? (
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                  ) : isSuccess ? (
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                      <Info className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* Content body */}
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                        {ann.title}
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                          Target: {ann.tag || 'all'}
                        </span>
                      </h3>
                      <p className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5 font-mono">
                        <Calendar className="h-3 w-3" />
                        {new Date(ann.created_at || Date.now()).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => triggerDelete(ann.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg border border-transparent hover:border-rose-200 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                      title="Retract Broadcast"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
                    {ann.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DISPATCH BROADCAST FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs" onClick={() => setIsFormOpen(false)} />
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xl max-w-md w-full mx-auto relative z-10 max-h-[90vh] flex flex-col">
            <header className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950/40">
              <div>
                <h3 className="text-base font-black text-neutral-900 dark:text-neutral-50">
                  Broadcast Bulletin Announcement
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">Send alert streams to candidate live boards immediately.</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-neutral-400 rounded-lg cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Bulletin Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Schedule Update: NEET Physics Mock Test 05 Now Live!"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Bulletin Alert Level</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-bold text-neutral-600"
                  >
                    <option value="info">Info (Standard Bulletin)</option>
                    <option value="warning">Warning (Urgent Bulletin)</option>
                    <option value="success">Success (Milestone Alert)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Audience Target Tag</label>
                  <select
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-bold text-neutral-600"
                  >
                    <option value="all">All Channels</option>
                    <option value="Physics">Physics Trackers Only</option>
                    <option value="Chemistry">Chemistry Trackers Only</option>
                    <option value="Biology">Biology Trackers Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Bulletin Message Body</label>
                <textarea
                  required
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Write clear, supportive bulleted items regarding schedules or rules..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-medium leading-relaxed"
                />
              </div>

              <footer className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3 bg-neutral-50 dark:bg-neutral-950/20 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Dispatch Live Bulletin
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Retraction Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Retract Broadcast Announcement"
        message="Are you sure you want to retract this published bulletin? This will instantly remove the card from all student directories and dashboards."
        confirmText="Retract Bulletin"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
}
