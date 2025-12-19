# Task: Sentiment Analysis Endpoint (Gemini)

## Overview
Create an API endpoint that analyzes the sentiment of sales notes using Google's Gemini AI model. This is the core AI feature of the application.

## Required Outcome
A working endpoint that:
- Accepts text input
- Returns sentiment score (-1 to 1) and label (positive/neutral/negative)
- Handles errors gracefully (returns neutral on failure)
- Responds quickly (< 2 seconds)

## Prerequisites
- Backend project initialized
- Gemini API key obtained
- Environment variable configured

## Time Estimate
Hour 3-4 of the hackathon

---

## Step-by-Step Implementation

### Step 1: Get Gemini API Key
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create account or sign in with Google
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)
5. Save it securely

### Step 2: Set Environment Variable

**Vercel:**
```bash
vercel env add GEMINI_API_KEY
```

**Cloudflare:**
```bash
wrangler secret put GEMINI_API_KEY
```

**Local `.env`:**
```
GEMINI_API_KEY=AIza...
```

### Step 3: Use Fetch API

No SDK required - we use the Gemini REST API directly via fetch.

### Step 4: Create Sentiment Endpoint

**File:** `api/sentiment.ts`

```typescript
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
    return { score: 0, label: 'neutral' };
  }

  const prompt = `Analyze the sentiment of this sales note. Return ONLY a JSON object with:
- "score": a number from -1 (very negative) to 1 (very positive)
- "label": one of "positive", "neutral", or "negative"

Sales note: "${text}"

JSON response:`;

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
            parts: [{ text: prompt }]
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
    throw new Error('Gemini API failed');
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('No content in response');
  }

  // Extract JSON from response (may include markdown code blocks)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const result = JSON.parse(jsonMatch[0]);

  // Validate and normalize the response
  return {
    score: normalizeScore(result.score),
    label: normalizeLabel(result.label, result.score)
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
```

---

## Alternative: Using @google/generative-ai SDK

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function analyzeSentiment(text: string): Promise<SentimentResponse> {
  const prompt = `Analyze the sentiment of this sales note. Return ONLY a JSON object with score (-1 to 1) and label (positive/neutral/negative).

Sales note: "${text}"`;

  const result = await model.generateContent(prompt);
  const content = result.response.text();

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');

  return JSON.parse(jsonMatch[0]);
}
```

---

## Sentiment Thresholds

| Score Range | Label | UI Color |
|-------------|-------|----------|
| > 0.3 | positive | Green |
| -0.3 to 0.3 | neutral | Gray |
| < -0.3 | negative | Red |

---

## API Contract

**Request:**
```json
POST /api/sentiment
Content-Type: application/json

{
  "text": "Great meeting today, they're excited about the product!"
}
```

**Response (Success):**
```json
{
  "score": 0.8,
  "label": "positive"
}
```

**Response (Error - Returns Neutral):**
```json
{
  "score": 0,
  "label": "neutral"
}
```

---

## Acceptance Criteria

- [ ] Endpoint accepts POST requests with `{ text }` body
- [ ] Returns `{ score, label }` for valid input
- [ ] Score is between -1 and 1
- [ ] Label is one of: positive, neutral, negative
- [ ] Returns neutral (not error) when Gemini fails
- [ ] Returns neutral for empty text (with 400 status)
- [ ] Response time < 3 seconds
- [ ] CORS headers present
- [ ] API key is not exposed in responses

---

## AI Prompt for Claude

```
Create a serverless endpoint that analyzes text sentiment using Google Gemini.

POST /api/sentiment
Request: { text: string }
Response: { score: number, label: 'positive' | 'neutral' | 'negative' }

Implementation:
- Use Gemini API (gemini-2.5-flash for speed/cost)
- Simple prompt: "Analyze the sentiment of this sales note. Return JSON with 'score' (-1 to 1) and 'label' (positive/neutral/negative). Note: {text}"
- Parse the JSON response
- Handle errors gracefully (return neutral on failure)

Environment: GEMINI_API_KEY

Keep it simple - no retries, no caching. Just works.

[Vercel Edge Functions / Cloudflare Workers] style.
```

---

## Testing

```bash
# Test positive sentiment
curl -X POST https://your-api.vercel.app/api/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "Amazing call! They want to sign next week."}'

# Expected: {"score": 0.9, "label": "positive"}

# Test negative sentiment
curl -X POST https://your-api.vercel.app/api/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "They said budget is frozen. Not looking good."}'

# Expected: {"score": -0.7, "label": "negative"}

# Test neutral sentiment
curl -X POST https://your-api.vercel.app/api/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "Had a meeting today. Discussed pricing."}'

# Expected: {"score": 0.1, "label": "neutral"}
```

---

## Emergency Fallback

If Gemini is slow or down, use this mock implementation:

```typescript
// Mock sentiment analysis (for demo if Gemini fails)
function mockSentiment(text: string): SentimentResponse {
  const lowerText = text.toLowerCase();

  // Simple keyword matching
  const positiveWords = ['great', 'excited', 'love', 'amazing', 'yes', 'deal', 'sign'];
  const negativeWords = ['no', 'cancel', 'competitor', 'budget', 'cut', 'delay', 'problem'];

  let score = 0;

  for (const word of positiveWords) {
    if (lowerText.includes(word)) score += 0.3;
  }

  for (const word of negativeWords) {
    if (lowerText.includes(word)) score -= 0.3;
  }

  score = Math.max(-1, Math.min(1, score)); // Clamp

  return {
    score,
    label: score > 0.3 ? 'positive' : score < -0.3 ? 'negative' : 'neutral'
  };
}
```

---

## Cost Considerations

- Gemini 2.5 Flash: Free tier available (15 RPM, 1M tokens/day)
- Average note: ~50 tokens input + 20 tokens output
- For hackathon: completely free within limits
- For production: consider caching or batch processing
