/**
 * Text for the tournament size pages (see src/config/fixturePages.ts). Everything is worked out from the fixtures code,
 * so the match lists and counts cannot drift from what the tool makes. Used by build-fixture-pages.mjs, which writes it
 * into the locale file, and by the check script, which compares the file with this.
 */
import { FIXTURE_PAGES } from '../src/config/fixturePages.ts';
import { knockoutFirstRound, nextPowerOfTwo, roundName, roundRobin, seedOrder } from '../src/lib/sports/fixtures.ts';

const PRIVACY = ['Is my data sent anywhere when I use this page?', 'No. The team names and results stay in your browser on this device, and nothing you do here is uploaded to {{siteName}}.'];
const names = (n) => Array.from({ length: n }, (_, i) => `Team ${i + 1}`);
const list = (items) => items.join(', ');

function roundRobinContent(page) {
  const n = page.teams;
  const teams = names(n);
  const rounds = roundRobin(teams);
  const matches = (n * (n - 1)) / 2;
  const perRound = Math.floor(n / 2);
  const odd = n % 2 === 1;
  const title = `Round Robin Schedule for ${n} Teams: Fixtures, Rounds and Match List`;
  const subtitle = `Round robin fixtures for ${n} teams: all ${matches} matches in ${rounds.length} rounds, ready to copy, with your own team names, a points table and home and away.`;
  const steps = [
    ['Type your team names', `The tool below starts with ${n} teams, Team 1 to Team ${n}. Replace them with your own names, one on each line.`],
    ['Choose the format', `With everyone playing each other once, a round robin makes ${matches} matches in ${rounds.length} rounds. Choosing Twice (home and away) doubles that to ${matches * 2} matches in ${rounds.length * 2} rounds.`],
    ['Copy the fixtures', 'Press Copy the fixtures and paste the schedule into a chat or a document to share with the teams.'],
    ['Enter the scores', 'Type the score of each match to fill in the points table. Your teams and scores are kept on this device, and New tournament, same teams clears the scores and keeps the teams.'],
  ];
  const article = [
    [`Round robin for ${n} teams at a glance`, [
      `In a round robin with ${n} teams, every team plays every other team once. That is ${n} x ${n - 1} ÷ 2 = ${matches} matches, and each team plays ${n - 1} of them. The matches are shared out in ${rounds.length} rounds of ${perRound} ${perRound === 1 ? 'match' : 'matches'}.`,
      odd
        ? `Because ${n} is an odd number, one team has no opponent in each round and rests. Each team rests once, which is why there are ${rounds.length} rounds and not ${rounds.length - 1}.`
        : `Because ${n} is an even number, every team plays in every round. You need ${perRound} courts or pitches to play a whole round at the same time.`,
    ]],
    [`Match list for ${n} teams`, [
      `This is the schedule the tool makes for ${n} teams, using the circle method, where one team stays still and the others move round it. Replace Team 1 to Team ${n} with your own names.`,
      ...rounds.map((round, r) => {
        const resting = odd ? teams.find((t) => !round.some((pair) => pair.includes(t))) : '';
        return `Round ${r + 1}: ${list(round.map(([a, b]) => `${a} vs ${b}`))}${resting ? `. ${resting} rests` : ''}.`;
      }),
    ]],
    ['Running the tournament', [
      `If you play one round a day, a round robin for ${n} teams takes ${rounds.length} days, and a home and away round robin takes ${rounds.length * 2} days. With fewer courts or pitches, play part of a round at a time.`,
      'The tool adds the scores to a points table. A win is worth 3 points and a draw 1 by default, and you can change both. Teams level on points are ordered by score difference, then by scores for.',
    ]],
  ];
  const faqs = [
    [`How many matches are there in a round robin with ${n} teams?`, `There are ${matches} matches. Each of the ${n} teams plays the other ${n - 1}, and the total is ${n} x ${n - 1} ÷ 2.`],
    [`How many rounds does a round robin with ${n} teams have?`, `${rounds.length} rounds, with ${perRound} ${perRound === 1 ? 'match' : 'matches'} in each.`],
    odd
      ? [`What happens with ${n} teams, an odd number?`, `One team rests in each round, and each team rests once. The tool shows the rounds without the resting team.`]
      : [`Do all ${n} teams play in every round?`, `Yes. With an even number of teams everyone has an opponent in every round, so you need ${perRound} courts or pitches to play a round at once.`],
    [`How many matches are there home and away with ${n} teams?`, `${matches * 2} matches in ${rounds.length * 2} rounds. Every pairing is played twice, once at each team's ground, with the second half of the schedule reversing home and away.`],
    ['How many courts or pitches do I need?', `${perRound} to play a whole round at once. With fewer, play part of a round at a time and use the same rounds as a guide to the order.`],
    ['How are the points worked out?', 'A win gives 3 points and a draw 1 by default, and you can change both. Teams are ordered by points, then score difference, then scores for.'],
    ['Can I use my own team names?', `Yes. Replace Team 1 to Team ${n} in the box with your own names, one on each line. Adding or removing a team changes the schedule to match.`],
    PRIVACY,
  ];
  return { title, subtitle, steps, article, faqs };
}

