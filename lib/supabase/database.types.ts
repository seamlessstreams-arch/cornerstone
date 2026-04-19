export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type AppRole =
  | 'ADMINISTRATOR'
  | 'RESPONSIBLE_INDIVIDUAL'
  | 'DIRECTOR'
  | 'REGISTERED_MANAGER'
  | 'DEPUTY_MANAGER'
  | 'TEAM_LEADER'
  | 'RESIDENTIAL_SUPPORT_WORKER'
  | 'THERAPIST_CLINICAL_LEAD'
  | 'EDUCATION_TUTOR'
  | 'HR_RECRUITMENT_LEAD'
  | 'SAFER_RECRUITMENT_OFFICER'
  | 'TRAINING_COMPLIANCE_LEAD'
  | 'INDEPENDENT_VISITOR_READ_ONLY_AUDITOR'

export interface Database {
  public: {
    Tables: {
      organisations: {
        Row: { id: string; name: string; slug: string; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; slug: string; created_at?: string; updated_at?: string }
        Update: { name?: string; slug?: string; updated_at?: string }
        Relationships: []
      }
      homes: {
        Row: { id: string; organisation_id: string; name: string; code: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; organisation_id: string; name: string; code?: string | null; created_at?: string; updated_at?: string }
        Update: { name?: string; code?: string | null; updated_at?: string }
        Relationships: []
      }
      users: {
        Row: { id: string; organisation_id: string; auth_user_id: string; email: string; full_name: string | null; is_active: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; organisation_id: string; auth_user_id: string; email: string; full_name?: string | null; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { email?: string; full_name?: string | null; is_active?: boolean; updated_at?: string }
        Relationships: []
      }
      user_roles: {
        Row: { id: string; organisation_id: string; user_id: string; home_id: string | null; role: AppRole; created_at: string }
        Insert: { id?: string; organisation_id: string; user_id: string; home_id?: string | null; role: AppRole; created_at?: string }
        Update: { home_id?: string | null; role?: AppRole }
        Relationships: []
      }
      audit_logs: {
        Row: { id: string; organisation_id: string | null; home_id: string | null; actor_user_id: string | null; action: string; entity_type: string; entity_id: string | null; payload: Json | null; ip_address: string | null; user_agent: string | null; created_at: string }
        Insert: { id?: string; organisation_id?: string | null; home_id?: string | null; actor_user_id?: string | null; action: string; entity_type: string; entity_id?: string | null; payload?: Json | null; ip_address?: string | null; user_agent?: string | null; created_at?: string }
        Update: { payload?: Json | null }
        Relationships: []
      }
      notifications: {
        Row: { id: string; organisation_id: string; home_id: string | null; user_id: string; title: string; body: string; level: string; read_at: string | null; created_at: string }
        Insert: { id?: string; organisation_id: string; home_id?: string | null; user_id: string; title: string; body: string; level?: string; read_at?: string | null; created_at?: string }
        Update: { read_at?: string | null }
        Relationships: []
      }
      integration_providers: {
        Row: { id: string; key: string; name: string; status: string; configuration: Json | null; created_at: string; updated_at: string }
        Insert: { id?: string; key: string; name: string; status?: string; configuration?: Json | null; created_at?: string; updated_at?: string }
        Update: { name?: string; status?: string; configuration?: Json | null; updated_at?: string }
        Relationships: []
      }
      integration_connections: {
        Row: { id: string; organisation_id: string; provider_id: string; status: string; external_tenant_id: string | null; configuration: Json | null; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; organisation_id: string; provider_id: string; status?: string; external_tenant_id?: string | null; configuration?: Json | null; created_by?: string | null; created_at?: string; updated_at?: string }
        Update: { status?: string; external_tenant_id?: string | null; configuration?: Json | null; updated_at?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      log_audit_event: {
        Args: {
          p_action: string
          p_entity_type: string
          p_entity_id: string
          p_organisation_id: string
          p_home_id?: string
          p_payload?: Json
        }
        Returns: string
      }
    }
    Enums: {
      app_role: AppRole
    }
    CompositeTypes: Record<string, never>
  }
}
