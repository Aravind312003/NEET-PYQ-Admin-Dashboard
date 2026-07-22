import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Users as UsersIcon,
  CheckCircle,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  BookOpen,
  Calendar,
  AlertCircle,
  Loader2,
  Activity,
  Award,
  Flame,
  Sparkles,
  BarChart3,
  Percent,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  LineChart,
  Line
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'dropoff' | 'performance'>('overview');
  // Activity timeline days filter
  const [timelineDays, setTimelineDays] = useState<7 | 30 | 90>(7);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      try {
        // UPDATED: Pointing directly to your Render backend
        const response = await fetch('https://neet-pyq-admin-dashboard.onrender.com/api/admin/dashboard', {
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

        if (!response.ok) {
          throw new Error('Server returned error details');
        }

        const analytics = await response.json();
        setData(analytics);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to retrieve live administrative analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-semibold text-neutral-500">Retrieving system stats and analytics ledger...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20 max-w-lg mx-auto text-center">
        <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-red-900 dark:text-red-300">Administrative Connection Failure</h3>
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error || 'An error has occurred.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

  // Select timeline array based on toggle filter
  const activeTimeline = 
    timelineDays === 7 
      ? data.userActivity?.timeline7 
      : timelineDays === 30 
        ? data.userActivity?.timeline30 
        : data.userActivity?.timeline90;

  return (
    <div className="space-y-8 pb-12">
      {/* Upper Pitch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 font-sans">
            Overview Dashboard
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time insights, core academic metrics, and active student trends.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 self-start sm:self-center">
          {(['overview', 'activity', 'dropoff', 'performance'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {tab === 'dropoff' ? 'Test Drop-Off' : tab === 'performance' ? 'Performance Heatmap' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Questions</p>
              <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 mt-1.5">
                {data.totalQuestions}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-neutral-400 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-emerald-500 font-semibold">Active</span> catalog content
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Registered Students</p>
              <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 mt-1.5">
                {data.totalUsers}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <UsersIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-neutral-400 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-emerald-500 font-semibold">Real</span> client database
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Active Today (DAU)</p>
              <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 mt-1.5">
                {data.activeUsers24h}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-neutral-400 flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-blue-500 font-semibold">Dynamic</span> login metrics
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Completed Sessions</p>
              <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 mt-1.5">
                {data.testsAttempted}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <AlertOctagon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-neutral-400 flex items-center gap-1">
            <Award className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-indigo-500 font-semibold">Test submissions</span> stored
          </div>
        </div>
      </div>

      {/* CONDITIONAL RENDERING OF ADVANCED ANALYTIC SECTIONS */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart: Subject Distribution */}
            <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-50">Questions per Subject</h3>
                  <p className="text-[11px] text-neutral-400">Total volume of questions parsed under each major NEET criteria</p>
                </div>
              </div>
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.subjectStats} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#525252" opacity={0.15} />
                    <XAxis dataKey="subject" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#171717',
                        border: '1px solid #262626',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]}>
                      {data.subjectStats.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Side Chart: Year Breakdown */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-50">Questions per Year</h3>
                  <p className="text-[11px] text-neutral-400">Database proportion classified by question year</p>
                </div>
              </div>
              <div className="h-48 mt-6 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.yearStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="year"
                    >
                      {data.yearStats.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#171717',
                        border: '1px solid #262626',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {data.yearStats.slice(0, 4).map((stat: any, i: number) => (
                  <div key={stat.year} className="flex items-center gap-1.5 text-neutral-500 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{stat.year}:</span> {stat.count}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Critical Student Pain Point: Most Incorrectly Answered Questions */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-50">Most Incorrectly Answered Questions</h3>
                <p className="text-[11px] text-neutral-400">Analyzing hardest concepts based on aggregated mock test submissions</p>
              </div>
              <Link
                to="/admin/questions"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-0.5"
              >
                Review Questions
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {data.mostIncorrectQuestions.map((q: any, index: number) => (
                <div key={q.question_id} className="py-4.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400">
                        #{index + 1} Hardest
                      </span>
                      <span className="text-xs font-medium text-neutral-400 truncate">
                        {q.subject} • Question ID: {q.question_id}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium line-clamp-2 mt-1.5 leading-relaxed">
                      {q.question_text}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400">{q.incorrect_count}</span>
                    <p className="text-[10px] text-neutral-400 uppercase font-semibold">Wrong Attempts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          {/* Activity Cohort Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-neutral-900 dark:to-neutral-950 border border-emerald-100 dark:border-neutral-800 rounded-xl p-5 shadow-xs text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Daily Active Users (DAU)</span>
              <h4 className="text-3xl font-black text-emerald-600 mt-2">{data.userActivity?.dau || 0}</h4>
              <p className="text-xs text-neutral-500 mt-1">Unique student active sessions within past 24 hours</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-neutral-900 dark:to-neutral-950 border border-blue-100 dark:border-neutral-800 rounded-xl p-5 shadow-xs text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Weekly Active Users (WAU)</span>
              <h4 className="text-3xl font-black text-blue-600 mt-2">{data.userActivity?.wau || 0}</h4>
              <p className="text-xs text-neutral-500 mt-1">Unique student active sessions within past 7 days</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-neutral-900 dark:to-neutral-950 border border-purple-100 dark:border-neutral-800 rounded-xl p-5 shadow-xs text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Monthly Active Users (MAU)</span>
              <h4 className="text-3xl font-black text-purple-600 mt-2">{data.userActivity?.mau || 0}</h4>
              <p className="text-xs text-neutral-500 mt-1">Unique student active sessions within past 30 days</p>
            </div>
          </div>

          {/* Activity Trend Line / Area Chart */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-50">Active Users vs Registrations</h3>
                <p className="text-[11px] text-neutral-400">Tracking database growth and active engagement rates over time</p>
              </div>

              {/* Time Range Selector */}
              <div className="flex bg-neutral-100 dark:bg-neutral-950 p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 self-start sm:self-center">
                {([7, 30, 90] as const).map((days) => (
                  <button
                    key={days}
                    onClick={() => setTimelineDays(days)}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                      timelineDays === days
                        ? 'bg-white dark:bg-neutral-800 text-emerald-600 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Last {days} Days
                  </button>
                ))}
              </div>
            </div>

            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeTimeline}>
                  <defs>
                    <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#525252" opacity={0.15} />
                  <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#171717',
                      border: '1px solid #262626',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  <Area name="Cumulative Registrations" type="monotone" dataKey="registrations" stroke="#10b981" fillOpacity={1} fill="url(#colorReg)" strokeWidth={2.5} />
                  <Area name="Active User Sessions" type="monotone" dataKey="activeUsers" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAct)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEST DROP-OFF */}
      {activeTab === 'dropoff' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-50 mb-1">User Exam Funnel & Completion</h3>
            <p className="text-[11px] text-neutral-400 mb-6">Analyzing which question number cohorts student practice sessions terminate or drop off</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.testDropOff?.map((test: any) => (
                <div key={test.testId} className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-4">
                  <div>
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-50 truncate" title={test.title}>
                      {test.title}
                    </h4>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Attempt Sessions: {test.started}</p>
                  </div>

                  {/* Ring/Funnel Summary */}
                  <div className="grid grid-cols-3 gap-2 text-center py-2 bg-neutral-50 dark:bg-neutral-950 rounded-lg">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase">Completed</span>
                      <p className="text-xs font-black text-emerald-600 mt-0.5">{test.completed}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase">Rate</span>
                      <p className="text-xs font-black text-blue-600 mt-0.5">{test.completionRate}%</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase">Avg Ans</span>
                      <p className="text-xs font-black text-purple-600 mt-0.5">Q{test.avgQuestionsAnswered}</p>
                    </div>
                  </div>

                  {/* Funnel chart for specific test */}
                  <div>
                    <span className="text-[10px] font-semibold text-neutral-400 block mb-2">Question Retention rates:</span>
                    <div className="space-y-1.5">
                      {[
                        { label: 'Q1+ (Start)', rate: test.dropOffByQuestion.Q1 },
                        { label: 'Q20+', rate: test.dropOffByQuestion.Q20 },
                        { label: 'Q50+', rate: test.dropOffByQuestion.Q50 },
                        { label: 'Q100+', rate: test.dropOffByQuestion.Q100 },
                        { label: 'Q180 (Full)', rate: test.dropOffByQuestion.Q180 }
                      ].map((cohort) => (
                        <div key={cohort.label} className="text-[10px]">
                          <div className="flex justify-between text-neutral-500 mb-0.5 font-medium">
                            <span>{cohort.label}</span>
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{cohort.rate}%</span>
                          </div>
                          <div className="w-full bg-neutral-100 dark:bg-neutral-950 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${cohort.rate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUBJECT & TOPIC PERFORMANCE HEATMAP */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Subject Performance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.subjectPerformance?.map((sub: any) => (
              <div key={sub.subject} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-50 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sub.subject === 'Biology' ? '#10b981' : sub.subject === 'Physics' ? '#3b82f6' : '#f59e0b' }}></span>
                    {sub.subject} Performance
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {sub.avgAccuracy}% Accuracy
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-neutral-400 font-semibold block">Average Score</span>
                    <span className="text-lg font-black text-neutral-800 dark:text-neutral-200 mt-0.5 block">{sub.avgScore} <span className="text-[10px] text-neutral-400 font-normal">pts</span></span>
                  </div>
                  <div>
                    <span className="text-neutral-400 font-semibold block">Attempts Count</span>
                    <span className="text-lg font-black text-neutral-800 dark:text-neutral-200 mt-0.5 block">{sub.attemptCount} <span className="text-[10px] text-neutral-400 font-normal">ans</span></span>
                  </div>
                </div>

                {/* Accuracy Proportions */}
                <div className="space-y-1.5 text-[10px]">
                  <span className="text-neutral-400 font-semibold block">Answer Distribution:</span>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-950 rounded-full h-3 overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${sub.correctPercent}%` }} title={`Correct: ${sub.correctPercent}%`} />
                    <div className="bg-rose-500 h-full" style={{ width: `${sub.incorrectPercent}%` }} title={`Incorrect: ${sub.incorrectPercent}%`} />
                    <div className="bg-neutral-400 h-full" style={{ width: `${sub.skippedPercent}%` }} title={`Skipped: ${sub.skippedPercent}%`} />
                  </div>
                  <div className="flex gap-3 text-[9px] text-neutral-500 justify-between">
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span> Correct: {sub.correctPercent}%</span>
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block"></span> Wrong: {sub.incorrectPercent}%</span>
                    <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-neutral-400 inline-block"></span> Skipped: {sub.skippedPercent}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Chapter Heatmap Table */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-50 mb-1">Academic Performance Heatmap</h3>
            <p className="text-[11px] text-neutral-400 mb-4">Detailed diagnostic analysis across subject syllabus chapters based on student mock submissions</p>

            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-950 text-neutral-400 uppercase font-bold tracking-wider border-b border-neutral-100 dark:border-neutral-800">
                    <th className="px-5 py-3">Subject Criteria</th>
                    <th className="px-5 py-3">Chapter & Topic</th>
                    <th className="px-5 py-3">Attempt count</th>
                    <th className="px-5 py-3">Average Accuracy</th>
                    <th className="px-5 py-3 text-right">Difficulty state</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-medium">
                  {data.topicHeatmap?.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/10">
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider ${
                            item.subject === 'Biology'
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : item.subject === 'Physics'
                              ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                              : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}
                        >
                          {item.subject}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-neutral-800 dark:text-neutral-200 font-semibold">{item.chapter}</td>
                      <td className="px-5 py-3 text-neutral-500 font-mono text-[11px]">{item.attempts} attempts</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-neutral-100 dark:bg-neutral-950 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.avgAccuracy >= 80 ? 'bg-emerald-500' : item.avgAccuracy >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${item.avgAccuracy}%` }}
                            />
                          </div>
                          <span
                            className={`font-black text-[11px] ${
                              item.avgAccuracy >= 80 ? 'text-emerald-600' : item.avgAccuracy >= 60 ? 'text-amber-600' : 'text-rose-600'
                            }`}
                          >
                            {item.avgAccuracy}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            item.avgAccuracy >= 80
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                              : item.avgAccuracy >= 60
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                          }`}
                        >
                          {item.avgAccuracy >= 80 ? 'Strong concept' : item.avgAccuracy >= 60 ? 'Warning' : 'Critical bottleneck'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}