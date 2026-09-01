export type UserRole = 'tutor' | 'student'

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'ai_reviewed'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
}

export interface Student {
  id: string
  user_id: string
  tutor_id: string
  name: string
  subject: string
  current_level: string
  learning_goals: string
  weak_areas: string
  created_at: string
  profiles?: Profile
}

export interface Session {
  id: string
  tutor_id: string
  student_id: string
  topic: string
  starts_at: string
  status: SessionStatus
  notes: string
  ai_plan: AiPlan | null
  ai_review: AiReview | null
  created_at: string
  updated_at: string
  students?: Student
  profiles?: Profile
}

export interface AiPlan {
  objectives: string[]
  outline: string[]
  practice_questions: string[]
}

export interface AiReview {
  summary: string
  homework: string[]
  next_suggestion: string
}

export interface AiProgressSummary {
  summary: string
}

export const SESSION_DURATION_MS = 60 * 60 * 1000

export const VALID_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  scheduled: ['scheduled', 'in_progress'],
  in_progress: ['in_progress', 'completed'],
  completed: ['completed', 'ai_reviewed'],
  ai_reviewed: ['ai_reviewed'],
}

export function isValidTransition(from: SessionStatus, to: SessionStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}