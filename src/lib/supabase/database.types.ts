export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_generations: {
        Row: {
          approved: boolean | null
          created_at: string
          id: string
          input_summary: string | null
          job_id: string | null
          model: string
          output: string | null
          resume_version_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          approved?: boolean | null
          created_at?: string
          id?: string
          input_summary?: string | null
          job_id?: string | null
          model: string
          output?: string | null
          resume_version_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          approved?: boolean | null
          created_at?: string
          id?: string
          input_summary?: string | null
          job_id?: string | null
          model?: string
          output?: string | null
          resume_version_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_history: {
        Row: {
          application_id: string
          changed_at: string
          from_status: string | null
          id: string
          note: string | null
          to_status: string
          user_id: string
        }
        Insert: {
          application_id: string
          changed_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status: string
          user_id: string
        }
        Update: {
          application_id?: string
          changed_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          checklist: Json
          cover_letter_id: string | null
          created_at: string
          date_applied: string | null
          date_discovered: string
          follow_up_date: string | null
          id: string
          interview_feedback: string | null
          job_id: string
          notes: string | null
          recruiter_id: string | null
          rejection_reason: string | null
          resume_version_id: string | null
          salary_discussed: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checklist?: Json
          cover_letter_id?: string | null
          created_at?: string
          date_applied?: string | null
          date_discovered?: string
          follow_up_date?: string | null
          id?: string
          interview_feedback?: string | null
          job_id: string
          notes?: string | null
          recruiter_id?: string | null
          rejection_reason?: string | null
          resume_version_id?: string | null
          salary_discussed?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checklist?: Json
          cover_letter_id?: string | null
          created_at?: string
          date_applied?: string | null
          date_discovered?: string
          follow_up_date?: string | null
          id?: string
          interview_feedback?: string | null
          job_id?: string
          notes?: string | null
          recruiter_id?: string | null
          rejection_reason?: string | null
          resume_version_id?: string | null
          salary_discussed?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_cover_letter_id_fkey"
            columns: ["cover_letter_id"]
            isOneToOne: false
            referencedRelation: "cover_letters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "recruiters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          careers_url: string | null
          company_size: string | null
          created_at: string
          id: string
          industry: string | null
          locations: string[]
          name: string
          notes: string | null
          relationship: string
          sponsorship_evidence: string | null
          sponsorship_source: string | null
          sponsorship_status: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          careers_url?: string | null
          company_size?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          locations?: string[]
          name: string
          notes?: string | null
          relationship?: string
          sponsorship_evidence?: string | null
          sponsorship_source?: string | null
          sponsorship_status?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          careers_url?: string | null
          company_size?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          locations?: string[]
          name?: string
          notes?: string | null
          relationship?: string
          sponsorship_evidence?: string | null
          sponsorship_source?: string | null
          sponsorship_status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      company_sponsorship_history: {
        Row: {
          changed_at: string
          company_id: string
          evidence: string | null
          from_status: string | null
          id: string
          source: string | null
          to_status: string
          user_id: string
        }
        Insert: {
          changed_at?: string
          company_id: string
          evidence?: string | null
          from_status?: string | null
          id?: string
          source?: string | null
          to_status: string
          user_id: string
        }
        Update: {
          changed_at?: string
          company_id?: string
          evidence?: string | null
          from_status?: string | null
          id?: string
          source?: string | null
          to_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_sponsorship_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cover_letters: {
        Row: {
          approved: boolean
          content: string
          created_at: string
          id: string
          job_id: string
          model: string | null
          resume_version_id: string | null
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          content: string
          created_at?: string
          id?: string
          job_id: string
          model?: string | null
          resume_version_id?: string | null
          tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved?: boolean
          content?: string
          created_at?: string
          id?: string
          job_id?: string
          model?: string | null
          resume_version_id?: string | null
          tone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cover_letters_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cover_letters_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      followups: {
        Row: {
          application_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          due_date: string
          id: string
          note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date: string
          id?: string
          note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string
          id?: string
          note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followups_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string
          feedback: string | null
          id: string
          interviewer_name: string | null
          meeting_url: string | null
          preparation_notes: string | null
          questions: string | null
          result: string
          scheduled_at: string | null
          stage: string
          topics: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          interviewer_name?: string | null
          meeting_url?: string | null
          preparation_notes?: string | null
          questions?: string | null
          result?: string
          scheduled_at?: string | null
          stage?: string
          topics?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          interviewer_name?: string | null
          meeting_url?: string | null
          preparation_notes?: string | null
          questions?: string | null
          result?: string
          scheduled_at?: string | null
          stage?: string
          topics?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      job_profiles: {
        Row: {
          created_at: string
          current_title: string | null
          digest_enabled: boolean
          digest_frequency: string
          email: string | null
          full_name: string | null
          github_url: string | null
          id: string
          is_admin: boolean
          linkedin_url: string | null
          location: string | null
          notification_settings: Json
          phone: string | null
          portfolio_url: string | null
          professional_summary: string | null
          target_titles: string[]
          terms_accepted_at: string | null
          terms_version: string | null
          theme: string
          updated_at: string
          username: string | null
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          current_title?: string | null
          digest_enabled?: boolean
          digest_frequency?: string
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          id: string
          is_admin?: boolean
          linkedin_url?: string | null
          location?: string | null
          notification_settings?: Json
          phone?: string | null
          portfolio_url?: string | null
          professional_summary?: string | null
          target_titles?: string[]
          terms_accepted_at?: string | null
          terms_version?: string | null
          theme?: string
          updated_at?: string
          username?: string | null
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          current_title?: string | null
          digest_enabled?: boolean
          digest_frequency?: string
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          id?: string
          is_admin?: boolean
          linkedin_url?: string | null
          location?: string | null
          notification_settings?: Json
          phone?: string | null
          portfolio_url?: string | null
          professional_summary?: string | null
          target_titles?: string[]
          terms_accepted_at?: string | null
          terms_version?: string | null
          theme?: string
          updated_at?: string
          username?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      job_search_profiles: {
        Row: {
          created_at: string
          employment_types: string[]
          hard_filters: Json
          id: string
          is_active: boolean
          keywords: string[]
          locations: string[]
          max_salary: number | null
          max_years_experience: number | null
          min_salary: number | null
          min_years_experience: number | null
          name: string
          remote_preference: string
          soft_preferences: Json
          sponsorship_requirement: string
          technologies: string[]
          titles: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          employment_types?: string[]
          hard_filters?: Json
          id?: string
          is_active?: boolean
          keywords?: string[]
          locations?: string[]
          max_salary?: number | null
          max_years_experience?: number | null
          min_salary?: number | null
          min_years_experience?: number | null
          name: string
          remote_preference?: string
          soft_preferences?: Json
          sponsorship_requirement?: string
          technologies?: string[]
          titles?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          employment_types?: string[]
          hard_filters?: Json
          id?: string
          is_active?: boolean
          keywords?: string[]
          locations?: string[]
          max_salary?: number | null
          max_years_experience?: number | null
          min_salary?: number | null
          min_years_experience?: number | null
          name?: string
          remote_preference?: string
          soft_preferences?: Json
          sponsorship_requirement?: string
          technologies?: string[]
          titles?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_snapshots: {
        Row: {
          captured_at: string
          closing_date: string | null
          id: string
          job_id: string
          location: string | null
          min_years_experience: number | null
          presence: string
          salary_max: number | null
          salary_min: number | null
          sponsorship_status: string | null
          technologies: string[]
          user_id: string
          work_arrangement: string | null
        }
        Insert: {
          captured_at?: string
          closing_date?: string | null
          id?: string
          job_id: string
          location?: string | null
          min_years_experience?: number | null
          presence?: string
          salary_max?: number | null
          salary_min?: number | null
          sponsorship_status?: string | null
          technologies?: string[]
          user_id: string
          work_arrangement?: string | null
        }
        Update: {
          captured_at?: string
          closing_date?: string | null
          id?: string
          job_id?: string
          location?: string | null
          min_years_experience?: number | null
          presence?: string
          salary_max?: number | null
          salary_min?: number | null
          sponsorship_status?: string | null
          technologies?: string[]
          user_id?: string
          work_arrangement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_snapshots_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_sources: {
        Row: {
          board_token: string
          created_at: string
          id: string
          is_active: boolean
          last_sync_error: string | null
          last_sync_job_count: number | null
          last_sync_status: string
          last_synced_at: string | null
          name: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board_token: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_error?: string | null
          last_sync_job_count?: number | null
          last_sync_status?: string
          last_synced_at?: string | null
          name: string
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board_token?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_error?: string | null
          last_sync_job_count?: number | null
          last_sync_status?: string
          last_synced_at?: string | null
          name?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          application_url: string | null
          company_id: string | null
          company_name: string
          created_at: string
          date_discovered: string
          description: string | null
          education_requirement: string | null
          employment_type: string
          external_job_id: string | null
          id: string
          is_saved: boolean
          job_source_id: string | null
          job_url: string | null
          last_verified_at: string | null
          location: string | null
          min_years_experience: number | null
          posted_date: string | null
          preferred_qualifications: string | null
          requirements: string | null
          salary_currency: string
          salary_max: number | null
          salary_min: number | null
          saved_at: string | null
          source: string
          sponsorship_evidence: string | null
          sponsorship_source: string | null
          sponsorship_status: string
          status: string
          technologies: string[]
          title: string
          updated_at: string
          updated_date: string | null
          user_id: string
          work_arrangement: string | null
        }
        Insert: {
          application_url?: string | null
          company_id?: string | null
          company_name: string
          created_at?: string
          date_discovered?: string
          description?: string | null
          education_requirement?: string | null
          employment_type?: string
          external_job_id?: string | null
          id?: string
          is_saved?: boolean
          job_source_id?: string | null
          job_url?: string | null
          last_verified_at?: string | null
          location?: string | null
          min_years_experience?: number | null
          posted_date?: string | null
          preferred_qualifications?: string | null
          requirements?: string | null
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          saved_at?: string | null
          source?: string
          sponsorship_evidence?: string | null
          sponsorship_source?: string | null
          sponsorship_status?: string
          status?: string
          technologies?: string[]
          title: string
          updated_at?: string
          updated_date?: string | null
          user_id: string
          work_arrangement?: string | null
        }
        Update: {
          application_url?: string | null
          company_id?: string | null
          company_name?: string
          created_at?: string
          date_discovered?: string
          description?: string | null
          education_requirement?: string | null
          employment_type?: string
          external_job_id?: string | null
          id?: string
          is_saved?: boolean
          job_source_id?: string | null
          job_url?: string | null
          last_verified_at?: string | null
          location?: string | null
          min_years_experience?: number | null
          posted_date?: string | null
          preferred_qualifications?: string | null
          requirements?: string | null
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          saved_at?: string | null
          source?: string
          sponsorship_evidence?: string | null
          sponsorship_source?: string | null
          sponsorship_status?: string
          status?: string
          technologies?: string[]
          title?: string
          updated_at?: string
          updated_date?: string | null
          user_id?: string
          work_arrangement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_job_source_id_fkey"
            columns: ["job_source_id"]
            isOneToOne: false
            referencedRelation: "job_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      recruiters: {
        Row: {
          company_id: string | null
          company_name: string | null
          created_at: string
          email: string | null
          first_contact_date: string | null
          id: string
          last_contact_date: string | null
          linkedin_url: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          first_contact_date?: string | null
          id?: string
          last_contact_date?: string | null
          linkedin_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          first_contact_date?: string | null
          id?: string
          last_contact_date?: string | null
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recruiters_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_facts: {
        Row: {
          ai_generation_id: string | null
          created_at: string
          id: string
          original_text: string | null
          reasoning: string | null
          resume_version_id: string
          section: string
          status: string
          suggested_text: string
          user_id: string
        }
        Insert: {
          ai_generation_id?: string | null
          created_at?: string
          id?: string
          original_text?: string | null
          reasoning?: string | null
          resume_version_id: string
          section: string
          status?: string
          suggested_text: string
          user_id: string
        }
        Update: {
          ai_generation_id?: string | null
          created_at?: string
          id?: string
          original_text?: string | null
          reasoning?: string | null
          resume_version_id?: string
          section?: string
          status?: string
          suggested_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_facts_ai_generation_id_fkey"
            columns: ["ai_generation_id"]
            isOneToOne: false
            referencedRelation: "ai_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resume_facts_resume_version_id_fkey"
            columns: ["resume_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_versions: {
        Row: {
          ai_reasoning: string | null
          approved: boolean
          change_summary: string | null
          content: Json
          created_at: string
          created_by: string
          id: string
          raw_text: string | null
          resume_id: string
          user_id: string
          version_number: number
        }
        Insert: {
          ai_reasoning?: string | null
          approved?: boolean
          change_summary?: string | null
          content?: Json
          created_at?: string
          created_by?: string
          id?: string
          raw_text?: string | null
          resume_id: string
          user_id: string
          version_number: number
        }
        Update: {
          ai_reasoning?: string | null
          approved?: boolean
          change_summary?: string | null
          content?: Json
          created_at?: string
          created_by?: string
          id?: string
          raw_text?: string | null
          resume_id?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "resume_versions_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          created_at: string
          current_version_id: string | null
          id: string
          is_master: boolean
          source_job_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_version_id?: string | null
          id?: string
          is_master?: boolean
          source_job_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_version_id?: string | null
          id?: string
          is_master?: boolean
          source_job_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_current_version_id_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resumes_source_job_id_fkey"
            columns: ["source_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_email_for_username: {
        Args: { p_username: string }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      username_available: {
        Args: { p_username: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Row"]

export type TablesInsert<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Insert"]

export type TablesUpdate<TableName extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][TableName]["Update"]
