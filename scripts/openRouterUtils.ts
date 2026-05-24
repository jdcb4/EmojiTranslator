import { existsSync, readFileSync } from 'node:fs';

export function parseEnvFile(path: string) {
  if (!existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        const key =
          separator === -1 ? line.trim() : line.slice(0, separator).trim();
        const rawValue = separator === -1 ? '' : line.slice(separator + 1);
        const value = rawValue.trim().replace(/^['"]|['"]$/g, '');

        return [key, value] as const;
      }),
  );
}

export function openRouterApiKey() {
  return (
    process.env.OPEN_ROUTER_API_KEY ?? parseEnvFile('.env').OPEN_ROUTER_API_KEY
  );
}

export function parseJsonObject<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);

    if (fenced) {
      return JSON.parse(fenced[1] ?? '{}') as T;
    }

    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');

    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(raw.slice(start, end + 1)) as T;
    }

    throw new Error('Response did not contain a JSON object.');
  }
}

export async function openRouterJson<T>({
  apiKey,
  model,
  title,
  system,
  user,
}: {
  apiKey: string;
  model: string;
  title: string;
  system: string;
  user: string;
}) {
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'x-title': title,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: system,
          },
          {
            role: 'user',
            content: user,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenRouter response did not include message content.');
  }

  return parseJsonObject<T>(content);
}
