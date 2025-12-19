export type DealStage = 'prospect' | 'qualified' | 'proposal' | 'negotiation' | 'closing';

export interface Deal {
  id: string;
  name: string;
  value: number;
  status: 'open' | 'won' | 'lost';
  loss_reason: string | null;
  created_at: Date;
  updated_at: Date;
  synced: boolean;
  // v4 fields
  archived: boolean;
  expected_close_date: Date | null;
  customer_name: string | null;
  stage: DealStage;
}

export interface Note {
  id: string;
  deal_id: string;
  content: string;
  sentiment_score: number | null;
  sentiment_label: 'positive' | 'neutral' | 'negative' | null;
  created_at: Date;
  synced: boolean;
}

// Stage display info
export const STAGE_INFO: Record<DealStage, { label: string; color: string; order: number }> = {
  prospect: { label: 'Prospect', color: '#94A3B8', order: 1 },
  qualified: { label: 'Qualified', color: '#60A5FA', order: 2 },
  proposal: { label: 'Proposal', color: '#A78BFA', order: 3 },
  negotiation: { label: 'Negotiation', color: '#FBBF24', order: 4 },
  closing: { label: 'Closing', color: '#F97316', order: 5 }
};
