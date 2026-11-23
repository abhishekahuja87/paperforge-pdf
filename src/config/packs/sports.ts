import sports from '../../locales/packs/sports.catalog.en.json';
import { definePackTool, type PackTool } from './types';

/** Sports and games. Each tool runs in the browser and nothing is uploaded. */
export const SPORTS_TOOLS: PackTool[] = [
  definePackTool({
    id: 'sports-court-size-guide', kind: 'courtGuide', guideKey: 'sportsCourtGuide', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['badminton court size', 'tennis court dimensions', 'pickleball court size', 'cricket pitch length', 'football pitch size', 'basketball court size', 'volleyball court size', 'kabaddi court size', 'sports court dimensions', 'fit court in my space'],
  }, sports.toolCatalog),
  definePackTool({
    id: 'cricket-run-rate-calculator', kind: 'cricketRunRate', guideKey: 'sportsCricketRunRate', category: 'everyday', icon: 'calculator', tier: 'popular',
    keywords: ['cricket run rate calculator', 'net run rate calculator', 'nrr calculator', 'required run rate calculator', 'cricket calculator', 'how to calculate net run rate', 't20 run rate', 'cricket strike rate calculator', 'batting average calculator', 'economy rate calculator', 'cricket overs calculator', 'run rate in a chase'],
  }, sports.toolCatalog),
  definePackTool({
    id: 'match-score-keeper', kind: 'matchScoreKeeper', guideKey: 'sportsMatchScoreKeeper', category: 'everyday', icon: 'hash', tier: 'popular',
    keywords: ['badminton score counter', 'tennis score counter', 'volleyball scoreboard', 'table tennis scoreboard', 'squash score counter', 'pickleball score keeper', 'scoreboard app free', 'match score keeper', 'digital scoreboard', 'tennis scoring app', 'badminton scoreboard online', 'score counter for games'],
  }, sports.toolCatalog),
  definePackTool({
    id: 'tournament-fixtures-maker', kind: 'tournamentFixtures', guideKey: 'sportsTournamentFixtures', category: 'everyday', icon: 'grid', tier: 'popular',
    keywords: ['tournament fixtures generator', 'round robin schedule maker', 'knockout bracket maker', 'league fixtures generator', 'points table calculator', 'tournament bracket generator', 'round robin fixture generator', 'cricket tournament fixtures', 'football league table maker', 'badminton tournament draw', 'school sports day fixtures', 'single elimination bracket'],
  }, sports.toolCatalog),
  definePackTool({
    id: 'cricket-scorer', kind: 'cricketScorer', guideKey: 'sportsCricketScorer', category: 'everyday', icon: 'hash', tier: 'popular',
    keywords: ['cricket scorer', 'cricket scoring app', 'ball by ball cricket score', 'cricket scoreboard online', 'gully cricket scorer', 'cricket score counter', 'simple cricket scoring', 'cricket run counter', 'cricket scorecard online', 'cricket over counter', 'free hit scorer', 'cricket scoreboard for mobile'],
  }, sports.toolCatalog),
  definePackTool({
    id: 'quick-scoreboard', kind: 'quickScoreboard', guideKey: 'sportsQuickScoreboard', category: 'everyday', icon: 'hash', tier: 'popular',
    keywords: ['basketball scoreboard', 'basketball score counter', 'football scoreboard online', 'hockey scoreboard', 'kabaddi scoreboard', 'kabaddi score counter', 'digital scoreboard free', 'score counter for any game', 'quick scoreboard', 'scoreboard with timer', 'handball scoreboard', 'simple scoreboard for sports day'],
  }, sports.toolCatalog),
];
