export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      Account: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          providerAccountId: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          userId: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id: string
          id_token?: string | null
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          userId: string
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      CityStop: {
        Row: {
          arrival: string
          departure: string
          id: string
          lat: number
          lng: number
          name: string
          notes: string | null
          order: number
          tripId: string
        }
        Insert: {
          arrival: string
          departure: string
          id: string
          lat: number
          lng: number
          name: string
          notes?: string | null
          order: number
          tripId: string
        }
        Update: {
          arrival?: string
          departure?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          notes?: string | null
          order?: number
          tripId?: string
        }
        Relationships: [
          {
            foreignKeyName: "CityStop_tripId_fkey"
            columns: ["tripId"]
            isOneToOne: false
            referencedRelation: "Trip"
            referencedColumns: ["id"]
          },
        ]
      }
      Expense: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["ExpenseCategory"]
          createdAt: string
          currency: string
          id: string
          notes: string | null
          payerId: string
          tripId: string
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["ExpenseCategory"]
          createdAt?: string
          currency: string
          id: string
          notes?: string | null
          payerId: string
          tripId: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["ExpenseCategory"]
          createdAt?: string
          currency?: string
          id?: string
          notes?: string | null
          payerId?: string
          tripId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Expense_payerId_fkey"
            columns: ["payerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Expense_tripId_fkey"
            columns: ["tripId"]
            isOneToOne: false
            referencedRelation: "Trip"
            referencedColumns: ["id"]
          },
        ]
      }
      ItineraryItem: {
        Row: {
          cost: number | null
          day: string
          endTime: string | null
          id: string
          kind: Database["public"]["Enums"]["ItineraryItemKind"]
          notes: string | null
          poiId: string | null
          startTime: string | null
          title: string
          tripId: string
        }
        Insert: {
          cost?: number | null
          day: string
          endTime?: string | null
          id: string
          kind: Database["public"]["Enums"]["ItineraryItemKind"]
          notes?: string | null
          poiId?: string | null
          startTime?: string | null
          title: string
          tripId: string
        }
        Update: {
          cost?: number | null
          day?: string
          endTime?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["ItineraryItemKind"]
          notes?: string | null
          poiId?: string | null
          startTime?: string | null
          title?: string
          tripId?: string
        }
        Relationships: [
          {
            foreignKeyName: "ItineraryItem_poiId_fkey"
            columns: ["poiId"]
            isOneToOne: false
            referencedRelation: "Poi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ItineraryItem_tripId_fkey"
            columns: ["tripId"]
            isOneToOne: false
            referencedRelation: "Trip"
            referencedColumns: ["id"]
          },
        ]
      }
      Poi: {
        Row: {
          cityStopId: string | null
          cost: number | null
          description: string | null
          duration: string | null
          externalId: string | null
          id: string
          lat: number
          lng: number
          name: string
          photoUrl: string | null
          priceLevel: number | null
          rating: number | null
          tags: string[] | null
          tripId: string
          websiteUrl: string | null
        }
        Insert: {
          cityStopId?: string | null
          cost?: number | null
          description?: string | null
          duration?: string | null
          externalId?: string | null
          id: string
          lat: number
          lng: number
          name: string
          photoUrl?: string | null
          priceLevel?: number | null
          rating?: number | null
          tags?: string[] | null
          tripId: string
          websiteUrl?: string | null
        }
        Update: {
          cityStopId?: string | null
          cost?: number | null
          description?: string | null
          duration?: string | null
          externalId?: string | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          photoUrl?: string | null
          priceLevel?: number | null
          rating?: number | null
          tags?: string[] | null
          tripId?: string
          websiteUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Poi_cityStopId_fkey"
            columns: ["cityStopId"]
            isOneToOne: false
            referencedRelation: "CityStop"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Poi_tripId_fkey"
            columns: ["tripId"]
            isOneToOne: false
            referencedRelation: "Trip"
            referencedColumns: ["id"]
          },
        ]
      }
      Session: {
        Row: {
          expires: string
          id: string
          sessionToken: string
          userId: string
        }
        Insert: {
          expires: string
          id: string
          sessionToken: string
          userId: string
        }
        Update: {
          expires?: string
          id?: string
          sessionToken?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      SplitShare: {
        Row: {
          expenseId: string
          id: string
          settled: boolean
          share: number
          userId: string
        }
        Insert: {
          expenseId: string
          id: string
          settled?: boolean
          share: number
          userId: string
        }
        Update: {
          expenseId?: string
          id?: string
          settled?: boolean
          share?: number
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "SplitShare_expenseId_fkey"
            columns: ["expenseId"]
            isOneToOne: false
            referencedRelation: "Expense"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "SplitShare_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Subscription: {
        Row: {
          active: boolean
          currentPeriodEnd: string | null
          id: string
          provider: Database["public"]["Enums"]["SubscriptionProvider"]
          providerId: string
          tier: Database["public"]["Enums"]["SubscriptionTier"]
          userId: string
        }
        Insert: {
          active?: boolean
          currentPeriodEnd?: string | null
          id: string
          provider: Database["public"]["Enums"]["SubscriptionProvider"]
          providerId: string
          tier?: Database["public"]["Enums"]["SubscriptionTier"]
          userId: string
        }
        Update: {
          active?: boolean
          currentPeriodEnd?: string | null
          id?: string
          provider?: Database["public"]["Enums"]["SubscriptionProvider"]
          providerId?: string
          tier?: Database["public"]["Enums"]["SubscriptionTier"]
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Subscription_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Trip: {
        Row: {
          budgetCap: number | null
          createdAt: string
          currency: string
          endDate: string
          id: string
          ownerId: string
          publicId: string | null
          startDate: string
          title: string
          updatedAt: string
          visibility: Database["public"]["Enums"]["TripVisibility"]
        }
        Insert: {
          budgetCap?: number | null
          createdAt?: string
          currency?: string
          endDate: string
          id: string
          ownerId: string
          publicId?: string | null
          startDate: string
          title: string
          updatedAt: string
          visibility?: Database["public"]["Enums"]["TripVisibility"]
        }
        Update: {
          budgetCap?: number | null
          createdAt?: string
          currency?: string
          endDate?: string
          id?: string
          ownerId?: string
          publicId?: string | null
          startDate?: string
          title?: string
          updatedAt?: string
          visibility?: Database["public"]["Enums"]["TripVisibility"]
        }
        Relationships: [
          {
            foreignKeyName: "Trip_ownerId_fkey"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      TripMember: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["TripRole"]
          status: string
          tripId: string
          userId: string
        }
        Insert: {
          id: string
          role?: Database["public"]["Enums"]["TripRole"]
          status?: string
          tripId: string
          userId: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["TripRole"]
          status?: string
          tripId?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "TripMember_tripId_fkey"
            columns: ["tripId"]
            isOneToOne: false
            referencedRelation: "Trip"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TripMember_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          email: string | null
          emailVerified: string | null
          homeCity: string | null
          homeCurrency: string
          id: string
          image: string | null
          interests: string[] | null
          name: string | null
          role: Database["public"]["Enums"]["UserRole"]
          userName: string | null
        }
        Insert: {
          email?: string | null
          emailVerified?: string | null
          homeCity?: string | null
          homeCurrency?: string
          id: string
          image?: string | null
          interests?: string[] | null
          name?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          userName?: string | null
        }
        Update: {
          email?: string | null
          emailVerified?: string | null
          homeCity?: string | null
          homeCurrency?: string
          id?: string
          image?: string | null
          interests?: string[] | null
          name?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          userName?: string | null
        }
        Relationships: []
      }
      VerificationToken: {
        Row: {
          expires: string
          identifier: string
          token: string
        }
        Insert: {
          expires: string
          identifier: string
          token: string
        }
        Update: {
          expires?: string
          identifier?: string
          token?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      signup_with_username: {
        Args: { email: string; password: string; username: string }
        Returns: Json
      }
    }
    Enums: {
      ExpenseCategory:
        | "TRANSPORT"
        | "STAY"
        | "FOOD"
        | "ENTERTAINMENT"
        | "SHOPPING"
        | "MISC"
        | "OTHER"
      ItineraryItemKind:
        | "MOVE"
        | "STAY"
        | "FOOD"
        | "SIGHT"
        | "ACTIVITY"
        | "REST"
      SubscriptionProvider: "STRIPE" | "RAZORPAY"
      SubscriptionTier: "FREE" | "PREMIUM"
      TripRole: "OWNER" | "EDITOR" | "VIEWER"
      TripVisibility: "PRIVATE" | "LINK" | "PUBLIC"
      UserRole: "USER" | "ADMIN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ExpenseCategory: [
        "TRANSPORT",
        "STAY",
        "FOOD",
        "ENTERTAINMENT",
        "SHOPPING",
        "MISC",
        "OTHER",
      ],
      ItineraryItemKind: ["MOVE", "STAY", "FOOD", "SIGHT", "ACTIVITY", "REST"],
      SubscriptionProvider: ["STRIPE", "RAZORPAY"],
      SubscriptionTier: ["FREE", "PREMIUM"],
      TripRole: ["OWNER", "EDITOR", "VIEWER"],
      TripVisibility: ["PRIVATE", "LINK", "PUBLIC"],
      UserRole: ["USER", "ADMIN"],
    },
  },
} as const
