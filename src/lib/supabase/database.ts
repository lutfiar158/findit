import type { Report, ReportInput } from "../reports";

export type Database = {
  public: {
    Tables: {
      reports: {
        Row: Report;
        Insert: ReportInput & { user_id: string; image_path?: string | null };
        Update: { status?: "RESOLVED" | "ARCHIVED" };
        Relationships: [];
      };
      profiles: {
        Row: { id: string; display_name: string; created_at: string };
        Insert: { id: string; display_name: string };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
