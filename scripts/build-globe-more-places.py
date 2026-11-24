"""
Builds the extra place files for the Globe Video Maker: about 170,000 towns and cities, split by first letter so a phone downloads only the
small piece it needs (public/globe/places-<letter>.json), plus src/data/globe/iso2.json (country code to the country id used on the map).

Place data: GeoNames (https://www.geonames.org), licence CC BY 4.0, through the public list github.com/lutangar/cities.json.
Country codes: Natural Earth (public domain).

Run:  python3 scripts/build-globe-more-places.py <folder with cities.json and admin1.json> <Natural Earth geojson folder>

Shard file: {"a": ["State|IN", ...], "c": [[name, lat*100, lon*100, index into a], ...]}  (a lists each state and country once).
"""
import json, os, sys, unicodedata, collections

cities_dir, ne_dir = sys.argv[1], sys.argv[2]
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def key(name):
    folded = unicodedata.normalize('NFD', name).encode('ascii', 'ignore').decode().lower().strip()
    ch = folded[:1]
    return ch if 'a' <= ch <= 'z' else '_'

ne = json.load(open(os.path.join(ne_dir, 'ne_10m_admin_0_countries_ind.geojson')))
iso2 = {}
for f in ne['features']:
    p = f['properties']
    code = p.get('ISO_A2_EH') or p.get('ISO_A2')
    a3 = p.get('ADM0_A3') or p.get('ISO_A3')
    if not code or code == '-99' or not a3: continue
    # Some codes belong to several map pieces (an island group inside a country): keep the main one, whose ids agree.
    if code not in iso2 or a3 == p.get('ISO_A3_EH'): iso2[code] = a3
os.makedirs(os.path.join(root, 'src/data/globe'), exist_ok=True)
json.dump(iso2, open(os.path.join(root, 'src/data/globe/iso2.json'), 'w'), separators=(',', ':'), sort_keys=True)

admin = {a['code']: a['name'] for a in json.load(open(os.path.join(cities_dir, 'admin1.json')))}
cities = json.load(open(os.path.join(cities_dir, 'cities.json')))
shards = collections.defaultdict(list)
skipped = 0
for c in cities:
    if c['country'] not in iso2: skipped += 1; continue
    shards[key(c['name'])].append(c)
out = os.path.join(root, 'public/globe')
os.makedirs(out, exist_ok=True)
for old in os.listdir(out):
    if old.startswith('places-'): os.remove(os.path.join(out, old))
total = 0
for letter, items in sorted(shards.items()):
    labels, index, rows = [], {}, []
    for c in sorted(items, key=lambda x: x['name']):
        state = admin.get(f"{c['country']}.{c['admin1']}", '')
        label = f"{state}|{c['country']}"
        if label not in index: index[label] = len(labels); labels.append(label)
        rows.append([c['name'], round(float(c['lat']) * 100), round(float(c['lng']) * 100), index[label]])
    json.dump({'a': labels, 'c': rows}, open(os.path.join(out, f'places-{letter}.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    total += len(rows)
print('places', total, 'skipped (no country on the map)', skipped, 'files', len(shards))
