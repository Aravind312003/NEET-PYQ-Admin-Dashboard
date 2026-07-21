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

  // Duplicate Check State inside Form
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [duplicateChecked, setDuplicateChecked] = useState(false);

  // Flagged Issues State
  const [flags, setFlags] = useState<any[]>([]);
  const [loadingFlags, setLoadingFlags] = useState(false);
  const [activeFlag, setActiveFlag] = useState<any | null>(null);
  const [flagAdminNote, setFlagAdminNote] = useState('');
  const [flagStatus, setFlagStatus] = useState<'pending' | 'resolved' | 'dismissed'>('pending');

  // Flag Cascading Edit Form values (editing question fields via flag)
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

      const response = await fetch(`/api/admin/questions?${queryParams.toString()}`, {
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
      const response = await fetch('/api/admin/flagged-questions', {
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
      const response = await fetch('/api/admin/questions/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: formText }),
      });
      if (response.ok) {
        const resData = await response.json();
        // Ignore the question currently editing itself
        const filtered = (resData.matches || []).filter((q: any) => q.id !== editingQuestion?.id);
        setDuplicateMatches(filtered);
      }
    } catch (err) {
      console.error('Duplicate checker failed:', err);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  // Trigger editing
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

  // Image upload handling with instant preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormImage(null);
  };

  // Delete handler
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
      const response = await fetch(`/api/admin/questions/${deletingId}`, {
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

  // Submit form
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
        response = await fetch(`/api/admin/questions/${editingQuestion.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        });
      } else {
        response = await fetch('/api/admin/questions', {
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

  // Open flag review panel
  const handleReviewFlag = (flag: any) => {
    setActiveFlag(flag);
    setFlagAdminNote(flag.admin_note || '');
    setFlagStatus(flag.status || 'pending');

    // Seed cascade edit form with current target question parameters
    const targetQ = questions.find(q => q.id === flag.question_id);
    if (targetQ) {
      setFlagCascadeQuestion(targetQ.question);
      setFlagCascadeOptA(targetQ.option_a);
      setFlagCascadeOptB(targetQ.option_b);
      setFlagCascadeOptC(targetQ.option_c);
      setFlagCascadeOptD(targetQ.option_d);
      setFlagCascadeCorrect(targetQ.correct_answer);
      setFlagCascadeExplanation(targetQ.explanation);
    } else {
      // Clear
      setFlagCascadeQuestion(flag.question_text || '');
      setFlagCascadeOptA('');
      setFlagCascadeOptB('');
      setFlagCascadeOptC('');
      setFlagCascadeOptD('');
      setFlagCascadeCorrect('A');
      setFlagCascadeExplanation('');
    }
  };

  // Submit Flag Resolution with cascade edits
  const handleResolveFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFlag) return;
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const payload: any = {
      status: flagStatus,
      admin_note: flagAdminNote,
    };

    // Include cascading edits to update associated question automatically if selected
    if (flagStatus === 'resolved' && flagCascadeQuestion.trim()) {
      payload.update_question = {
        question: flagCascadeQuestion,
        option_a: flagCascadeOptA,
        option_b: flagCascadeOptB,
        option_c: flagCascadeOptC,
        option_d: flagCascadeOptD,
        correct_answer: flagCascadeCorrect,
        explanation: flagCascadeExplanation,
      };
    }

    try {
      const response = await fetch(`/api/admin/flagged-questions/${activeFlag.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve reported issue.');
      }

      setSuccessMsg('Reported issue resolved successfully. Cascading edits synchronized.');
      setTimeout(() => setSuccessMsg(''), 3000);
      setActiveFlag(null);
      fetchFlaggedIssues();
      fetchQuestions();
    } catch (err: any) {
      console.error('Flag patch failed:', err);
      setError(err.message || 'Failed to update issue status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab bar header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
            Question Registry & Issue Center
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Build the NCERT question bank, run duplicate checks, or review flagged student complaints.
          </p>
        </div>

        {/* Sub-tab selection */}
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
            {flags.filter(f => f.status === 'pending').length > 0 && (
              <span className="h-2 w-2 rounded-full bg-rose-500 inline-block animate-pulse"></span>
            )}
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

      {/* CONDITIONAL RENDER: SUB-TAB 1: CATALOG */}
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

          {/* Catalog list table */}
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

      {/* CONDITIONAL RENDER: SUB-TAB 2: FLAGGED QUESTIONS */}
      {activeSubTab === 'flagged' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-50 mb-1">Student Issue Flag Reports Queue</h3>
            <p className="text-[11px] text-neutral-400 mb-6">Review student submissions regarding errors in correct options, NCERT source mismatches, or translation details</p>

            {loadingFlags ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <span className="text-xs text-neutral-400 font-semibold">Scanning reported issues...</span>
              </div>
            ) : flags.length === 0 ? (
              <div className="text-center py-12 text-xs text-neutral-400">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                No active flagged issue reports currently registered!
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-neutral-100 dark:border-neutral-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-950 text-neutral-400 uppercase font-bold border-b border-neutral-100 dark:border-neutral-800">
                      <th className="px-4 py-3">Reported Timestamp</th>
                      <th className="px-4 py-3">Student Email</th>
                      <th className="px-4 py-3">Reported Issue Reason</th>
                      <th className="px-4 py-3">Associated Question Snippet</th>
                      <th className="px-4 py-3">Report State</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {flags.map((fl) => (
                      <tr key={fl.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                        <td className="px-4 py-3.5 font-mono text-neutral-400">
                          {new Date(fl.timestamp || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-neutral-800 dark:text-neutral-200">
                          {fl.student_email || 'anonymous@student.com'}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-rose-600 max-w-xs truncate" title={fl.reason}>
                          {fl.reason}
                        </td>
                        <td className="px-4 py-3.5 text-neutral-500 max-w-xs truncate">
                          {fl.question_text || 'Unable to scan source text'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              fl.status === 'resolved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : fl.status === 'dismissed'
                                ? 'bg-neutral-200 text-neutral-600'
                                : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}
                          >
                            {fl.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleReviewFlag(fl)}
                            className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-[10px] rounded cursor-pointer transition-all"
                          >
                            Inspect & Resolve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. PRIMARY CREATION / EDITING FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs" onClick={() => setIsFormOpen(false)} />
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xl max-w-2xl w-full mx-auto relative z-10 max-h-[90vh] flex flex-col">
            {/* Header */}
            <header className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950/40">
              <div>
                <h3 className="text-base font-black text-neutral-900 dark:text-neutral-50">
                  {editingQuestion ? 'Edit High-Yield NEET Question' : 'Add New High-Yield NEET Question'}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">Define core options, options list, NCERT annotations, and review duplicates.</p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {/* Form Fields */}
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">NEET Year</label>
                  <input
                    type="number"
                    required
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Subject</label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-bold"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Question No.</label>
                  <input
                    type="number"
                    required
                    value={formQNo}
                    onChange={(e) => setFormQNo(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-bold"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Chapter / Syllabus Reference</label>
                <input
                  type="text"
                  required
                  value={formChapter}
                  onChange={(e) => setFormChapter(e.target.value)}
                  placeholder="e.g. Molecular Basis of Inheritance"
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-semibold"
                />
              </div>

              {/* Duplicate scanner hook */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Question Text</label>
                  <button
                    type="button"
                    onClick={checkDuplicates}
                    disabled={checkingDuplicates || !formText.trim()}
                    className="text-[10px] font-black text-emerald-600 hover:text-emerald-500 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Search className="h-3 w-3" />
                    Scan duplicate matches
                  </button>
                </div>
                <textarea
                  required
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Write complete question content..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-medium leading-relaxed"
                />

                {/* Duplicate matches alerts */}
                {duplicateChecked && (
                  <div className={`p-3 rounded-lg border text-[10px] ${
                    duplicateMatches.length > 0 
                      ? 'bg-rose-50 border-rose-100 text-rose-700' 
                      : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  }`}>
                    {duplicateMatches.length > 0 ? (
                      <div className="space-y-1.5">
                        <p className="font-bold flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Duplicates detected! {duplicateMatches.length} matching questions found:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {duplicateMatches.map((m, idx) => (
                            <li key={idx}>Subject: {m.subject} | Chapter: {m.chapter} | "{m.question.slice(0, 50)}..."</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="font-bold flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 shrink-0" /> ✓ No duplicates detected! This question is unique.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Option A</label>
                  <input
                    type="text"
                    required
                    value={formOptionA}
                    onChange={(e) => setFormOptionA(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Option B</label>
                  <input
                    type="text"
                    required
                    value={formOptionB}
                    onChange={(e) => setFormOptionB(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Option C</label>
                  <input
                    type="text"
                    required
                    value={formOptionC}
                    onChange={(e) => setFormOptionC(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Option D</label>
                  <input
                    type="text"
                    required
                    value={formOptionD}
                    onChange={(e) => setFormOptionD(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Correct Option</label>
                  <select
                    value={formCorrect}
                    onChange={(e) => setFormCorrect(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-bold text-emerald-600"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-neutral-400 block mt-5 leading-normal">
                    Option designated as correct answer key.
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Scientific Explanation / Derivation</label>
                <textarea
                  required
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Explain why the option is correct, citing NCERT reference chapters..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-medium leading-relaxed"
                />
              </div>

              {/* Footer */}
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
                  Save Question
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* 2. FLAGGED ISSUE RESOLUTION & CASCADING EDITS FORM MODAL */}
      {activeFlag && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs" onClick={() => setActiveFlag(null)} />
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xl max-w-2xl w-full mx-auto relative z-10 max-h-[90vh] flex flex-col">
            <header className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-950/40">
              <div>
                <h3 className="text-base font-black text-neutral-900 dark:text-neutral-50 flex items-center gap-1.5">
                  <Flag className="h-5 w-5 text-rose-500 animate-pulse" />
                  Review reported issue #{String(activeFlag.id).slice(0, 8)}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">Reported by: {activeFlag.student_email} • Reason: "{activeFlag.reason}"</p>
              </div>
              <button onClick={() => setActiveFlag(null)} className="p-1 text-neutral-400 rounded-lg cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={handleResolveFlagSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              <div>
                <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Set Status</label>
                <div className="flex gap-2">
                  {(['pending', 'resolved', 'dismissed'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFlagStatus(st)}
                      className={`px-4 py-2 rounded-lg border font-bold uppercase text-[10px] cursor-pointer transition-all ${
                        flagStatus === st
                          ? st === 'resolved'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : st === 'dismissed'
                            ? 'bg-neutral-100 border-neutral-300 text-neutral-700'
                            : 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'bg-white text-neutral-400 border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase">Admin Resolution Note</label>
                <textarea
                  value={flagAdminNote}
                  onChange={(e) => setFlagAdminNote(e.target.value)}
                  placeholder="Record resolution action taken (e.g., 'Corrected Option B to Option C in database cascading update')"
                  rows={2.5}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 font-medium leading-relaxed"
                />
              </div>

              {/* Cascading edit fields only visible when resolved */}
              {flagStatus === 'resolved' && (
                <div className="border border-emerald-100 dark:border-emerald-950/40 rounded-xl p-4 bg-emerald-50/10 space-y-4">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold border-b border-emerald-100 dark:border-emerald-950/20 pb-2 mb-2">
                    <Sparkles className="h-4.5 w-4.5" />
                    <span>Cascading Question Correcter (Saves directly to registry)</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-500 dark:text-neutral-400 mb-1 uppercase">Question Text</label>
                    <textarea
                      value={flagCascadeQuestion}
                      onChange={(e) => setFlagCascadeQuestion(e.target.value)}
                      rows={2.5}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-400 mb-1">Option A</label>
                      <input
                        type="text"
                        value={flagCascadeOptA}
                        onChange={(e) => setFlagCascadeOptA(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-400 mb-1">Option B</label>
                      <input
                        type="text"
                        value={flagCascadeOptB}
                        onChange={(e) => setFlagCascadeOptB(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-400 mb-1">Option C</label>
                      <input
                        type="text"
                        value={flagCascadeOptC}
                        onChange={(e) => setFlagCascadeOptC(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-400 mb-1">Option D</label>
                      <input
                        type="text"
                        value={flagCascadeOptD}
                        onChange={(e) => setFlagCascadeOptD(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-neutral-500 mb-1 uppercase">Correct Answer Key</label>
                      <select
                        value={flagCascadeCorrect}
                        onChange={(e) => setFlagCascadeCorrect(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 font-bold text-emerald-600"
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-500 mb-1 uppercase">Explanation Details</label>
                    <textarea
                      value={flagCascadeExplanation}
                      onChange={(e) => setFlagCascadeExplanation(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white dark:bg-neutral-950"
                    />
                  </div>
                </div>
              )}

              {/* Resolve Footer */}
              <footer className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3 bg-neutral-50 dark:bg-neutral-950/20 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setActiveFlag(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  Submit Resolution
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
        title="Confirm Question Deletion"
        message="Are you sure you want to permanently delete this high-yield NEET practice question from the student database? This transaction is recorded in audit logs and is non-reversible."
        confirmText="Permanently Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
}
