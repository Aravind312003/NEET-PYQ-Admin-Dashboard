export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'student';
  created_at: string;
  disabled?: boolean;
}

export interface Question {
  id: string;
  year: number;
  subject: 'Physics' | 'Chemistry' | 'Biology' | string;
  chapter: string;
  question_number: number;
  question: string;
  image_url: string | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  timestamp: string;
  question_id?: string | null;
  old_value?: string | null;
  new_value?: string | null;
}

export interface SubjectStat {
  subject: string;
  count: number;
}

export interface YearStat {
  year: number;
  count: number;
}

export interface IncorrectQuestionStat {
  question_id: string;
  question_text: string;
  incorrect_count: number;
  subject: string;
}

export interface DashboardAnalytics {
  totalQuestions: number;
  totalUsers: number;
  activeUsers24h: number;
  testsAttempted: number;
  subjectStats: SubjectStat[];
  yearStats: YearStat[];
  mostIncorrectQuestions: IncorrectQuestionStat[];
}
