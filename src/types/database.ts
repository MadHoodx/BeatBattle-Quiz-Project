export type Profile = {
  id: string
  username: string
  created_at: string
}

export type Score = {
  id: string
  user_id: string
  score: number
  total_questions: number
  created_at: string
}
