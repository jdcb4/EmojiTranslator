import { useEffect, useState } from 'react';

import { Body, Caption, Heading, Subtle } from '../../components/ui/typography';
import type {
  ConversionDifficulty,
  ConversionMode,
  ConversionResult,
} from '../../types/conversion';

const SAMPLE_TITLES = [
  'The Lion King',
  'Spider-Man',
  'Ocean’s Eleven',
  'I, Robot',
  'Before Sunrise',
  'Back to the Future',
];

const MODES: Array<{ label: string; value: ConversionMode }> = [
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'Strict title', value: 'strict' },
  { label: 'Rebus', value: 'rebus' },
];

const DIFFICULTIES: Array<{ label: string; value: ConversionDifficulty }> = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
];

const fieldClass =
  'w-full rounded-default border border-border-default bg-surface-sunken px-3 py-2 text-body text-text-primary outline-none transition focus:border-accent-primary';

const buttonClass =
  'rounded-default border border-border-strong bg-accent-primary px-4 py-2 text-body-sm font-semibold text-text-on-accent transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

async function convertWithApi(
  title: string,
  mode: ConversionMode,
  difficulty: ConversionDifficulty,
) {
  const response = await fetch('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      options: { mode, targetDifficulty: difficulty },
    }),
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return (await response.json()) as ConversionResult;
}

async function convertLocally(
  title: string,
  mode: ConversionMode,
  difficulty: ConversionDifficulty,
) {
  const { convertMovieTitleToEmoji } =
    await import('../../domain/converter/convertTitle');

  return convertMovieTitleToEmoji(title, {
    mode,
    targetDifficulty: difficulty,
  });
}

