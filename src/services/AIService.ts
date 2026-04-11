import Anthropic from '@anthropic-ai/sdk';
import type { Task, AIRankingResult, AIProvider } from '../types';
import { getTimezone } from './SettingsService';

const SYSTEM_PROMPT = `You are a personal productivity assistant. Given a list of tasks with their priorities, categories, and deadlines, rank them by what the user should focus on RIGHT NOW.

Consider:
1. Deadline urgency (overdue > due today > due soon > no deadline)
2. Priority level (high > medium > low)
3. Time of day context (morning = deep work, afternoon = meetings/admin, evening = personal/wind-down)
4. Day of week (weekday = bias toward work, weekend = bias toward personal/self-dev)
5. Category fit for the time context

Respond with ONLY valid JSON in this exact format:
{
  "suggestions": [
    { "taskId": "<id>", "reasoning": "<1 sentence why>", "rank": 1 },
    { "taskId": "<id>", "reasoning": "<1 sentence why>", "rank": 2 }
  ]
}

Rank all open tasks. The #1 ranked task is what the user should do RIGHT NOW.`;

function getTimeOfDay(hour: number): string {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function buildUserMessage(tasks: Task[]): string {
  const now = new Date();
  const timezone = getTimezone();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const timeOfDay = getTimeOfDay(now.getHours());

  const taskLines = tasks
    .map(
      (t) =>
        `- [id: ${t.id}] "${t.title}" | priority: ${t.priority} | category: ${t.category} | deadline: ${t.deadline || 'none'}`
    )
    .join('\n');

  return `Current time: ${now.toISOString()}
Timezone: ${timezone}
Day: ${dayName}
Time of day: ${timeOfDay}

Tasks:
${taskLines}`;
}

function parseAIResponse(text: string): AIRankingResult {
  const cleaned = text.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '').trim();
  const parsed = JSON.parse(cleaned) as { suggestions: AIRankingResult['suggestions'] };

  return {
    suggestions: parsed.suggestions,
    rankedAt: new Date().toISOString(),
    error: null,
  };
}

async function rankWithClaude(
  openTasks: Task[],
  apiKey: string
): Promise<AIRankingResult> {
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(openTasks) }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return { suggestions: [], rankedAt: new Date().toISOString(), error: 'No text response from AI' };
  }

  return parseAIResponse(textBlock.text);
}

async function rankWithOpenAI(
  openTasks: Task[],
  apiKey: string
): Promise<AIRankingResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(openTasks) },
      ],
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 401) throw new Error('Invalid API key. Please check your key in settings.');
    if (status === 429) throw new Error('Rate limited. Please wait a moment and try again.');
    throw new Error(`OpenAI API error (${status})`);
  }

  const data = await response.json();
  const text: string = data.choices?.[0]?.message?.content ?? '';
  if (!text) {
    return { suggestions: [], rankedAt: new Date().toISOString(), error: 'No text response from AI' };
  }

  return parseAIResponse(text);
}

export async function rankTasks(
  tasks: Task[],
  apiKey: string,
  provider: AIProvider
): Promise<AIRankingResult> {
  const openTasks = tasks.filter((t) => t.status === 'open');

  if (openTasks.length === 0) {
    return { suggestions: [], rankedAt: new Date().toISOString(), error: null };
  }

  try {
    if (provider === 'openai') {
      return await rankWithOpenAI(openTasks, apiKey);
    }
    return await rankWithClaude(openTasks, apiKey);
  } catch (err: unknown) {
    let message = 'An unexpected error occurred';

    if (err instanceof Anthropic.AuthenticationError) {
      message = 'Invalid API key. Please check your key in settings.';
    } else if (err instanceof Anthropic.RateLimitError) {
      message = 'Rate limited. Please wait a moment and try again.';
    } else if (err instanceof Anthropic.APIConnectionError) {
      message = 'Unable to reach API. Check your connection.';
    } else if (err instanceof SyntaxError) {
      message = 'Failed to parse AI response. Please try again.';
    } else if (err instanceof Error) {
      message = err.message;
    }

    return { suggestions: [], rankedAt: new Date().toISOString(), error: message };
  }
}
