export interface Deal {
  id: string;
  name: string;
  value: number;
  status: 'open' | 'won' | 'lost';
  loss_reason: 'price' | 'timing' | 'competitor' | 'fit' | 'other' | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  deal_id: string;
  content: string;
  sentiment_score: number | null;
  sentiment_label: 'positive' | 'neutral' | 'negative' | null;
  created_at: string;
}

// For database inserts (without id and timestamps)
export interface NewDeal {
  name: string;
  value: number;
}

export interface NewNote {
  deal_id: string;
  content: string;
  sentiment_score?: number;
  sentiment_label?: 'positive' | 'neutral' | 'negative';
}

