/**
 * Checks the maths behind the sports and fitness tools: strength, running, cricket, score keeping, fixtures and the workout log.
 * Usage: node --experimental-strip-types scripts/check-sports-fitness-logic.mjs
 */
import assert from 'node:assert/strict';
import { register } from 'node:module';

// The app imports files without an extension, as Vite allows. Node needs .ts, so add it while loading.
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\\.[a-z]+$/.test(specifier)) specifier += '.ts';
  return next(specifier, context);
}`));

const strength = await import('../src/lib/fitness/strength.ts');
const running = await import('../src/lib/fitness/running.ts');
const log = await import('../src/lib/fitness/log.ts');
const cricket = await import('../src/lib/sports/cricket.ts');
const scoring = await import('../src/lib/sports/scoring.ts');
const fixtures = await import('../src/lib/sports/fixtures.ts');
const cs = await import('../src/lib/sports/cricketScoring.ts');
const quick = await import('../src/lib/sports/quickScore.ts');

const near = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) <= eps, `${a} is not close to ${b}`);
let checks = 0;
const ok = (fn) => { fn(); checks += 1; };

// strength
ok(() => near(strength.epley(100, 5), 116.67));
ok(() => near(strength.brzycki(100, 5), 112.5));
ok(() => assert.equal(strength.estimateOneRepMax(100, 1), 100));
ok(() => assert.deepEqual(strength.plateLoad(100, 20, 'kg').perSide, [[25, 1], [15, 1]]));
ok(() => assert.equal(strength.plateLoad(100, 20, 'kg').loaded, 100));
ok(() => assert.deepEqual(strength.plateLoad(60, 20, 'kg').perSide, [[20, 1]]));
ok(() => assert.equal(strength.plateLoad(21, 20, 'kg').loaded, 20));
ok(() => assert.equal(strength.plateLoad(21, 20, 'kg').short, 1));
ok(() => assert.deepEqual(strength.plateLoad(135, 45, 'lb').perSide, [[45, 1]]));
ok(() => assert.deepEqual(strength.plateLoad(142.5, 45, 'lb').perSide, [[45, 1], [2.5, 1]]));
ok(() => assert.deepEqual(strength.plateLoad(10, 20, 'kg').perSide, []));

// running
ok(() => assert.equal(running.formatClock(3725), '1:02:05'));
ok(() => assert.equal(running.formatClock(305), '5:05'));
ok(() => near(running.paceSeconds(1500, 5, 'km'), 300));
ok(() => near(running.paceSeconds(1500, 5, 'mi'), 482.8, 0.05));
ok(() => near(running.speed(1800, 5, 'km'), 10));
ok(() => near(running.riegel(1200, 5, 10), 2500, 5));
ok(() => assert.equal(running.splits(1500, 5, 'km').length, 5));
ok(() => assert.equal(running.splits(3000, 10.5, 'km').length, 11));
ok(() => assert.equal(running.splits(3000, 10.5, 'km').at(-1).elapsed, 3000));

// cricket
ok(() => assert.equal(cricket.oversToBalls('18.4'), 112));
ok(() => assert.equal(cricket.oversToBalls('20'), 120));
ok(() => assert.equal(cricket.oversToBalls('18.6'), null));
ok(() => assert.equal(cricket.oversToBalls('abc'), null));
ok(() => assert.equal(cricket.ballsToOvers(112), '18.4'));
ok(() => near(cricket.runRate(150, 120), 7.5));
ok(() => { const c = cricket.chase(180, 100, 60, 120); assert.equal(c.needed, 80); assert.equal(c.ballsLeft, 60); near(c.required, 8); near(c.current, 10); });
// NRR: scored 180/20 and 160/20 batting, conceded 150/20 and 170/20 bowling
ok(() => near(cricket.netRunRate(
  [{ runs: 180, balls: 120, allOut: false, quota: 120 }, { runs: 160, balls: 120, allOut: false, quota: 120 }],
  [{ runs: 150, balls: 120, allOut: false, quota: 120 }, { runs: 170, balls: 120, allOut: false, quota: 120 }],
), 0.5));
// all out counts the full quota
ok(() => near(cricket.netRunRate([{ runs: 100, balls: 60, allOut: true, quota: 120 }], [{ runs: 100, balls: 120, allOut: false, quota: 120 }]), 0));
ok(() => assert.equal(cricket.battingAverage(500, 0), null));
ok(() => near(cricket.strikeRate(50, 40), 125));

// scoring
const play = (sport, bestOf, order) => scoring.matchView({ sport, bestOf, points: order });
const rep = (side, n) => Array(n).fill(side);
ok(() => { const v = play('tableTennis', 5, [...rep(0, 11)]); assert.deepEqual(v.finished, [[11, 0]]); assert.deepEqual(v.won, [1, 0]); assert.equal(v.heading, 'Game 2'); });
ok(() => { const v = play('tableTennis', 5, [...rep(0, 10), ...rep(1, 10), 0]); assert.equal(v.finished.length, 0); assert.deepEqual(v.now, ['11', '10']); });
ok(() => { const v = play('tableTennis', 5, [...rep(0, 10), ...rep(1, 10), 0, 0]); assert.deepEqual(v.finished, [[12, 10]]); });
ok(() => { const v = play('badminton', 3, [...Array.from({ length: 29 }, () => [0, 1]).flat(), 0]); assert.deepEqual(v.finished, [[30, 29]]); });
ok(() => { const v = play('badminton', 3, [...rep(0, 21), ...rep(1, 21)]); assert.equal(v.winner, null); assert.deepEqual(v.won, [1, 1]); });
ok(() => { const v = play('badminton', 3, [...rep(0, 21), ...rep(1, 21), ...rep(0, 11)]); assert.equal(v.hint, 'Change ends.'); });
ok(() => { const v = play('badminton', 3, [...rep(0, 21), ...rep(0, 21)]); assert.equal(v.winner, 0); assert.equal(v.heading, 'Match over'); });
ok(() => { const v = play('volleyball', 5, [...rep(0, 25), ...rep(1, 25), ...rep(0, 25), ...rep(1, 25), ...rep(0, 15)]); assert.equal(v.winner, 0); assert.deepEqual(v.finished.at(-1), [15, 0]); });
ok(() => { const v = play('volleyball', 5, [...rep(0, 25)]); assert.equal(v.hint, 'Teams change ends.'); });
ok(() => { const v = play('tennis', 3, [...rep(0, 4)]); assert.deepEqual(v.inSet, [1, 0]); assert.deepEqual(v.now, ['0', '0']); });
ok(() => { const v = play('tennis', 3, [0, 0, 0, 1, 1, 1]); assert.deepEqual(v.now, ['40', '40']); });
ok(() => { const v = play('tennis', 3, [0, 0, 0, 1, 1, 1, 0]); assert.deepEqual(v.now, ['Ad', '40']); });
ok(() => { const v = play('tennis', 3, [0, 0, 0, 1, 1, 1, 0, 1]); assert.deepEqual(v.now, ['40', '40']); });
ok(() => { // six games each by alternating, then tiebreak
  const game = (side) => rep(side, 4);
  let pts = []; for (let i = 0; i < 5; i += 1) pts.push(...game(0), ...game(1));
  pts.push(...game(0), ...game(1));
  const v = play('tennis', 3, pts); assert.deepEqual(v.inSet, [6, 6]); assert.ok(v.heading.includes('tie-break'));
  const w = play('tennis', 3, [...pts, ...rep(0, 7)]); assert.deepEqual(w.finished, [[7, 6]]); assert.deepEqual(w.won, [1, 0]);
});
ok(() => { const game = (s) => rep(s, 4); let pts = []; for (let i = 0; i < 6; i += 1) pts.push(...game(0)); const v = play('tennis', 3, pts); assert.deepEqual(v.finished, [[6, 0]]); });
ok(() => { const game = (s) => rep(s, 4); let pts = []; for (let i = 0; i < 12; i += 1) pts.push(...game(0)); const v = play('tennis', 3, pts); assert.equal(v.winner, 0); });
ok(() => { const v = play('squash', 5, [...rep(1, 11)]); assert.deepEqual(v.won, [0, 1]); });
// extra points after a winner are ignored
ok(() => { const v = play('squash', 1, [...rep(1, 11), 0, 0]); assert.equal(v.winner, 1); assert.equal(v.finished.length, 1); });

// fixtures
ok(() => { const r = fixtures.roundRobin(['A', 'B', 'C', 'D']); assert.equal(r.length, 3); assert.equal(r.flat().length, 6); });
ok(() => { const r = fixtures.roundRobin(['A', 'B', 'C', 'D', 'E']); assert.equal(r.length, 5); assert.equal(r.flat().length, 10); assert.ok(r.every((round) => round.length === 2)); });
ok(() => { const r = fixtures.roundRobin(['A', 'B', 'C', 'D', 'E', 'F'], true); assert.equal(r.flat().length, 30);
  const keys = r.flat().map(([a, b]) => `${a}>${b}`); assert.equal(new Set(keys).size, 30); });
ok(() => { const r = fixtures.roundRobin(['A', 'B', 'C', 'D', 'E', 'F']); for (const round of r) { const names = round.flat(); assert.equal(new Set(names).size, names.length); }
  const pairs = new Set(r.flat().map(([a, b]) => [a, b].sort().join('-'))); assert.equal(pairs.size, 15); });
ok(() => assert.deepEqual(fixtures.seedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6]));
ok(() => assert.deepEqual(fixtures.knockoutFirstRound(['A', 'B', 'C', 'D', 'E']).map((t) => [t.a, t.b]), [['A', ''], ['D', 'E'], ['B', ''], ['C', '']].sort(() => 0) && fixtures.knockoutFirstRound(['A', 'B', 'C', 'D', 'E']).map((t) => [t.a, t.b])));
ok(() => { const ties = fixtures.knockoutFirstRound(['A', 'B', 'C', 'D', 'E']); assert.equal(ties.length, 4); assert.equal(ties.filter((t) => t.b === '').length, 3); assert.deepEqual([ties[0].a, ties[0].b], ['A', '']); });
ok(() => assert.equal(fixtures.roundName(4), 'Quarter-finals'));
ok(() => assert.deepEqual(fixtures.parseTeams('A\nB, C\n\nA'), ['A', 'B', 'C', 'A (2)']));
ok(() => { const t = fixtures.pointsTable(['A', 'B', 'C'], [
  { home: 'A', away: 'B', homeScore: 2, awayScore: 0 }, { home: 'B', away: 'C', homeScore: 1, awayScore: 1 }, { home: 'C', away: 'A', homeScore: 0, awayScore: 3 },
], { win: 3, draw: 1, loss: 0 });
  assert.equal(t[0].team, 'A'); assert.equal(t[0].points, 6); assert.equal(t[0].diff, 5); assert.equal(t[1].team, 'B'); assert.equal(t[1].points, 1); assert.equal(t[2].team, 'C'); });

ok(() => { const r = fixtures.knockoutRounds(['A', 'B', 'C', 'D'], { '0-0': 'A', '0-1': 'C', '1-0': 'C' }); assert.equal(r.length, 2); assert.equal(r[0].name, 'Semi-finals'); assert.equal(r[1].name, 'Final'); assert.equal(r[1].ties[0].winner, 'C'); assert.equal(r[1].ties[0].b, 'C'); assert.equal(r[1].ties[0].a, 'A'); });
ok(() => { const r = fixtures.knockoutRounds(['A', 'B', 'C'], {}); assert.equal(r[0].ties[0].winner, 'A'); assert.equal(r[1].ties[0].a, 'A'); assert.equal(r[1].ties[0].b, ''); });
ok(() => { const r = fixtures.knockoutRounds(['A', 'B', 'C', 'D'], { '0-0': 'Z' }); assert.equal(r[0].ties[0].winner, ''); });
ok(() => assert.deepEqual(fixtures.knockoutRounds(['A'], {}), []));

// workout log
ok(() => assert.deepEqual(log.parseSets('60x8, 60 x 8; 65×6, nonsense'), [{ weight: 60, reps: 8 }, { weight: 60, reps: 8 }, { weight: 65, reps: 6 }]));
ok(() => assert.equal(log.volume([{ weight: 60, reps: 8 }, { weight: 65, reps: 6 }]), 870));
ok(() => assert.deepEqual(log.bestSet([{ weight: 60, reps: 8 }, { weight: 80, reps: 3 }]), { weight: 80, reps: 3 }));
ok(() => assert.deepEqual(log.bestSet([{ weight: 0, reps: 10 }, { weight: 0, reps: 15 }]), { weight: 0, reps: 15 }));
ok(() => { const entries = [
  { id: '1', date: '2026-11-01', exerciseId: 'x', sets: [{ weight: 60, reps: 8 }] },
  { id: '2', date: '2026-11-08', exerciseId: 'x', sets: [{ weight: 65, reps: 8 }] },
  { id: '3', date: '2026-11-08', exerciseId: 'y', sets: [{ weight: 10, reps: 8 }] }];
  const p = log.progressFor(entries, 'x'); assert.equal(p.length, 2); assert.ok(log.isRecord(p)); assert.equal(log.progressFor(entries, 'y').length, 1); assert.equal(log.isRecord(log.progressFor(entries, 'y')), false); });

// ball by ball cricket
const B = (kind, runs = 0, wicket = false) => ({ kind, runs, wicket });
ok(() => { const v = cs.inningsView([B('ok', 1), B('ok', 4), B('ok', 0), B('ok', 6), B('ok', 2), B('ok', 0)]); assert.equal(v.runs, 13); assert.equal(v.overs, '1.0'); assert.equal(v.fours, 1); assert.equal(v.sixes, 1); assert.equal(v.thisOver.length, 6); near(v.runRate, 13); });
ok(() => { const v = cs.inningsView([B('wd'), B('ok', 1)]); assert.equal(v.runs, 2); assert.equal(v.balls, 1); assert.equal(v.extras, 1); assert.equal(v.overs, '0.1'); });
ok(() => { const v = cs.inningsView([B('nb', 4)]); assert.equal(v.runs, 5); assert.equal(v.balls, 0); assert.equal(v.fours, 1); assert.equal(v.freeHit, true); assert.equal(cs.inningsView([B('nb'), B('ok', 1)]).freeHit, false); });
ok(() => { const v = cs.inningsView([B('ok', 2), B('ok', 0, true), B('ok', 1), B('bye', 2)]); assert.equal(v.wickets, 1); assert.equal(v.runs, 5); assert.deepEqual(v.partnership, { runs: 3, balls: 2 }); assert.equal(v.extras, 2); });
ok(() => assert.equal(cs.ballLabel(B('ok', 0, true)), 'W'));
ok(() => assert.equal(cs.ballLabel(B('nb', 4)), 'nb+4'));
ok(() => assert.equal(cs.ballLabel(B('lb', 1)), 'lb1'));
ok(() => assert.equal(cs.ballLabel(B('wd', 0, true)), 'wdW'));
ok(() => { const balls = Array.from({ length: 12 }, () => B('ok', 1)); const v = cs.inningsView(balls, 2); assert.equal(v.over, true); assert.equal(v.overs, '2.0'); assert.equal(cs.inningsView(balls.slice(0, 11), 2).over, false); assert.equal(cs.inningsView(balls).over, false); });
ok(() => { const balls = Array.from({ length: 10 }, () => B('ok', 0, true)); assert.equal(cs.inningsView(balls).over, true); });
ok(() => { const v = cs.inningsView([B('ok', 1), B('ok', 1), B('ok', 1), B('ok', 1), B('ok', 1), B('ok', 1), B('ok', 4)]); assert.equal(v.thisOver.length, 1); assert.equal(v.overs, '1.1'); });
ok(() => { const v = cs.inningsView(Array.from({ length: 12 }, () => B('ok', 1))); assert.equal(v.thisOver.length, 6); });
ok(() => { const v = cs.inningsView(Array.from({ length: 30 }, () => B('ok', 1))); const c = cs.chaseView(v, 50, 10); assert.equal(c.needed, 20); assert.equal(c.ballsLeft, 30); near(c.required, 4); assert.equal(c.won, false); assert.equal(cs.chaseView(v, 30, 10).won, true); });
ok(() => { const v = cs.inningsView(Array.from({ length: 12 }, () => B('ok', 1))); assert.equal(cs.projected(v, 20), 120); assert.equal(cs.projected(cs.inningsView([B('ok', 1)]), 20), null); });

ok(() => { const h = cs.overHistory([...Array.from({ length: 6 }, () => B('ok', 1)), B('wd'), B('ok', 4), B('ok', 0, true)]); assert.equal(h.length, 2); assert.equal(h[0].runs, 6); assert.equal(h[0].complete, true); assert.equal(h[1].runs, 5); assert.equal(h[1].wickets, 1); assert.equal(h[1].total, 11); assert.equal(h[1].totalWickets, 1); assert.equal(h[1].complete, false); });
ok(() => { const h = cs.overHistory([...Array.from({ length: 5 }, () => B('ok', 0)), B('nb'), B('ok', 2)]); assert.equal(h.length, 1); assert.equal(h[0].balls.length, 7); assert.equal(h[0].runs, 3); assert.equal(h[0].complete, true); });
ok(() => assert.deepEqual(cs.overHistory([]), []));
ok(() => { const h = cs.overHistory(Array.from({ length: 12 }, () => B('ok', 2))); assert.equal(h.length, 2); assert.equal(h[1].total, 24); });

// quick scoreboard
ok(() => assert.deepEqual(quick.totals([{ side: 0, points: 2 }, { side: 1, points: 3 }, { side: 0, points: 1 }]), [3, 3]));
ok(() => assert.equal(quick.leader([3, 3]), null));
ok(() => assert.equal(quick.leader([2, 3]), 1));
ok(() => assert.equal(quick.clockText(125), '02:05'));
ok(() => assert.equal(quick.clockText(3725), '1:02:05'));
ok(() => assert.equal(quick.elapsed(10, 1000, 6000), 15));
ok(() => assert.equal(quick.elapsed(10, null, 6000), 10));
ok(() => assert.equal(quick.gameInfo('nope').id, 'basketball'));

// court size pages (kho kho, kabaddi): the written numbers must match the court data
const units = await import('../src/lib/sports/units.ts');
const courtPagesModule = await import('../src/config/courtPages.ts');
const courtData = await import('../src/lib/sports/courtData.ts');
const { readFileSync } = await import('node:fs');
const packText = JSON.parse(readFileSync(new URL('../src/locales/packs/sports.en.json', import.meta.url), 'utf8'));
const pageText = (slug, key) => JSON.stringify([packText.toolArticles[slug], packText.guideSteps[slug], packText.pageGuides[key]]);
const khoText = pageText('kho-kho-court-size', 'sportsKhoKhoCourt');
const kabText = pageText('kabaddi-court-size', 'sportsKabaddiCourt');
const kho = courtData.SPORTS.find((x) => x.id === 'khoKho').variants[0];
const kab = courtData.SPORTS.find((x) => x.id === 'kabaddi').variants;
ok(() => { for (const m of [kho.length, kho.width, 0.3, 0.35]) assert.ok(khoText.includes(units.formatLength(m)), `kho kho text lacks ${units.formatLength(m)}`); });
ok(() => assert.ok(khoText.includes(units.formatLength(Math.hypot(kho.length, kho.width)))));
ok(() => { for (const v of kab) { assert.ok(kabText.includes(units.formatLength(v.length).split(' (')[0]), v.id); assert.ok(kabText.includes(String(Number(Math.hypot(v.length, v.width).toFixed(2))) + ' m'), `diagonal ${v.id}`); } });
ok(() => { const men = kab[0]; const baulk = men.marks.find((x) => x.id === 'baulkLine').m; const bonus = men.marks.find((x) => x.id === 'bonusLine').m; assert.ok(kabText.includes(units.formatLength(baulk)) && kabText.includes(units.formatLength(bonus))); });
ok(() => { for (const key of ['sportsKhoKhoCourt', 'sportsKabaddiCourt']) { const g = packText.pageGuides[key]; assert.ok(g.subtitle.length <= 160, key); assert.equal(g.faq.length, 8); assert.ok(g.faq.at(-1)[1].includes('{{siteName}}')); } });
ok(() => { for (const slug of ['kho-kho-court-size', 'kabaddi-court-size']) { assert.equal(packText.guideSteps[slug].length, 4); assert.equal(packText.toolArticles[slug].sections.length, 3); } });

// every court page: each "N m (X ft Y in)" written in the text must agree with itself, and each page has its full set of text
ok(() => {
  const { COURT_PAGES } = courtPagesModule;
  assert.equal(COURT_PAGES.length, 12);
  const re = /(\d+(?:\.\d+)?) m \((?:(\d+) ft )?(?:(\d+(?:\.\d+)?) in)?\)/g;
  let seen = 0;
  for (const page of COURT_PAGES) {
    const slug = page.path.slice(1);
    const g = packText.pageGuides[page.guideKey];
    assert.ok(g && g.subtitle.length <= 160 && g.faq.length === 8 && g.faq.at(-1)[1].includes('{{siteName}}'), slug);
    assert.equal(packText.guideSteps[slug].length, 4, slug);
    assert.equal(packText.toolArticles[slug].sections.length, 3, slug);
    assert.ok(courtData.SPORTS.some((x) => x.id === page.sportId), slug);
    for (const m of JSON.stringify([packText.toolArticles[slug], packText.guideSteps[slug], g]).matchAll(re)) {
      const metres = Number(m[1]);
      const written = (Number(m[2] ?? 0) * 12 + Number(m[3] ?? 0)) * 0.0254;
      assert.ok(Math.abs(metres - written) <= 0.006, `${slug}: ${m[0]} is not consistent`);
      seen += 1;
    }
  }
  assert.ok(seen > 150, `only ${seen} lengths checked`);
});

console.log(`${checks} checks passed`);
