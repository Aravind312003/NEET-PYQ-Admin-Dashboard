import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Flag,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Question } from '../types';
import Modal from '../components/Modal';

const API_BASE = 'https://neet-pyq-admin-dashboard.onrender.com/api/admin';

export default function Questions() {
  const navigate = useNavigate();
  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'flagged'>('catalog');
  // Core Questions States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters and Pagination
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Form Modal/State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form values
  const [formYear, setFormYear] = useState(new Date().getFullYear());
  const [formSubject, setFormSubject] = useState('Biology');
  const [formChapter, setFormChapter] = useState('');
  const [formQNo, setFormQNo] = useState(1);
  const [formText, setFormText] = useState('');
  const [formOptionA, setFormOptionA] = useState('');
  const [formOptionB, setFormOptionB] = useState('');
  const [formOptionC, setFormOptionC] = useState('');
  const [formOptionD, setFormOptionD] = useState('');
  const [formCorrect, setFormCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [formExplanation, setFormExplanation] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [formImage, setFormImage] = useState<string | null>(null);

  // Duplicate Check State
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [duplicateChecked, setDuplicateChecked] = useState(false);

  // Flagged Issues State
  const [flags, setFlags] = useState<any[]>([]);
  const [loadingFlags, setLoadingFlags] = useState(false);
  const [activeFlag, setActiveFlag] = useState<any | null>(null);
  const [flagAdminNote, setFlagAdminNote] = useState('');
  const [flagStatus, setFlagStatus] = useState<'pending' | 'resolved' | 'dismissed'>('pending');

  // Flag Cascading Edit Form values
  const [flagCascadeQuestion, setFlagCascadeQuestion] = useState('');
  const [flagCascadeOptA, setFlagCascadeOptA] = useState('');
  const [flagCascadeOptB, setFlagCascadeOptB] = useState('');
  const [flagCascadeOptC, setFlagCascadeOptC] = useState('');
  const [flagCascadeOptD, setFlagCascadeOptD] = useState('');
  const [flagCascadeCorrect, setFlagCascadeCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [flagCascadeExplanation, setFlagCascadeExplanation] = useState('');

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load questions catalog
  const fetchQuestions = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: '10',
        search: search,
        subject: filterSubject,
        year: filterYear,
        difficulty: filterDifficulty,
      });

      const response = await fetch(`${API_BASE}/questions?${queryParams.toString()}`, {
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
        throw new Error(data.message || 'Failed to fetch questions.');
      }
      setQuestions(data.questions || []);
      setTotalPages(data.totalPages || 1);
      setTotalQuestions(data.total || 0);
    } catch (err: any) {
      console.error('Failed to load questions:', err);
      setError(err.message || 'Failed to query question records.');
    } finally {
      setLoading(false);
    }
  };

  // Load flagged issues
  const fetchFlaggedIssues = async () => {
    setLoadingFlags(true);
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/flagged-questions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setFlags(data.flags || []);
      }
    } catch (err) {
      console.error('Error fetching flagged queue:', err);
    } finally {
      setLoadingFlags(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'catalog') {
      fetchQuestions();
    } else {
      fetchFlaggedIssues();
    }
  }, [page, filterSubject, filterYear, filterDifficulty, activeSubTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQuestions();
  };

  // Duplicate Scanner
  const checkDuplicates = async () => {
    if (!formText.trim()) return;
    setCheckingDuplicates(true);
    setDuplicateChecked(true);
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/questions/check-duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: formText }),
      });
      if (response.ok) {
        const resData = await response.json();
        const filtered = (resData.matches || []).filter((q: any) => q.id !== editingQuestion?.id);
        setDuplicateMatches(filtered);
      }
    } catch (err) {
      console.error('Duplicate checker failed:', err);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleStartEdit = (q: Question) => {
    setEditingQuestion(q);
    setFormYear(q.year);
    setFormSubject(q.subject);
    setFormChapter(q.chapter);
    setFormQNo(q.question_number);
    setFormText(q.question);
    setFormOptionA(q.option_a);
    setFormOptionB(q.option_b);
    setFormOptionC(q.option_c);
    setFormOptionD(q.option_d);
    setFormCorrect(q.correct_answer);
    setFormExplanation(q.explanation);
    setFormDifficulty(q.difficulty);
    setFormImage(q.image_url);
    setDuplicateChecked(false);
    setDuplicateMatches([]);
    setIsFormOpen(true);
  };

  const handleStartAdd = () => {
    setEditingQuestion(null);
    setFormYear(new Date().getFullYear());
    setFormSubject('Biology');
    setFormChapter('');
    setFormQNo(questions.length > 0 ? Math.max(...questions.map(q => q.question_number)) + 1 : 1);
    setFormText('');
    setFormOptionA('');
    setFormOptionB('');
    setFormOptionC('');
    setFormOptionD('');
    setFormCorrect('A');
    setFormExplanation('');
    setFormDifficulty('Medium');
    setFormImage(null);
    setDuplicateChecked(false);
    setDuplicateMatches([]);
    setIsFormOpen(true);
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
      const response = await fetch(`${API_BASE}/questions/${deletingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete question');
      }
      setSuccessMsg('Question deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchQuestions();
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete selected question record.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formChapter || !formText || !formOptionA || !formOptionB || !formOptionC || !formOptionD || !formExplanation) {
      setError('Please provide values for all required question fields.');
      return;
    }
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    const bodyData = {
      year: Number(formYear),
      subject: formSubject,
      chapter: formChapter,
      question_number: Number(formQNo),
      question: formText,
      option_a: formOptionA,
      option_b: formOptionB,
      option_c: formOptionC,
      option_d: formOptionD,
      correct_answer: formCorrect,
      explanation: formExplanation,
      difficulty: formDifficulty,
      image_url: formImage,
    };
    try {
      let response;
      if (editingQuestion) {
        response = await fetch(`${API_BASE}/questions/${editingQuestion.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        });
      } else {
        response = await fetch(`${API_BASE}/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        });
      }
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Failed to save question records.');
      }
      setSuccessMsg(editingQuestion ? 'Question updated successfully.' : 'New Question added successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      setIsFormOpen(false);
      fetchQuestions();
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err.message || 'Failed to commit question to backend.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
            Question Registry & Issue Center
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Build the NCERT question bank, run duplicate checks, or review flagged student complaints.
          </p>
        </div>
        <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 self-start">
          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'catalog'
                ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            Questions Catalog
          </button>
          <button
            onClick={() => setActiveSubTab('flagged')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'flagged'
                ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <Flag className="h-3.5 w-3.5" />
            Flagged Reports
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-950/50 dark:bg-emerald-950/30 p-4 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-950/50 dark:bg-red-950/30 p-4 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {activeSubTab === 'catalog' && (
        <>
          {/* Filter Bar */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chapters, questions or explanations..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs focus:border-emerald-500 focus:outline-hidden"
              />
            </form>
            <div className="grid grid-cols-3 gap-2 shrink-0">
              <select
                value={filterSubject}
                onChange={(e) => {
                  setFilterSubject(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs focus:border-emerald-500 text-neutral-600 dark:text-neutral-400"
              >
                <option value="">All Subjects</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Botany">Botany</option>
                <option value="Zoology">Zoology</option>
              </select>
              <select
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs focus:border-emerald-500 text-neutral-600 dark:text-neutral-400"
              >
                <option value="">All Years</option>
                {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              <select
                value={filterDifficulty}
                onChange={(e) => {
                  setFilterDifficulty(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs focus:border-emerald-500 text-neutral-600 dark:text-neutral-400"
              >
                <option value="">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <button
              onClick={handleStartAdd}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add Question
            </button>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 gap-2 min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <span className="text-xs text-neutral-400 font-semibold">Scanning catalog...</span>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center p-12">
                <HelpCircle className="h-10 w-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
                <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200">No Questions Found</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                  Try adjusting your search criteria or subject filters to find matching exam sheets.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-50 dark:bg-neutral-950 text-neutral-400 uppercase font-bold tracking-wider border-b border-neutral-100 dark:border-neutral-800">
                        <th className="px-5 py-3.5">Ref Key</th>
                        <th className="px-5 py-3.5">Subject</th>
                        <th className="px-5 py-3.5">Chapter</th>
                        <th className="px-5 py-3.5">Question Text</th>
                        <th className="px-5 py-3.5">Correct Answer</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {questions.map((q) => (
                        <tr key={q.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                          <td className="px-5 py-4 font-mono text-[10px] text-neutral-400">
                            {String(q.id).slice(0, 10)}...
                          </td>
                          <td className="px-5 py-4 font-bold text-neutral-800 dark:text-neutral-200">
                            {q.subject}
                          </td>
                          <td className="px-5 py-4 font-medium text-neutral-500 max-w-[120px] truncate" title={q.chapter}>
                            {q.chapter}
                          </td>
                          <td className="px-5 py-4 text-neutral-600 dark:text-neutral-300 max-w-xs truncate" title={q.question}>
                            {q.question}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
                              Option {q.correct_answer}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleStartEdit(q)}
                                className="p-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 cursor-pointer"
                                title="Edit Question"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => triggerDelete(q.id)}
                                className="p-1.5 rounded-md border border-rose-200 hover:bg-rose-50 text-rose-600 dark:border-red-950/40 dark:text-rose-400 cursor-pointer"
                                title="Delete Question"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950/20 text-xs">
                  <span className="text-neutral-400 font-semibold">
                    Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, totalQuestions)} of {totalQuestions} high-yield questions
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 text-neutral-500 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                      className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 text-neutral-500 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Deletion Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Question Deletion"
        message="Are you sure you want to permanently delete this high-yield NEET practice question from the student database?"
        confirmText="Permanently Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
}