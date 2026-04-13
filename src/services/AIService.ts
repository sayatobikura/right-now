import Anthropic from '@anthropic-ai/sdk';
import type { Note, AIOrganizeResult, AIConnectionResult, AIProvider } from '../types';

function buildOrganizePrompt(): string {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

  return `You are a personal productivity AI. Given a capture (note, idea, task, or tip), classify it and extract structured data.

Today is ${dayName}, ${today}.

Rules:
1. "type": Classify as one of: "task" (actionable, has a verb/outcome), "idea" (creative thought, suggestion), "tip" (advice, best practice), "note" (informational, reference)
2. "tags": 1-5 short lowercase tags describing topics
3. "category": exactly one of: "work", "personal", "ideas", "journal", "reference", "learning"
4. "priority": For tasks only — "high" (urgent/important/deadline soon), "medium" (important but not urgent), "low" (nice-to-have). null for non-tasks.
5. "deadline": If the text mentions a date or relative time (e.g., "by Friday", "next Tuesday", "April 20"), convert to ISO date (YYYY-MM-DD). null if no deadline mentioned.
6. "deadlineReason": Brief explanation of how you derived the deadline (e.g., "from 'by Friday'"). null if no deadline.
7. "suggestedSchedule": For tasks, suggest when to work on it (ISO date). Usually 1 day before deadline, or today if urgent. null for non-tasks or no deadline.

Respond with ONLY valid JSON:
{
  "type": "task",
  "tags": ["tag1", "tag2"],
  "category": "work",
  "priority": "high",
  "deadline": "2026-04-15",
  "deadlineReason": "from 'by Tuesday'",
  "suggestedSchedule": "2026-04-14"
}`;
}

const CONNECTIONS_PROMPT = `You are a note connection assistant. Given a target note and a list of other notes, find the most related notes and explain why they're connected.

Rules:
- Return 0-3 connections (only genuinely related notes)
- Each connection needs the note's ID and a brief reason
- Skip notes that aren't meaningfully related

Respond with ONLY valid JSON:
{ "connections": [{ "noteId": "<id>", "reason": "<why related>" }] }`;

function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '').trim();
  return JSON.parse(cleaned) as T;
}

async function callClaude(apiKey: string, system: string, userMessage: string): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 768,
    system,
    messages: [{ role: 'user', content: userMessage }],
  });
  const block = response.content.find((b) => b.type === 'text');
  return block && block.type === 'text' ? block.text : '';
}

async function callOpenAI(apiKey: string, system: string, userMessage: string): Promise<string> {
  const doRequest = async (): Promise<Response> => {
    return fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 768,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMessage },
        ],
      }),
    });
  };

  let response = await doRequest();
  if (response.status === 429) {
    await new Promise((r) => setTimeout(r, 3000));
    response = await doRequest();
  }

  if (!response.ok) {
    const status = response.status;
    if (status === 401) throw new Error('Invalid API key. Please check your key in settings.');
    if (status === 429) throw new Error('Rate limited. Please wait a moment and try again.');
    throw new Error(`OpenAI API error (${status})`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function callAI(apiKey: string, provider: AIProvider, system: string, userMessage: string): Promise<string> {
  if (provider === 'openai') {
    return callOpenAI(apiKey, system, userMessage);
  }
  return callClaude(apiKey, system, userMessage);
}

export async function organizeNote(
  content: string,
  apiKey: string,
  provider: AIProvider
): Promise<{ result: AIOrganizeResult | null; error: string | null }> {
  try {
    const prompt = buildOrganizePrompt();
    const text = await callAI(apiKey, provider, prompt, `Capture:\n${content}`);
    if (!text) return { result: null, error: null };
    return { result: parseJSON<AIOrganizeResult>(text), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI organization failed';
    console.error('AI organize error:', err);
    return { result: null, error: message };
  }
}

export async function findConnections(
  targetNote: Note,
  allNotes: Note[],
  apiKey: string,
  provider: AIProvider
): Promise<AIConnectionResult[]> {
  const otherNotes = allNotes.filter((n) => n.id !== targetNote.id);
  if (otherNotes.length === 0) return [];

  const noteList = otherNotes
    .slice(0, 20)
    .map((n) => `[id: ${n.id}] "${n.content.slice(0, 100)}" (tags: ${n.tags.join(', ') || 'none'})`)
    .join('\n');

  const userMessage = `Target note:\n"${targetNote.content}"\n\nOther notes:\n${noteList}`;

  try {
    const text = await callAI(apiKey, provider, CONNECTIONS_PROMPT, userMessage);
    if (!text) return [];
    const result = parseJSON<{ connections: AIConnectionResult[] }>(text);
    return result.connections;
  } catch (err) {
    console.error('AI connections error:', err);
    return [];
  }
}
