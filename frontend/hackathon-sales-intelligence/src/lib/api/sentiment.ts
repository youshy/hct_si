export interface SentimentResult {
  score: number;
  label: 'positive' | 'neutral' | 'negative';
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  try {
    const response = await fetch('/api/sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      return { score: 0, label: 'neutral' };
    }

    return response.json();
  } catch {
    return { score: 0, label: 'neutral' };
  }
}