function knockoutContent(page) {
  const n = page.teams;
  const teams = names(n);
  const size = nextPowerOfTwo(n);
  const byes = size - n;
  const totalRounds = Math.log2(size);
  const first = knockoutFirstRound(teams);
  const roundsInfo = Array.from({ length: totalRounds }, (_, r) => ({ ties: size / 2 ** (r + 1) })).map((x) => ({ ...x, name: roundName(x.ties) }));
  const realFirst = first.filter((t) => t.a && t.b);
  const title = `Knockout Bracket for ${n} Teams: Draw, Byes and Match List`;
  const subtitle = `Knockout bracket for ${n} teams: ${n - 1} matches in ${totalRounds} rounds${byes ? `, with ${byes} ${byes === 1 ? 'bye' : 'byes'}` : ''}. Seeded so the top teams meet late. Copy it and pick the winners.`;
  const steps = [
    ['Type your team names', `Open the Format list and choose Knockout bracket. Type your ${n} teams, one on each line, strongest first, because the order is the seeding.`],
    ['Read the first round', byes ? `The top ${byes} ${byes === 1 ? 'seed has' : 'seeds have'} a bye and go straight to the second round. The other teams play in the first round.` : `${n} is a power of 2, so every team plays in the first round and no one has a bye.`],
    ['Pick the winners', 'Tap the winner of each match. The winners move on to the next round until a champion is shown.'],
    ['Copy or start again', 'Press Copy the fixtures to share the bracket. Clear all results keeps the teams, and New tournament, same teams clears the scores and keeps the teams.'],
  ];
  const article = [
    [`Knockout bracket for ${n} teams at a glance`, [
      `A knockout with ${n} teams has ${n - 1} matches, because every match knocks out one team and only the champion is left. The bracket is built on ${size} places and has ${totalRounds} rounds: ${list(roundsInfo.map((r) => `${r.name} (${r.ties} ${r.ties === 1 ? 'match' : 'matches'})`))}.`,
      byes
        ? `${n} is not a power of 2, so ${byes} ${byes === 1 ? 'place is' : 'places are'} left empty. The top ${byes} ${byes === 1 ? 'seed gets' : 'seeds get'} a bye, which means going straight to the next round without playing, and the other ${n - byes} teams play ${realFirst.length} ${realFirst.length === 1 ? 'match' : 'matches'} in the first round.`
        : `${n} is a power of 2, so every team plays in the first round and there are no byes.`,
    ]],
    [`First round for ${n} teams`, [
      `This is the first round the tool makes for ${n} teams, in seed order. Team 1 is the top seed. Replace the team names with your own.`,
      `${list(first.map((t) => (t.a && t.b ? `${t.a} vs ${t.b}` : `${t.a || t.b} has a bye`)))}.`,
      `The slot order for ${size} places is ${seedOrder(size).join(', ')}. Seed 1 plays the lowest seed, and the top seeds are kept apart until the latest round possible.`,
    ]],
    ['Running the knockout', [
      `Play each round in turn. Rounds get shorter: ${list(roundsInfo.map((r) => `${r.ties} ${r.ties === 1 ? 'match' : 'matches'}`))}. With one court, that is ${n - 1} matches in all.`,
      'The tool does not make a third place match. If you want one, add a match between the two losing semi-finalists before the final.',
    ]],
  ];
  const faqs = [
    [`How many matches are there in a knockout with ${n} teams?`, `${n - 1} matches. Every match knocks out one team, so ${n - 1} teams have to be knocked out to find the champion.`],
    [`How many rounds does a knockout with ${n} teams have?`, `${totalRounds} rounds: ${list(roundsInfo.map((r) => r.name))}.`],
    byes ? [`Are there byes with ${n} teams?`, `Yes, ${byes}. The bracket needs ${size} places, so ${byes} ${byes === 1 ? 'team goes' : 'teams go'} straight through the first round.`] : [`Are there byes with ${n} teams?`, `No. ${n} is a power of 2, so every team plays in the first round.`],
    byes ? ['Who gets the byes?', `The top ${byes} ${byes === 1 ? 'seed' : 'seeds'}, which are the first ${byes} ${byes === 1 ? 'team' : 'teams'} in your list. List the strongest teams first.`] : ['How are teams matched in the first round?', `By seed. With ${size} places, seed 1 plays seed ${size}, and the top seeds meet as late as possible.`],
    ['How are the teams seeded?', `The order of your list is the seeding. The top seeds are placed so they cannot meet until the latest round possible, using the slot order ${seedOrder(size).join(', ')}.`],
    ['Does it make a third place match?', 'No. If you want one, add a match between the two losing semi-finalists before the final.'],
    ['Can I use my own team names and save the winners?', `Yes. Replace Team 1 to Team ${n} with your own names. The winners you pick are kept on this device until you clear them.`],
    PRIVACY,
  ];
  return { title, subtitle, steps, article, faqs };
}

export function buildFixtureContent() {
  const guideSteps = {}; const pageGuides = {}; const toolArticles = {};
  for (const page of FIXTURE_PAGES) {
    const c = page.format === 'roundRobin' ? roundRobinContent(page) : knockoutContent(page);
    const slug = page.path.slice(1);
    guideSteps[slug] = c.steps;
    pageGuides[page.guideKey] = { title: c.title, subtitle: c.subtitle, faq: c.faqs };
    toolArticles[slug] = { sections: c.article.map(([heading, paragraphs]) => ({ heading, paragraphs })) };
  }
  return { guideSteps, pageGuides, toolArticles };
}