export function ConverterPage() {
  const [title, setTitle] = useState('The Lion King');
  const [mode, setMode] = useState<ConversionMode>('hybrid');
  const [difficulty, setDifficulty] = useState<ConversionDifficulty>('medium');
  const [useApi, setUseApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const [apiBusy, setApiBusy] = useState(false);
  const [apiResult, setApiResult] = useState<ConversionResult | null>(null);
  const [localResult, setLocalResult] = useState<ConversionResult | null>(null);

  useEffect(() => {
    let active = true;

    void convertLocally(title, mode, difficulty).then((nextResult) => {
      if (!active) {
        return;
      }

      setLocalResult(nextResult);
    });

    return () => {
      active = false;
    };
  }, [difficulty, mode, title]);

  const result = apiResult ?? localResult;
  const confidenceLabel = result
    ? `${Math.round(result.confidence * 100)}%`
    : 'Loading';

  async function handleConvert() {
    setApiStatus(null);

    if (!useApi) {
      setApiResult(null);
      return;
    }

    setApiBusy(true);

    try {
      setApiResult(await convertWithApi(title, mode, difficulty));
      setApiStatus('API response');
    } catch {
      setApiResult(null);
      setApiStatus('API unavailable; local engine used');
    } finally {
      setApiBusy(false);
    }
  }

  return (
    <main className="min-h-dvh bg-surface-base text-text-primary">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <section className="space-y-6">
          <div className="space-y-3">
            <Caption>EmojiTranslator</Caption>
            <Heading display level={1}>
              Movie Title Emoji Converter
            </Heading>
          </div>

          <form
            className="space-y-5 rounded-default border border-border-subtle bg-surface-raised p-5"
            onSubmit={(event) => {
              event.preventDefault();
              void handleConvert();
            }}
          >
            <label className="block space-y-2">
              <span className="text-body-sm font-medium text-text-secondary">
                Title
              </span>
              <input
                className={fieldClass}
                onChange={(event) => setTitle(event.target.value)}
                value={title}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-body-sm font-medium text-text-secondary">
                  Mode
                </span>
                <select
                  className={fieldClass}
                  onChange={(event) => {
                    setApiResult(null);
                    setMode(event.target.value as ConversionMode);
                  }}
                  value={mode}
                >
                  {MODES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-body-sm font-medium text-text-secondary">
                  Difficulty
                </span>
                <select
                  className={fieldClass}
                  onChange={(event) => {
                    setApiResult(null);
                    setDifficulty(event.target.value as ConversionDifficulty);
                  }}
                  value={difficulty}
                >
                  {DIFFICULTIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex items-center gap-3 text-body-sm text-text-secondary">
              <input
                checked={useApi}
                className="size-4 accent-accent-primary"
                onChange={(event) => {
                  setApiResult(null);
                  setUseApi(event.target.checked);
                }}
                type="checkbox"
              />
              Use API endpoint
            </label>

            <button className={buttonClass} disabled={apiBusy} type="submit">
              {apiBusy ? 'Converting' : 'Convert'}
            </button>
          </form>

          <div className="space-y-3">
            <Caption>Samples</Caption>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_TITLES.map((sample) => (
                <button
                  className="rounded-default border border-border-default bg-surface-raised px-3 py-2 text-body-sm text-text-secondary transition hover:border-accent-primary hover:text-text-primary"
                  key={sample}
                  onClick={() => {
                    setApiResult(null);
                    setTitle(sample);
                  }}
                  type="button"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-default border border-border-subtle bg-surface-raised p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <Caption>{apiStatus ?? 'Local deterministic engine'}</Caption>
                <div className="text-display font-semibold leading-none">
                  {result ? (result.emoji ?? 'Needs review') : 'Loading'}
                </div>
              </div>
              <div className="rounded-default border border-border-default bg-surface-sunken px-3 py-2 text-right">
                <Subtle className="m-0">Confidence</Subtle>
                <Body className="m-0 font-semibold">{confidenceLabel}</Body>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric label="Mode" value={result?.modeUsed ?? '-'} />
              <Metric
                label="Accepted"
                value={result ? (result.accepted ? 'Yes' : 'Review') : '-'}
              />
              <Metric
                label="Tokens"
                value={String(result?.tokens.length ?? 0)}
              />
            </div>
          </div>

          {result && result.warnings.length > 0 ? (
            <div className="rounded-default border border-border-default bg-surface-raised p-4">
              <Caption>Warnings</Caption>
              <ul className="mt-3 space-y-2 text-body-sm text-text-secondary">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result ? (
            <div className="rounded-default border border-border-subtle bg-surface-raised p-5">
              <Caption>Rules Used</Caption>
              <div className="mt-4 divide-y divide-border-subtle">
                {result.tokens.map((token) => (
                  <div
                    className="grid gap-2 py-3 sm:grid-cols-[7rem_minmax(0,1fr)_auto]"
                    key={`${token.token}-${token.ruleUsed}`}
                  >
                    <Body className="m-0 font-semibold">{token.token}</Body>
                    <Subtle className="m-0">{token.explanation}</Subtle>
                    <span className="text-h3">{token.emoji ?? '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {result && result.alternatives.length > 0 ? (
            <div className="rounded-default border border-border-subtle bg-surface-raised p-5">
              <Caption>Alternatives</Caption>
              <div className="mt-4 grid gap-3">
                {result.alternatives.map((alternative) => (
                  <div
                    className="flex items-center justify-between gap-4 rounded-compact border border-border-subtle bg-surface-sunken px-3 py-2"
                    key={`${alternative.modeUsed}-${alternative.emoji ?? 'none'}`}
                  >
                    <Body className="m-0">
                      {alternative.emoji ?? 'No clue'}
                    </Body>
                    <Subtle className="m-0">
                      {alternative.modeUsed} ·{' '}
                      {Math.round(alternative.confidence * 100)}%
                    </Subtle>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-default border border-border-subtle bg-surface-raised p-5">
            <Caption>API</Caption>
            <code className="mt-3 block overflow-x-auto rounded-compact bg-surface-sunken px-3 py-2 text-body-sm text-text-secondary">
              POST /api/convert
            </code>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-compact border border-border-subtle bg-surface-sunken px-3 py-2">
      <Subtle className="m-0">{label}</Subtle>
      <Body className="m-0 font-semibold">{value}</Body>
    </div>
  );
}
