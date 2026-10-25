/**
 * Tipos do banco, escritos à mão a partir de supabase/migrations.
 * Se preferir gerar: npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
 * (depois mantenha os tipos de Category/Condition/Status abaixo).
 */
import type { Category, Condition, Status } from "@/lib/catalog";

type Timestamp = string;

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      donors: {
        Row: { id: string; key_hash: string; recovery_email: string | null; created_at: Timestamp };
        Insert: { id?: string; key_hash: string; recovery_email?: string | null; created_at?: Timestamp };
        Update: { id?: string; key_hash?: string; recovery_email?: string | null; created_at?: Timestamp };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          donor_id: string;
          title: string;
          description: string | null;
          notes: string | null;
          category: Category;
          condition: Condition;
          status: Status;
          photos: string[];
          nickname: string;
          block: string | null;
          pickup_info: string | null;
          interest_clicks: number;
          reports: number;
          expires_at: Timestamp;
          created_at: Timestamp;
          search_text: string;
        };
        Insert: {
          id?: string;
          donor_id: string;
          title: string;
          description?: string | null;
          notes?: string | null;
          category: Category;
          condition: Condition;
          status?: Status;
          photos?: string[];
          nickname: string;
          block?: string | null;
          pickup_info?: string | null;
          interest_clicks?: number;
          reports?: number;
          expires_at?: Timestamp;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["items"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "items_donor_id_fkey"; columns: ["donor_id"]; isOneToOne: false; referencedRelation: "donors"; referencedColumns: ["id"] },
        ];
      };
      item_contacts: {
        Row: {
          item_id: string;
          whatsapp: string | null;
          phone: string | null;
          email: string | null;
          instagram: string | null;
          consent_at: Timestamp;
        };
        Insert: {
          item_id: string;
          whatsapp?: string | null;
          phone?: string | null;
          email?: string | null;
          instagram?: string | null;
          consent_at: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["item_contacts"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "item_contacts_item_id_fkey"; columns: ["item_id"]; isOneToOne: true; referencedRelation: "items"; referencedColumns: ["id"] },
        ];
      };
      impact_stats: {
        Row: { id: boolean; donated: number; contacts: number };
        Insert: { id?: boolean; donated?: number; contacts?: number };
        Update: { id?: boolean; donated?: number; contacts?: number };
        Relationships: [];
      };
      rate_limits: {
        Row: { key: string; window_start: Timestamp; hits: number };
        Insert: { key: string; window_start: Timestamp; hits: number };
        Update: { key?: string; window_start?: Timestamp; hits?: number };
        Relationships: [];
      };
      admin_config: {
        Row: { id: boolean; password_hash: string; recovery_hash: string | null; updated_at: Timestamp };
        Insert: { id?: boolean; password_hash: string; recovery_hash?: string | null; updated_at?: Timestamp };
        Update: { id?: boolean; password_hash?: string; recovery_hash?: string | null; updated_at?: Timestamp };
        Relationships: [];
      };
      photo_cleanup_queue: {
        Row: { path: string; queued_at: Timestamp };
        Insert: { path: string; queued_at?: Timestamp };
        Update: { path?: string; queued_at?: Timestamp };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      normalizar_busca: { Args: { texto: string }; Returns: string };
      registrar_interesse: {
        Args: { p_item_id: string };
        Returns: {
          whatsapp: string | null;
          phone: string | null;
          email: string | null;
          instagram: string | null;
          interest_clicks: number;
        }[];
      };
      consumir_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number };
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type ItemRow = Database["public"]["Tables"]["items"]["Row"];
export type ItemContactRow = Database["public"]["Tables"]["item_contacts"]["Row"];
export type DonorRow = Database["public"]["Tables"]["donors"]["Row"];
