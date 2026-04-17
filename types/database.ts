export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Profile {
  id: string; email: string; full_name: string | null; avatar_url: string | null
  plan: 'free' | 'plus' | 'famille'; plan_expires_at: string | null; sky_coins: number
  streak_days: number; last_login_at: string | null; created_at: string; updated_at: string
  referral_code: string | null; referred_by: string | null
  courses_this_week: number; week_reset_at: string; total_loyalty_weeks: number
  stripe_customer_id: string | null; stripe_subscription_id: string | null
  is_beta_tester: boolean; feedback_shown_5: boolean; feedback_shown_25: boolean
  role: 'user' | 'teacher' | 'student'
  classroom_id: string | null
  classroom_student_id: string | null
  pseudo: string | null
  user_number: number | null
  // ─── Gamification v2 (migration 016) ─────────────────────────────────────
  prestige_level: number
  active_title_id: string | null
  active_badge_id: string
  total_coins_earned: number
  total_qcm_perfect: number
  total_qcm_attempted: number
  perfect_streak: number
  best_perfect_streak: number
  weekly_coins: number
  monthly_coins: number
  week_start: string
  month_start: string
  likes_received: number
  bio: string | null
}

export interface UserTitle {
  id: string; user_id: string; title_id: string
  source: 'unlock' | 'purchase' | 'prestige' | 'wheel' | 'event'
  unlocked_at: string
}

export interface UserBadge {
  id: string; user_id: string; badge_id: string
  source: 'purchase' | 'unlock' | 'wheel' | 'event'
  unlocked_at: string
}

export interface UserBoost {
  id: string; user_id: string
  boost_type: 'x2_coins' | 'retry_qcm' | 'skip_question'
  expires_at: string | null; charges: number; created_at: string
}

export interface ProfileLike {
  id: string; liker_id: string; liked_id: string; created_at: string
}

export interface Classroom {
  id: string; teacher_id: string; class_code: string; created_at: string
}

export interface ClassroomStudent {
  id: string; classroom_id: string; first_name: string; last_name: string
  login_code: string; created_at: string
}

export interface Course {
  id: string; user_id: string; title: string; subject: string; color: string
  source_type: 'text' | 'pdf' | 'photo' | 'vocal'; source_content: string | null
  file_url: string | null; status: 'processing' | 'ready' | 'error'; progress: number
  qcm_status: 'pending' | 'processing' | 'ready' | 'error'
  created_at: string; updated_at: string
}

export interface Flashcard {
  id: string; course_id: string; user_id: string; title: string; summary: string
  key_points: string[]; is_mastered: boolean; order_index: number; created_at: string
}

export interface QcmQuestion {
  id: string; flashcard_id: string; course_id: string; user_id: string
  question: string; options: string[]; correct_index: number; explanation: string
  difficulty: 'peaceful' | 'easy' | 'medium' | 'hard'; created_at: string
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
  completed: boolean; completed_at: string | null; claimed: boolean; claimed_at: string | null
  created_at: string
}

export interface CoinTransaction {
  id: string; user_id: string; amount: number; reason: string; created_at: string
}

export interface AdminSetting {
  key: string; value: string; updated_at: string
}

export interface Feedback {
  id: string; user_id: string; score: number; love: string | null; missing: string | null
  milestone: number | null; created_at: string
}

export interface FamilleGroup {
  id: string; parent_id: string; family_code: string; name: string; created_at: string
}

export interface ChildAccount {
  id: string; famille_id: string; parent_id: string; pseudo: string
  access_code: string; sky_coins: number; streak_days: number; created_at: string
}

export interface ChildStat {
  id: string; child_id: string; subject: string; courses_count: number
  qcm_count: number; qcm_perfect: number
}

export interface ListQuiz {
  id: string; user_id: string; title: string; pairs: Json; created_at: string
}

export interface ListQuizSession {
  id: string; quiz_id: string; user_id: string; score: number; total: number
  coins_earned: number; completed_at: string
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
      admin_settings: { Row: AdminSetting; Insert: AdminSetting; Update: Partial<AdminSetting> }
      feedbacks: { Row: Feedback; Insert: Omit<Feedback,'id'|'created_at'>; Update: never }
      classrooms: { Row: Classroom; Insert: Omit<Classroom,'id'|'created_at'>; Update: Partial<Classroom> }
      classroom_students: { Row: ClassroomStudent; Insert: Omit<ClassroomStudent,'id'|'created_at'>; Update: Partial<ClassroomStudent> }
      famille_groups: { Row: FamilleGroup; Insert: Omit<FamilleGroup,'id'|'created_at'>; Update: Partial<FamilleGroup> }
      child_accounts: { Row: ChildAccount; Insert: Omit<ChildAccount,'id'|'created_at'>; Update: Partial<ChildAccount> }
      child_stats: { Row: ChildStat; Insert: Omit<ChildStat,'id'>; Update: Partial<ChildStat> }
      list_quizzes: { Row: ListQuiz; Insert: Omit<ListQuiz,'id'|'created_at'>; Update: Partial<ListQuiz> }
      list_quiz_sessions: { Row: ListQuizSession; Insert: Omit<ListQuizSession,'id'|'completed_at'>; Update: never }
      user_titles:  { Row: UserTitle;  Insert: Omit<UserTitle,'id'|'unlocked_at'>;  Update: Partial<UserTitle> }
      user_badges:  { Row: UserBadge;  Insert: Omit<UserBadge,'id'|'unlocked_at'>;  Update: Partial<UserBadge> }
      user_boosts:  { Row: UserBoost;  Insert: Omit<UserBoost,'id'|'created_at'>;   Update: Partial<UserBoost> }
      profile_likes:{ Row: ProfileLike;Insert: Omit<ProfileLike,'id'|'created_at'>; Update: never }
    }
    Views: {}
    Functions: {
      increment_coins: { Args: { p_user_id: string; p_amount: number }; Returns: void }
      award_coins:     { Args: { p_user_id: string; p_amount: number; p_reason: string }; Returns: number }
      spend_coins:     { Args: { p_user_id: string; p_amount: number; p_reason: string }; Returns: number }
      perform_prestige:{ Args: { p_user_id: string }; Returns: { new_prestige: number; cost: number }[] }
      toggle_like:     { Args: { p_liked_id: string }; Returns: boolean }
    }
    Enums: {}
  }
}