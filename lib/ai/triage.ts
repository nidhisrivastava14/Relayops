export type IncidentCategory =
  | 'Backend'
  | 'Frontend'
  | 'Infrastructure'
  | 'Authentication'
  | 'Database'
  | 'Networking'
  | 'Deployment'
  | 'Feature Request'
  | 'Other';

export interface TriageResult {
  category: IncidentCategory;
  priority: 'Low' | 'Medium' | 'High';
  summary: string;
}

const ALLOWED_CATEGORIES: IncidentCategory[] = [
  'Backend',
  'Frontend',
  'Infrastructure',
  'Authentication',
  'Database',
  'Networking',
  'Deployment',
  'Feature Request',
  'Other',
];

/**
 * Triages an incoming incident report text using Gemini 1.5 Flash.
 * Enforces an 8-second timeout and falls back to default values if Gemini is slow or unavailable.
 */
export async function triageIncident(inputText: string): Promise<TriageResult> {
  const fallbackResult: TriageResult = {
    category: 'Other',
    priority: 'Medium',
    summary: inputText.length > 150 ? `${inputText.slice(0, 147)}...` : inputText,
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Gemini Triage] GEMINI_API_KEY is not defined. Using fallback values.');
    return fallbackResult;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const prompt = `You are a triage assistant for an Incident Manager.
Analyze this incident report and classify it:
"${inputText}"

You MUST respond with a JSON object matching this schema:
{
  "category": "Backend" | "Frontend" | "Infrastructure" | "Authentication" | "Database" | "Networking" | "Deployment" | "Feature Request" | "Other",
  "priority": "Low" | "Medium" | "High",
  "summary": "One sentence summarizing the incident"
}

Allowed Categories:
- Backend
- Frontend
- Infrastructure
- Authentication
- Database
- Networking
- Deployment
- Feature Request
- Other

Rules:
1. You MUST choose exactly one category from the allowed categories list. Never invent new categories.
2. You MUST return ONLY the raw JSON object. No explanations, no markdown code fences, and no introductory prose.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 8000); // 8-second hard timeout

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text();
      console.warn(`[Gemini Triage] API returned status ${response.status}: ${errBody}. Falling back.`);
      return fallbackResult;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.warn('[Gemini Triage] Empty response text from Gemini. Falling back.');
      return fallbackResult;
    }

    interface GeminiParsed {
      category?: unknown;
      priority?: unknown;
      summary?: unknown;
    }
    let parsed: GeminiParsed;
    try {
      parsed = JSON.parse(rawText.trim()) as GeminiParsed;
    } catch (parseErr) {
      console.warn('[Gemini Triage] Failed to parse JSON response from Gemini. Raw text:', rawText, parseErr);
      return fallbackResult;
    }

    // Validate the fields returned by Gemini
    const categoryStr = String(parsed.category || '');
    const category = ALLOWED_CATEGORIES.includes(categoryStr as IncidentCategory)
      ? (categoryStr as IncidentCategory)
      : 'Other';

    const priorityStr = String(parsed.priority || '');
    const priority = ['Low', 'Medium', 'High'].includes(priorityStr)
      ? (priorityStr as 'Low' | 'Medium' | 'High')
      : 'Medium';

    const summary = parsed.summary ? String(parsed.summary) : fallbackResult.summary;

    console.log('[Gemini Triage] Triage completed successfully:', { category, priority, summary });

    return {
      category,
      priority,
      summary,
    };

  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.name === 'AbortError') {
      console.warn('[Gemini Triage] Request timed out after 8000ms. Falling back.');
    } else {
      console.warn('[Gemini Triage] Unexpected fetch error:', err.message);
    }
    return fallbackResult;
  }
}
