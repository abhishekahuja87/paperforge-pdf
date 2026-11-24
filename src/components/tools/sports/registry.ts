import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const SPORTS_COMPONENTS: Record<string, LazyExoticComponent<ComponentType>> = {
  courtGuide: lazy(() => import('./CourtGuide')),
  cricketScorer: lazy(() => import('./CricketScorer')),
  quickScoreboard: lazy(() => import('./QuickScoreboard')),
  cricketRunRate: lazy(() => import('./CricketRunRate')),
  matchScoreKeeper: lazy(() => import('./MatchScoreKeeper')),
  tournamentFixtures: lazy(() => import('./TournamentFixtures')),
};
