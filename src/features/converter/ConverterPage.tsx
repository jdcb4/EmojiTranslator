import { useEffect, useState } from 'react';

import { Body, Caption, Heading, Subtle } from '../../components/ui/typography';
import type { ConversionResult } from '../../types/conversion';

const SAMPLE_TITLES = [
  'The Lion King',
  'Beauty and the Beast',
  'The Lord of the Rings: The Return of the King',
  'Everything Everywhere All at Once',
  'The Man Who Would Be King',
  'The Silence of the Lambs',
  'The Grand Budapest Hotel',
  'A Clockwork Orange',
];

const fieldClass =
  'w-full scroll-mb-32 rounded-default border border-border-default bg-surface-sunken px-3 py-3 text-body text-text-primary outline-none transition focus:border-accent-primary';

const buttonClass =
  'w-full rounded-default border border-border-strong bg-accent-primary px-4 py-3 text-body-sm font-semibold text-text-on-accent transition hover:opacity-90 sm:w-auto';

const iconButtonClass =
  'grid size-9 shrink-0 place-items-center rounded-default border border-border-default bg-surface-raised text-h4 text-text-secondary transition hover:border-accent-primary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40';

const resultMetaClass =
  'min-h-16 rounded-default border bg-surface-sunken px-2 py-2 sm:px-3';

async function convertLocally(title: string) {
  const { convertMovieTitleToEmoji } =
    await import('../../domain/converter/convertTitle');

  return convertMovieTitleToEmoji(title, { mode: 'hybrid' });
}

async function copyTextToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.append(textarea);
    textarea.focus();
    textarea.select();

    const copied = document.execCommand('copy');
    textarea.remove();

    return copied;
  }
}

function resultStatus(result: ConversionResult | null) {
  if (!result) {
    return { label: 'Loading', tone: 'border-border-default' };
  }

  if (!result.emoji || result.confidence < 0.25) {
    return { label: 'No Match', tone: 'border-accent-danger' };
  }

  if (result.confidence >= 0.9) {
    return { label: 'Great match!', tone: 'border-accent-success' };
  }

  if (result.confidence >= 0.7) {
    return { label: 'Good match.', tone: 'border-accent-success' };
  }

  if (result.confidence >= 0.5) {
    return { label: 'OK match.', tone: 'border-accent-warning' };
  }

  return { label: 'Bad match.', tone: 'border-accent-danger' };
}

export function ConverterPage() {
  const [title, setTitle] = useState('The Lion King');
  const [submittedTitle, setSubmittedTitle] = useState('The Lion King');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    void convertLocally(submittedTitle).then((nextResult) => {
      if (active) {
        setResult(nextResult);
      }
    });

    return () => {
      active = false;
    };
  }, [submittedTitle]);

  const status = resultStatus(result);
  const showNoMatchMessage = Boolean(
    result && (!result.emoji || !result.accepted),
  );

  async function handleCopy() {
    if (!result?.emoji) {
      return;
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
    await copyTextToClipboard(result.emoji);
  }

  return (
    <main className="min-h-dvh bg-surface-base pb-[max(7rem,env(safe-area-inset-bottom))] text-text-primary sm:pb-8">
      <div className="mx-auto grid min-h-dvh w-full max-w-4xl gap-6 px-5 py-7 sm:px-6 lg:py-10">
        <section className="space-y-2">
          <Heading level={1}>Emoji Translator</Heading>
          <Body className="m-0 max-w-2xl text-text-secondary">
            Convert movie titles into emoji strings. Not everything can be
            translated.
          </Body>
          <Body className="m-0 text-body-sm text-text-secondary">
            Want to play?{' '}
            <a className="font-semibold text-accent-primary" href="./">
              Back to the Emoji Title Game
            </a>
            .
          </Body>
        </section>

        <section className="space-y-5">
          <div className="rounded-default border border-border-subtle bg-surface-raised p-5 shadow-sm sm:p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Caption>Emojified title</Caption>
                <div className="text-display font-semibold leading-none">
                  <div className="break-keep">
                    {result ? (result.emoji ?? 'No match') : 'Loading'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`${resultMetaClass} flex items-center justify-between gap-3 border-border-default`}
                >
                  <div className="min-w-0">
                    <Body className="m-0 font-semibold">
                      {copied ? 'Copied' : 'Copy emoji'}
                    </Body>
                  </div>
                  <button
                    aria-label={
                      copied ? 'Copied emoji output' : 'Copy emoji output'
                    }
                    className={iconButtonClass}
                    disabled={!result?.emoji}
                    onClick={() => void handleCopy()}
                    title={copied ? 'Copied' : 'Copy emoji'}
                    type="button"
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                </div>
                <div
                  className={`${resultMetaClass} flex flex-col justify-center text-left ${status.tone}`}
                >
                  <Body className="m-0 font-semibold">{status.label}</Body>
                </div>
              </div>
            </div>

            {showNoMatchMessage ? (
              <div className="mt-5 rounded-default border border-accent-danger bg-surface-sunken p-4">
                <Body className="m-0 font-semibold text-text-primary">
                  Sorry, we couldn't come up with a good match. Feel free to try
                  something else!
                </Body>
              </div>
            ) : null}
          </div>

          <form
            className="space-y-5 rounded-default border border-border-subtle bg-surface-raised p-5 shadow-sm sm:p-6"
            onSubmit={(event) => {
              event.preventDefault();
              setCopied(false);
              setSubmittedTitle(title);
            }}
          >
            <label className="block space-y-2">
              <span className="text-body-sm font-medium text-text-secondary">
                Movie title
              </span>
              <input
                className={fieldClass}
                onChange={(event) => {
                  setCopied(false);
                  setTitle(event.target.value);
                }}
                value={title}
              />
            </label>

            <button className={buttonClass} type="submit">
              Emojify!
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
                    setCopied(false);
                    setTitle(sample);
                    setSubmittedTitle(sample);
                  }}
                  type="button"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {result ? (
            <details className="rounded-default border border-border-subtle bg-surface-raised p-5 shadow-sm">
              <summary className="cursor-pointer text-body-sm font-semibold text-text-secondary">
                Rules used
              </summary>
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
            </details>
          ) : null}
        </section>
      </div>
    </main>
  );
}
