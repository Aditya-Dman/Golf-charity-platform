export type PlanType = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "inactive" | "canceled" | "lapsed";
export type DrawMode = "random" | "weighted";
export type DrawStatus = "simulated" | "published";
export type VerificationStatus = "pending" | "approved" | "rejected";
export type PaymentStatus = "pending" | "paid";

export type Charity = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  featured: boolean;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  renewal_date: string | null;
  charity_id: string | null;
  charity_percent: number;
};

export type Score = {
  id: string;
  user_id: string;
  score: number;
  score_date: string;
  created_at: string;
};
