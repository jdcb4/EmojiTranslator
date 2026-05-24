import { useState } from 'react';

import { Body, Caption, Heading, Subtle } from '../../components/ui/typography';
import { gameClues, type GameClue } from '../../data/game/loadGameData';
import {
  matchTitleGuess,
  type GuessMatchResult,
} from '../../domain/game/answerMatching';
import { pickWeightedClue } from '../../domain/game/clueWeight';
import { buildGameShareText } from '../../domain/game/shareText';

type Feedback =
  | {
      kind: 'correct';
      match: GuessMatchResult;
    }
  | {
      kind: 'near';
      match: GuessMatchResult;
    }
  | {
      kind: 'miss';
      match: GuessMatchResult;
    }
  | {
      kind: 'revealed';
    };

type RoundState = {
  clue: GameClue;
  seenIds: string[];
};

type ShareStatus = 'idle' | 'shared' | 'copied' | 'link';

const inputClass =
  'w-full rounded-default border border-border-default bg-surface-sunken px-3 py-3 text-body text-text-primary outline-none transition focus:border-accent-primary';

const primaryButtonClass =
  'rounded-default border border-border-strong bg-accent-primary px-4 py-3 text-body-sm font-semibold text-text-on-accent transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';

const secondaryButtonClass =
  'rounded-default border border-border-default bg-surface-raised px-4 py-3 text-body-sm font-semibold text-text-secondary transition hover:border-accent-primary hover:text-text-primary';

function clueFromUrl() {
  if (typeof window === 'undefined') {
    return null;
  }

  const code = new URLSearchParams(window.location.search)
    .get('clue')
    ?.toUpperCase();

  if (!code) {
    return null;
  }

  return gameClues.find((clue) => clue.code === code) ?? null;
}

function drawRandomClue(seenIds: string[]) {
  const unseen = gameClues.filter((clue) => !seenIds.includes(clue.id));
  const pool = unseen.length > 0 ? unseen : gameClues;

  return pickWeightedClue(pool) ?? gameClues[0];
}

function kindLabel(kind: GameClue['kind']) {
  if (kind === 'tv') {
    return 'TV';
  }

  if (kind === 'movie') {
    return 'Movie';
  }

  if (kind === 'book') {
    return 'Book';
  }

  return 'Title';
}

function feedbackMessage(feedback: Feedback | null, clue: GameClue) {
  if (!feedback) {
    return 'Make a guess.';
  }

  if (feedback.kind === 'correct') {
    return `Correct: ${clue.title}`;
  }

  if (feedback.kind === 'near') {
    return `Close enough: ${clue.title}`;
  }

  if (feedback.kind === 'revealed') {
    return `Answer: ${clue.title}`;
  }

  return 'Not quite.';
}

function feedbackTone(feedback: Feedback | null) {
  if (!feedback) {
    return 'border-border-default';
  }

  if (feedback.kind === 'correct' || feedback.kind === 'near') {
    return 'border-accent-success';
  }

  if (feedback.kind === 'revealed') {
    return 'border-accent-info';
  }

  return 'border-accent-warning';
}

