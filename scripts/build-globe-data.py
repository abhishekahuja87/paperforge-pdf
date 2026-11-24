"""
Builds the map data for the Globe Video Maker (src/data/globe/world.json and places.json) from Natural Earth, which is in the
public domain. It uses the India point-of-view country borders (ne_10m_admin_0_countries_ind) so the borders of India are drawn
as India shows them.

Run:  python3 scripts/build-globe-data.py <folder with ne_10m_admin_0_countries_ind.geojson and ne_10m_populated_places_simple.geojson>
Needs numpy and matplotlib. The output is committed, so this only has to run again to change the detail or the places.

world.json   {"c": [[name, id, labelLon, labelLat, spanDeg, [ring, ...]], ...], "m": base64 land mask, "mw": columns, "mh": rows}
             A ring is [x0, y0, dx1, dy1, ...] in hundredths of a degree (first point, then steps). Rings are filled with even-odd.
places.json  [[name, country, lat, lon, population rank], ...] with lat and lon in hundredths of a degree.
"""
import base64, json, math, sys
import numpy as np
from matplotlib.path import Path

TOL = 0.045          # simplification, in degrees (about 5 km)
MIN_AREA = 0.0025    # smallest island kept, in square degrees (about 30 square km)
CELL = 0.5           # land mask cell size in degrees

def rdp(pts, tol):
    n = len(pts)
    if n < 3: return pts
    keep = np.zeros(n, bool); keep[0] = keep[-1] = True
    stack = [(0, n - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1: continue
        p, q = pts[a], pts[b]
        seg = q - p
        L = math.hypot(seg[0], seg[1])
        mid = pts[a + 1:b]
        if L == 0: d = np.hypot(mid[:, 0] - p[0], mid[:, 1] - p[1])
        else: d = np.abs(seg[0] * (mid[:, 1] - p[1]) - seg[1] * (mid[:, 0] - p[0])) / L
        i = int(np.argmax(d))
        if d[i] > tol:
            k = a + 1 + i; keep[k] = True
            stack.append((a, k)); stack.append((k, b))
    return pts[keep]

def area(pts):
    x, y = pts[:, 0], pts[:, 1]
    return 0.5 * abs(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1)))

def encode(pts):
    q = np.rint(pts * 100).astype(int)
    out = [int(q[0][0]), int(q[0][1])]
    for i in range(1, len(q)):
        out += [int(q[i][0] - q[i - 1][0]), int(q[i][1] - q[i - 1][1])]
    return out

def main(folder):
    data = json.load(open(f'{folder}/ne_10m_admin_0_countries_ind.geojson'))
    countries, rings_for_mask = [], []
    for f in data['features']:
        pr = f['properties']
        g = f['geometry']
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        rings, biggest, biggest_area = [], None, 0
        for poly in polys:
            for k, ring in enumerate(poly):
                pts = np.array(ring, float)
                if len(pts) < 4: continue
                a = area(pts)
                if a < MIN_AREA and k == 0 and len(polys) > 1: continue
                if a < MIN_AREA * 0.3: continue
                s = rdp(pts, TOL)
                if len(s) < 4: continue
                rings.append(encode(s))
                rings_for_mask.append((s, k > 0))
                if k == 0 and a > biggest_area: biggest, biggest_area = pts, a
        if not rings:
            # a very small country (an island nation): keep its largest piece so it can still be chosen
            best = max((np.array(r, float) for poly in polys for r in poly[:1] if len(r) >= 4), key=area, default=None)
            if best is None: continue
            s = rdp(best, TOL / 3)
            rings.append(encode(s)); rings_for_mask.append((s, False)); biggest = best
        if biggest is None: continue
        w = biggest[:, 0].max() - biggest[:, 0].min(); h = biggest[:, 1].max() - biggest[:, 1].min()
        span = round(max(w * math.cos(math.radians(float(np.mean(biggest[:, 1])))), h), 1)
        cid = pr.get('ADM0_A3') or pr.get('ISO_A3')
        countries.append([pr['NAME'], cid, round(pr['LABEL_X'], 2), round(pr['LABEL_Y'], 2), span, rings])
    countries.sort(key=lambda c: c[0])
    # land mask: cell centres, rows from north to south
    cols, rows = int(360 / CELL), int(180 / CELL)
    xs = -180 + CELL * (np.arange(cols) + 0.5); ys = 90 - CELL * (np.arange(rows) + 0.5)
    gx, gy = np.meshgrid(xs, ys)
    grid = np.column_stack([gx.ravel(), gy.ravel()])
    mask = np.zeros(len(grid), bool)
    for pts, hole in rings_for_mask:
        lo, hi = pts.min(axis=0), pts.max(axis=0)
        sel = np.where((grid[:, 0] >= lo[0]) & (grid[:, 0] <= hi[0]) & (grid[:, 1] >= lo[1]) & (grid[:, 1] <= hi[1]))[0]
        if not len(sel): continue
        inside = Path(pts).contains_points(grid[sel])
        mask[sel[inside]] = ~mask[sel[inside]] if hole else True
    bits = np.packbits(mask)
    world = {'c': countries, 'm': base64.b64encode(bits.tobytes()).decode(), 'mw': cols, 'mh': rows}
    json.dump(world, open('src/data/globe/world.json', 'w'), separators=(',', ':'), ensure_ascii=False)

    pl = json.load(open(f'{folder}/ne_10m_populated_places_simple.geojson'))['features']
    places = []
    for f in pl:
        p = f['properties']; pop = p.get('pop_max') or 0
        capital = p.get('adm0cap') == 1
        if not (capital or pop >= 150000): continue
        rank = 0 if capital else (1 if pop >= 1000000 else 2)
        places.append([p['name'], p['adm0name'], round(p['latitude'] * 100), round(p['longitude'] * 100), rank, p.get('adm0_a3') or '', pop])
    places.sort(key=lambda x: -x[6])
    places = [x[:6] for x in places]
    json.dump(places, open('src/data/globe/places.json', 'w'), separators=(',', ':'), ensure_ascii=False)
    print(len(countries), 'countries,', sum(len(c[5]) for c in countries), 'rings,', len(places), 'places')

main(sys.argv[1])
