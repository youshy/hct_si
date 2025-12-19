import { jsonResponse, errorResponse, handleOptions } from './lib/api-helpers';

export const config = { runtime: 'edge' };

interface SentimentRequest {
  text: string;
}

interface SentimentResponse {
  score: number;
  label: 'positive' | 'neutral' | 'negative';
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const body: SentimentRequest = await req.json();

    if (!body.text || body.text.trim().length === 0) {
      return errorResponse('Text is required', 400);
    }

    const sentiment = await analyzeSentiment(body.text);
    return jsonResponse(sentiment);

  } catch (error: any) {
    console.error('Sentiment API error:', error);
    // Return neutral on any error (fail gracefully)
    return jsonResponse({
      score: 0,
      label: 'neutral'
    });
  }
}

async function analyzeSentiment(text: string): Promise<SentimentResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('GEMINI_API_KEY not configured');
    return mockSentiment(text);
  }

  const prompt = `Analyze the sentiment of this sales note. Return ONLY a JSON object with:
- "score": a number from -1 (very negative) to 1 (very positive)
- "label": one of "positive", "neutral", or "negative"

Sales note: "${text}"

JSON response:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 256
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      // Fall back to mock sentiment on API errors
      return mockSentiment(text);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return mockSentiment(text);
    }

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return mockSentiment(text);
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate and normalize the response
    return {
      score: normalizeScore(result.score),
      label: normalizeLabel(result.label, result.score)
    };
  } catch (error) {
    console.error('Gemini API exception:', error);
    return mockSentiment(text);
  }
}

// Fallback sentiment analysis using keyword matching
function mockSentiment(text: string): SentimentResponse {
  const lowerText = text.toLowerCase();

  const positiveWords = ['great', 'excited', 'love', 'amazing', 'yes', 'deal', 'sign', 'happy', 'perfect', 'excellent', 'fantastic', 'wonderful'];
  const negativeWords = ['no', 'cancel', 'competitor', 'budget', 'cut', 'delay', 'problem', 'issue', 'concerned', 'worried', 'lost', 'frozen', 'bad'];

  let score = 0;

  for (const word of positiveWords) {
    if (lowerText.includes(word)) score += 0.25;
  }

  for (const word of negativeWords) {
    if (lowerText.includes(word)) score -= 0.25;
  }

  score = Math.max(-1, Math.min(1, score)); // Clamp

  return {
    score: Math.round(score * 100) / 100,
    label: score > 0.3 ? 'positive' : score < -0.3 ? 'negative' : 'neutral'
  };
}

function normalizeScore(score: any): number {
  const num = parseFloat(score);
  if (isNaN(num)) return 0;
  return Math.max(-1, Math.min(1, num)); // Clamp to [-1, 1]
}

function normalizeLabel(
  label: any,
  score: number
): 'positive' | 'neutral' | 'negative' {
  // If valid label provided, use it
  if (['positive', 'neutral', 'negative'].includes(label)) {
    return label;
  }

  // Otherwise derive from score
  if (score > 0.3) return 'positive';
  if (score < -0.3) return 'negative';
  return 'neutral';
}
