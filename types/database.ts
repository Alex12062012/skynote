export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Profile {
  id: string; email: string; full_name: string | null; avatar_url: string | null
  plan: 'free' | 'premium'; plan_expires_at: string | null; sky_coins: number
  streak_days: number; last_login_at: string | null; created_at: string; updated_at: string
}
export interface Course {
  id: string; user_id: string; title: string; subject: string; color: string
  source_type: 'text' | 'pdf' | 'photo' | 'vocal'; source_content: string | null
  file_url: string | null; status: 'processing' | 'ready' | 'error'; progress: number
  created_at: string; updated_at: string
}
export interface Flashcard {
  id: string; course_id: string; user_id: string; title: string; summary: string
  key_points: string[]; is_mastered: boolean; order_index: number; created_at: string
}
export interface QcmQuestion {
  id: string; flashcard_id: string; course_id: string; user_id: string
  question: string; options: string[]; correct_index: number; explanation: string; created_at: string
}
export interface QcmAttempt {
  id: string; user_id: string; flashcard_id: string; score: number; total: number
  perfect: boolean; coins_earned: number; created_at: string
}
export interface Objective {
  id: string; key: string; title: string; description: string
  icon: string; reward_coins: number; target_value: number
}
export interface UserObjective {
  id: string; user_id: string; objective_id: string; current_value: number
  completed: boolean; completed_at: string | null; created_at: string
}
export interface CoinTransaction {
  id: string; user_id: string; amount: number; reason: string; created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; email: string }; Update: Partial<Profile> }
      courses: { Row: Course; Insert: Omit<Course,'id'|'created_at'|'updated_at'>; Update: Partial<Course> }
      flashcards: { Row: Flashcard; Insert: Omit<Flashcard,'id'|'created_at'>; Update: Partial<Flashcard> }
      qcm_questions: { Row: QcmQuestion; Insert: Omit<QcmQuestion,'id'|'created_at'>; Update: Partial<QcmQuestion> }
      qcm_attempts: { Row: QcmAttempt; Insert: Omit<QcmAttempt,'id'|'created_at'>; Update: Partial<QcmAttempt> }
      objectives: { Row: Objective; Insert: Omit<Objective,'id'>; Update: Partial<Objective> }
      user_objectives: { Row: UserObjective; Insert: Omit<UserObjective,'id'|'created_at'>; Update: Partial<UserObjective> }
      coin_transactions: { Row: CoinTransaction; Insert: Omit<CoinTransaction,'id'|'created_at'>; Update: never }
    }
    Views: {}; Functions: {}; Enums: {}
  }
}
