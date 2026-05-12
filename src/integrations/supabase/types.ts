export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      financial_methods: {
        Row: {
          account_holder: string | null;
          bank_name: string | null;
          branch_name: string | null;
          copyable: boolean;
          created_at: string;
          hidden: boolean;
          id: string;
          label: string;
          note: string | null;
          position: number;
          routing_number: string | null;
          swift_code: string | null;
          type: string;
          updated_at: string;
          user_id: string;
          value: string;
        };
        Insert: {
          account_holder?: string | null;
          bank_name?: string | null;
          branch_name?: string | null;
          copyable?: boolean;
          created_at?: string;
          hidden?: boolean;
          id?: string;
          label?: string;
          note?: string | null;
          position?: number;
          routing_number?: string | null;
          swift_code?: string | null;
          type?: string;
          updated_at?: string;
          user_id: string;
          value?: string;
        };
        Update: {
          account_holder?: string | null;
          bank_name?: string | null;
          branch_name?: string | null;
          copyable?: boolean;
          created_at?: string;
          hidden?: boolean;
          id?: string;
          label?: string;
          note?: string | null;
          position?: number;
          routing_number?: string | null;
          swift_code?: string | null;
          type?: string;
          updated_at?: string;
          user_id?: string;
          value?: string;
        };
        Relationships: [];
      };
      link_cards: {
        Row: {
          author: string | null;
          bg_color: string | null;
          content: string;
          created_at: string;
          cta_label: string | null;
          cta_url: string | null;
          group_id: string | null;
          hidden: boolean;
          id: string;
          image_url: string | null;
          kind: string;
          position: number;
          text_color: string | null;
          title: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          author?: string | null;
          bg_color?: string | null;
          content?: string;
          created_at?: string;
          cta_label?: string | null;
          cta_url?: string | null;
          group_id?: string | null;
          hidden?: boolean;
          id?: string;
          image_url?: string | null;
          kind?: string;
          position?: number;
          text_color?: string | null;
          title?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          author?: string | null;
          bg_color?: string | null;
          content?: string;
          created_at?: string;
          cta_label?: string | null;
          cta_url?: string | null;
          group_id?: string | null;
          hidden?: boolean;
          id?: string;
          image_url?: string | null;
          kind?: string;
          position?: number;
          text_color?: string | null;
          title?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      link_clicks: {
        Row: {
          clicked_at: string;
          id: string;
          link_id: string | null;
          link_type: string;
          platform: string | null;
          user_id: string;
        };
        Insert: {
          clicked_at?: string;
          id?: string;
          link_id?: string | null;
          link_type?: string;
          platform?: string | null;
          user_id: string;
        };
        Update: {
          clicked_at?: string;
          id?: string;
          link_id?: string | null;
          link_type?: string;
          platform?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      link_groups: {
        Row: {
          accent_from: string | null;
          accent_to: string | null;
          created_at: string;
          font_family: string | null;
          hidden: boolean;
          id: string;
          position: number;
          title: string;
          user_id: string;
        };
        Insert: {
          accent_from?: string | null;
          accent_to?: string | null;
          created_at?: string;
          font_family?: string | null;
          hidden?: boolean;
          id?: string;
          position?: number;
          title?: string;
          user_id: string;
        };
        Update: {
          accent_from?: string | null;
          accent_to?: string | null;
          created_at?: string;
          font_family?: string | null;
          hidden?: boolean;
          id?: string;
          position?: number;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      links: {
        Row: {
          created_at: string;
          emoji: string | null;
          group_id: string | null;
          hidden: boolean;
          id: string;
          label: string;
          platform: string | null;
          position: number;
          type: string;
          user_id: string;
          value: string;
        };
        Insert: {
          created_at?: string;
          emoji?: string | null;
          group_id?: string | null;
          hidden?: boolean;
          id?: string;
          label?: string;
          platform?: string | null;
          position?: number;
          type?: string;
          user_id: string;
          value?: string;
        };
        Update: {
          created_at?: string;
          emoji?: string | null;
          group_id?: string | null;
          hidden?: boolean;
          id?: string;
          label?: string;
          platform?: string | null;
          position?: number;
          type?: string;
          user_id?: string;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "links_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "link_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      pro_requests: {
        Row: {
          amount: number | null;
          created_at: string;
          currency: string | null;
          id: string;
          kind: string;
          message: string | null;
          payment_ref: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          amount?: number | null;
          created_at?: string;
          currency?: string | null;
          id?: string;
          kind?: string;
          message?: string | null;
          payment_ref?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          amount?: number | null;
          created_at?: string;
          currency?: string | null;
          id?: string;
          kind?: string;
          message?: string | null;
          payment_ref?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          accent_color: string;
          avatar_shape: string;
          avatar_url: string | null;
          background_style: string;
          bio: string | null;
          branding_hidden: boolean;
          button_style: string;
          card_radius: string;
          cover_url: string | null;
          created_at: string;
          cta_enabled: boolean;
          cta_label: string;
          cta_url: string | null;
          custom_accent_from: string | null;
          custom_accent_to: string | null;
          display_name: string | null;
          financial_enabled: boolean;
          financial_title: string;
          font_family: string;
          id: string;
          is_pro: boolean;
          pro_until: string | null;
          public_enabled: boolean;
          referral_code: string | null;
          referred_by: string | null;
          share_visibility: string;
          theme: string;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          accent_color?: string;
          avatar_shape?: string;
          avatar_url?: string | null;
          background_style?: string;
          bio?: string | null;
          branding_hidden?: boolean;
          button_style?: string;
          card_radius?: string;
          cover_url?: string | null;
          created_at?: string;
          cta_enabled?: boolean;
          cta_label?: string;
          cta_url?: string | null;
          custom_accent_from?: string | null;
          custom_accent_to?: string | null;
          display_name?: string | null;
          financial_enabled?: boolean;
          financial_title?: string;
          font_family?: string;
          id: string;
          is_pro?: boolean;
          pro_until?: string | null;
          public_enabled?: boolean;
          referral_code?: string | null;
          referred_by?: string | null;
          share_visibility?: string;
          theme?: string;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          accent_color?: string;
          avatar_shape?: string;
          avatar_url?: string | null;
          background_style?: string;
          bio?: string | null;
          branding_hidden?: boolean;
          button_style?: string;
          card_radius?: string;
          cover_url?: string | null;
          created_at?: string;
          cta_enabled?: boolean;
          cta_label?: string;
          cta_url?: string | null;
          custom_accent_from?: string | null;
          custom_accent_to?: string | null;
          display_name?: string | null;
          financial_enabled?: boolean;
          financial_title?: string;
          font_family?: string;
          id?: string;
          is_pro?: boolean;
          pro_until?: string | null;
          public_enabled?: boolean;
          referral_code?: string | null;
          referred_by?: string | null;
          share_visibility?: string;
          theme?: string;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          created_at: string;
          id: string;
          referred_id: string;
          referrer_id: string;
          rewarded: boolean;
        };
        Insert: {
          created_at?: string;
          id?: string;
          referred_id: string;
          referrer_id: string;
          rewarded?: boolean;
        };
        Update: {
          created_at?: string;
          id?: string;
          referred_id?: string;
          referrer_id?: string;
          rewarded?: boolean;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_set_pro: {
        Args: { _is_pro: boolean; _user_id: string };
        Returns: undefined;
      };
      approve_pro_request: { Args: { _request_id: string }; Returns: undefined };
      cancel_pro_request: { Args: { _request_id: string }; Returns: undefined };
      expire_pro_users: { Args: never; Returns: undefined };
      extend_pro_request: {
        Args: { _days?: number; _request_id: string };
        Returns: undefined;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_user_pro: { Args: { _user_id: string }; Returns: boolean };
      pad_username_unique: {
        Args: { _uid: string; _username: string };
        Returns: string;
      };
      reject_pro_request: { Args: { _request_id: string }; Returns: undefined };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const;
