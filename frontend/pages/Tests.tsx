import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
  Award,
  HelpCircle,
  X,
  FileText
} from 'lucide-react';
import Modal from '../components/Modal';

export default function Tests() {
  const navigate = useNavigate();

  // States
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals / Editing state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<any | null>(null);

  // Form values
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formCorrect, setFormCorrect] = useState(4);
  const [formWrong, setFormWrong] = useState(-1);
  const [formSkipped, setFormSkipped] = useState(0);
  const [formPublished, setFormPublished] = useState(false);

  // Deletion Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTests = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      const response = await fetch('/api/admin/tests', {
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
        throw new Error(data.message || 'Failed to query mock exams index.');
      }

      setTests(data.tests || []);
    } catch (err: any) {
      console.error('Failed to load tests:', err);
      setError(err.message || 'System failed to query mock exam databases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleStartAdd = () => {
    setEditingTest(null);
    setFormTitle('');
    setFormDesc('');
    
    // Default schedule window (Next 30 days)
    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    setFormStart(now.toISOString().substring(0, 16));
    setFormEnd(future.toISOString().substring(0, 16));
    
    setFormCorrect(4);
    setFormWrong(-1);
    setFormSkipped(0);
    setFormPublished(false);
    setIsFormOpen(true);
  };

  const handleStartEdit = (test: any) => {
    setEditingTest(test);
    setFormTitle(test.title || '');
    setFormDesc(test.description || '');
    
    // Formatting date string for input type="datetime-local"
    const startIso = test.start_time ? new Date(test.start_time).toISOString().substring(0, 16) : '';
    const endIso = test.end_time ? new Date(test.end_time).toISOString().substring(0, 16) : '';
    setFormStart(startIso);
    setFormEnd(endIso);

    setFormCorrect(test.correct_marks !== undefined ? test.correct_marks : 4);
    setFormWrong(test.wrong_marks !== undefined ? test.wrong_marks : -1);
    setFormSkipped(test.skipped_marks !== undefined ? test.skipped_marks : 0);
    setFormPublished(!!test.published);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formTitle.trim()) {
      setError('A test series title is required.');
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const payload = {
      title: formTitle,
      description: formDesc,
      start_time: new Date(formStart).toISOString(),
      end_time: new Date(formEnd).toISOString(),
      correct_marks: Number(formCorrect),
      wrong_marks: Number(formWrong),
      skipped_marks: Number(formSkipped),
      published: formPublished,
    };

    try {
      let response;
      if (editingTest) {
        response = await fetch(`/api/admin/tests/${editingTest.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/admin/tests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.message || 'Failed to submit test configuration.');
      }

      setSuccess(editingTest ? 'Mock test series updated successfully.' : 'New mock test series created.');
      setTimeout(() => setSuccess(''), 3000);
      setIsFormOpen(false);
      fetchTests();
    } catch (err: any) {
      console.error('Test save failed:', err);
      setError(err.message || 'Failed to save mock test configuration.');
    }
  };

  const handleCloneTest = async (id: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/tests/${id}/clone`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clone target mock test.');
      }

      setSuccess('Mock test copied as draft copy successfully.');
      setTimeout(() => setSuccess(''), 3000);
      fetchTests();
    } catch (err: any) {
      console.error('Clone failed:', err);
      setError('System collapsed during series duplication.');
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
      const response = await fetch(`/api/admin/tests/${deletingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete mock test.');
      }

      setSuccess('Mock test series purged successfully from system catalogs.');
      setTimeout(() => setSuccess(''), 3000);
      fetchTests();
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(err.message || 'Failed to delete mock exam series.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
            Mock Exam & Test Series Scheduler
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Schedule test schedules, configure marking structures (including negative markings), and clone draft copies.
          </p>
        </div>

        <button
          onClick={handleStartAdd}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 self-start sm:self-center shadow-md"
        >
          <Plus className="h-4.5 w-4.5" />
          Schedule Mock Test
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

      {/* Test List Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-2 min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="text-xs text-neutral-400 font-semibold">Scanning mock databases...</span>
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <Calendar className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
          <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">No Mock Exams Indexed</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Get started by scheduling your first high-yield mock test series complete with standard negative marks schema.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      test.published
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}
                  >
                    {test.published ? 'Published' : 'Draft Copy'}
                  </span>
                  <span className="font-mono text-[9px] text-neutral-400">ID: {String(test.id).substring(0, 10)}</span>
                </div>

                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-50 truncate" title={test.title}>
                  {test.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                  {test.description || 'No descriptive summary added.'}
                </p>
              </div>

              {/* Marking Scheme and Date ranges */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-lg space-y-2 text-[11px] font-medium">
                <div className="flex justify-between text-neutral-500">
                  <span>Marking Schema:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    +{test.correct_marks} / {test.wrong_marks} negative / {test.skipped_marks} skipped
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-400 font-mono text-[10px]">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {new Date(test.start_time).toLocaleDateString()} - {new Date(test.end_time).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-semibold flex items-center gap-1 font-mono text-[10px]">
                  <FileText className="h-3.5 w-3.5" />
                  {(test.questions || []).length || 180} questions Mapped
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCloneTest(test.id)}
                    className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-md cursor-pointer border border-neutral-200 dark:border-neutral-800"
                    title="Clone / Duplicate Test"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleStartEdit(test)}
                    className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-md cursor-pointer border border-neutral-200 dark:border-neutral-800"
                    title="Edit Properties"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => triggerDelete(test.id)}
                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-md cursor-pointer border border-rose-200 dark:border-red-950/40"
                    title="Purge Test"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE & EDIT SCHEDULER FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs" onClick={() => setIsFormOpen(false)} />
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xl max-w-lg w-full mx-auto relative z-10 max-h-[90vh] flex flex-col">
            <header className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950/40">
              <div>
                <h3 className="text-base font-black text-neutral-900 dark:text-neutral-50">
                  {editingTest ? 'Edit Mock Test Series' : 'Schedule New Mock Exam'}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">Customize negative marking algorithms and scheduling windows.</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-neutral-400 rounded-lg cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div>
                <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Test Series Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. NEET-UG All India Mock Series - Test 03"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Short Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Summarize exam details or syllabus requirements..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Publish Window Start</label>
                  <input
                    type="datetime-local"
                    required
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Publish Window End</label>
                  <input
                    type="datetime-local"
                    required
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-medium"
                  />
                </div>
              </div>

              {/* Marking scheme card */}
              <div className="border border-emerald-100 dark:border-emerald-950/40 rounded-xl p-4 bg-emerald-50/10 space-y-3.5">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles className="h-4.5 w-4.5" />
                  <span>Marking Configuration & Negative Scoring Schema</span>
                </span>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <label className="block font-semibold text-neutral-400 mb-1.5 uppercase">Correct Key</label>
                    <input
                      type="number"
                      required
                      value={formCorrect}
                      onChange={(e) => setFormCorrect(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-center rounded-lg border border-neutral-200 bg-white dark:bg-neutral-950 font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-400 mb-1.5 uppercase">Incorrect (Negative)</label>
                    <input
                      type="number"
                      required
                      value={formWrong}
                      onChange={(e) => setFormWrong(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-center rounded-lg border border-neutral-200 bg-white dark:bg-neutral-950 font-bold text-rose-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-400 mb-1.5 uppercase">Skipped</label>
                    <input
                      type="number"
                      required
                      value={formSkipped}
                      onChange={(e) => setFormSkipped(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-center rounded-lg border border-neutral-200 bg-white dark:bg-neutral-950 font-bold text-neutral-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="published_checkbox"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="rounded text-emerald-600 border-neutral-300"
                />
                <label htmlFor="published_checkbox" className="font-semibold text-neutral-700 dark:text-neutral-300 select-none cursor-pointer">
                  Publish this test series immediately to student directories
                </label>
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
                  Save Test Series
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Purge Mock Exam Series"
        message="Are you sure you want to permanently delete this exam series? All candidate score histories and ranking matrices indexed under this specific mock exam series will be lost."
        confirmText="Permanently Purge"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
}
