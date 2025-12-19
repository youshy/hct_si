export interface Deal {
  id: string;
  name: string;
  value: number;
  status: 'open' | 'won' | 'lost';
  loss_reason: string | null;
  created_at: Date;
  updated_at: Date;
  synced: boolean;
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