function shareUrlFor(clue: GameClue) {
  if (typeof window === 'undefined') {
    return `?clue=${clue.code}`;
  }

  const url = new URL(window.location.href);
  url.searchParams.set('clue', clue.code);
  url.hash = '';

  return url.toString();
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

export function GamePage() {
  const [round, setRound] = useState<RoundState>(() => {
    const clue = clueFromUrl() ?? drawRandomClue([]);

    return { clue, seenIds: [clue.id] };
  });
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [stats, setStats] = useState({
    solved: 0,
    streak: 0,
    skipped: 0,
  });
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [shareUrl, setShareUrl] = useState('');
  const [shareText, setShareText] = useState('');
  const feedbackText = feedbackMessage(feedback, round.clue);
  const solvedThisRound =
    feedback?.kind === 'correct' || feedback?.kind === 'near';

  function nextRound() {
    setRound((current) => {
      const seenIds =
        current.seenIds.length >= gameClues.length ? [] : current.seenIds;
      const clue = drawRandomClue(seenIds);

      return { clue, seenIds: [...seenIds, clue.id] };
    });
    setGuess('');
    setFeedback(null);
    setShareStatus('idle');
    setShareUrl('');
    setShareText('');
  }

  function submitGuess() {
    if (solvedThisRound || feedback?.kind === 'revealed') {
      nextRound();
      return;
    }

    const match = matchTitleGuess(guess, round.clue.title);

    if (match.accepted) {
      setStats((current) => ({
        solved: current.solved + 1,
        streak: current.streak + 1,
        skipped: current.skipped,
      }));
      setFeedback({
        kind: match.reason === 'near' ? 'near' : 'correct',
        match,
      });
      return;
    }

    setFeedback({ kind: 'miss', match });
  }

  function revealAnswer() {
    if (solvedThisRound || feedback?.kind === 'revealed') {
      nextRound();
      return;
    }

    setStats((current) => ({
      solved: current.solved,
      streak: 0,
      skipped: current.skipped + 1,
    }));
    setFeedback({ kind: 'revealed' });
  }

  async function shareClue() {
    const url = shareUrlFor(round.clue);
    const text = buildGameShareText(round.clue, url);
    const shareData = {
      title: 'Emoji Title Game',
      text,
    };

    setShareStatus('idle');
    setShareUrl(url);
    setShareText(text);

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareStatus('shared');
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    const copied = await copyTextToClipboard(text);
    setShareStatus(copied ? 'copied' : 'link');
  }

  return (
    <main className="min-h-dvh bg-surface-base pb-[max(4rem,env(safe-area-inset-bottom))] text-text-primary">
      <div className="mx-auto grid min-h-dvh w-full max-w-5xl content-start gap-6 px-5 py-7 sm:px-6 lg:py-10">
        <section className="grid gap-2">
          <Heading level={1}>Emoji Title Game</Heading>
          <Body className="m-0 max-w-2xl text-text-secondary">
            Movie, TV and book titles converted into emoji clues.
          </Body>
          <Body className="m-0 text-body-sm text-text-secondary">
            Want to create your own?{' '}
            <a className="font-semibold text-accent-primary" href="#translator">
              Use our Emoji Translator
            </a>
            .
          </Body>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-default border border-border-subtle bg-surface-raised p-5 shadow-sm sm:p-6">
            <div className="grid gap-5">
              <div className="flex items-center justify-between gap-3">
                <Caption>{kindLabel(round.clue.kind)}</Caption>
                <Subtle className="m-0">Code {round.clue.code}</Subtle>
              </div>

              <div className="min-h-36 rounded-default border border-border-default bg-surface-sunken px-4 py-8 text-center sm:px-6">
                <div
                  aria-label="Emoji clue"
                  className="break-keep text-[4rem] font-semibold leading-tight sm:text-[5.5rem]"
                >
                  {round.clue.emoji}
                </div>
              </div>

              <form
                className="grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitGuess();
                }}
              >
                <label className="grid gap-2">
                  <span className="text-body-sm font-medium text-text-secondary">
                    Your guess
                  </span>
                  <input
                    autoComplete="off"
                    className={inputClass}
                    onChange={(event) => {
                      setGuess(event.target.value);
                    }}
                    value={guess}
                  />
                </label>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <button
                    className={primaryButtonClass}
                    disabled={
                      !guess.trim() &&
                      !solvedThisRound &&
                      feedback?.kind !== 'revealed'
                    }
                    type="submit"
                  >
                    {solvedThisRound || feedback?.kind === 'revealed'
                      ? 'Next clue'
                      : 'Guess'}
                  </button>
                  <button
                    className={secondaryButtonClass}
                    onClick={revealAnswer}
                    type="button"
                  >
                    {feedback?.kind === 'revealed' || solvedThisRound
                      ? 'Next clue'
                      : 'Reveal'}
                  </button>
                  <button
                    className={`${secondaryButtonClass} col-span-2 sm:col-span-1`}
                    onClick={() => void shareClue()}
                    type="button"
                  >
                    Share
                  </button>
                </div>
              </form>

              <div
                className={`rounded-default border bg-surface-sunken p-4 ${feedbackTone(feedback)}`}
              >
                <Body className="m-0 font-semibold">{feedbackText}</Body>
                {shareStatus !== 'idle' ? (
                  <Subtle className="m-0 mt-1">
                    {shareStatus === 'shared'
                      ? 'Shared.'
                      : shareStatus === 'copied'
                        ? 'Share link copied.'
                        : 'Share link ready.'}
                  </Subtle>
                ) : null}
                {shareStatus === 'link' ? (
                  <div className="mt-3 space-y-2">
                    <pre className="whitespace-pre-wrap break-words rounded-default border border-border-default bg-surface-raised p-3 text-body-sm text-text-primary">
                      {shareText}
                    </pre>
                    <a
                      className="block break-all text-body-sm font-medium text-accent-primary"
                      href={shareUrl}
                    >
                      {shareUrl}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="grid content-start gap-3">
            <div className="rounded-default border border-border-subtle bg-surface-raised p-4 shadow-sm">
              <Caption>Score</Caption>
              <div className="mt-3 grid grid-cols-3 gap-2 lg:grid-cols-1">
                <div className="rounded-default border border-border-default bg-surface-sunken p-3">
                  <Subtle className="m-0">Solved</Subtle>
                  <Body className="m-0 text-h3 font-semibold">
                    {stats.solved}
                  </Body>
                </div>
                <div className="rounded-default border border-border-default bg-surface-sunken p-3">
                  <Subtle className="m-0">Streak</Subtle>
                  <Body className="m-0 text-h3 font-semibold">
                    {stats.streak}
                  </Body>
                </div>
                <div className="rounded-default border border-border-default bg-surface-sunken p-3">
                  <Subtle className="m-0">Skipped</Subtle>
                  <Body className="m-0 text-h3 font-semibold">
                    {stats.skipped}
                  </Body>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
