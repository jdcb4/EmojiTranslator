export type MovieOverride = {
  movieId?: string;
  title: string;
  year?: number;
  strictEmoji?: string;
  rebusEmoji?: string;
  movieClueEmoji?: string;
  approved: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  explanation: string;
  source?: string;
};
