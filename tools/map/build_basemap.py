#!/usr/bin/env python3
"""Build data/map/base.json from data/map/raw/overpass.json (an OSM Overpass `out geom` dump).

Tight story crop (Vali, 2026-11-11): every story site except Safdarjung Hospital, plus padding.
Projection: local tangent plane (equirectangular) about the Jantar Mantar protest site,
in metres. Output coords are SVG-ready: x = east, y = SOUTH (down), so a <svg> can use them
directly. Runtime markers use the same formula (see meta.projection).

No dependencies. Run from the repo root:  python3 tools/map/build_basemap.py
Re-fetch raw data with the Overpass query in meta.query (see docs/build/GAPS.md for mirrors).
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data/map/raw/overpass.json"
OUT = ROOT / "data/map/base.json"
SITES = ROOT / "data/story/sites.json"

ORIGIN = (28.62553, 77.21579)  # OSM way 1493039594 'Jantar Mantar Protest Site'
R = 6378137.0
COS0 = math.cos(math.radians(ORIGIN[0]))
BBOX = (28.6075, 77.1985, 28.6350, 77.2345)  # S, W, N, E
QUERY = ('[out:json][timeout:120][bbox:28.6075,77.1985,28.6350,77.2345];(way[building];way[highway];way[railway];'
         'way[waterway];way[natural=water];way[leisure~"park|garden|pitch"];way[landuse~"grass|recreation_ground|forest"];'
         'relation[building];relation[type=multipolygon][leisure];relation[type=multipolygon][landuse];);out geom;')


def proj(lat, lon):
    x = math.radians(lon - ORIGIN[1]) * R * COS0
    y = -math.radians(lat - ORIGIN[0]) * R
    return x, y


def dp(pts, tol):
    """Douglas-Peucker on a list of (x, y)."""
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1e-9
    imax, dmax = 0, -1.0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        d = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / L
        if d > dmax:
            imax, dmax = i, d
    if dmax <= tol:
        return [pts[0], pts[-1]]
    return dp(pts[: imax + 1], tol)[:-1] + dp(pts[imax:], tol)


def dp_ring(pts, tol):
    """Simplify a closed ring: split at the vertex farthest from the start, simplify both halves."""
    if len(pts) < 5:
        return pts
    x0, y0 = pts[0]
    k = max(range(len(pts)), key=lambda i: (pts[i][0] - x0) ** 2 + (pts[i][1] - y0) ** 2)
    out = dp(pts[: k + 1], tol)[:-1] + dp(pts[k:], tol)
    return out if len(out) >= 4 else pts


def area(pts):
    return abs(sum(pts[i][0] * pts[i - 1][1] - pts[i - 1][0] * pts[i][1] for i in range(len(pts)))) / 2


def flat(pts):
    return [v for p in pts for v in (round(p[0], 1), round(p[1], 1))]


ROAD_CLASS = {
    "motorway": "major", "trunk": "major", "primary": "major", "motorway_link": "major", "trunk_link": "major", "primary_link": "major",
    "secondary": "secondary", "secondary_link": "secondary", "tertiary": "tertiary", "tertiary_link": "tertiary",
    "residential": "minor", "unclassified": "minor", "living_street": "minor", "service": "service",
    "pedestrian": "path", "footway": "path", "path": "path", "cycleway": "path", "steps": "path", "track": "service",
}


def main():
    raw = json.loads(RAW.read_text())
    layers = {"buildings": [], "green": [], "water": [], "roads": [], "rail": []}
    names = []
    dropped = 0

    def rings_of(el):
        if el["type"] == "way" and "geometry" in el:
            return [[proj(g["lat"], g["lon"]) for g in el["geometry"]]]
        if el["type"] == "relation":
            return [[proj(g["lat"], g["lon"]) for g in m["geometry"]]
                    for m in el.get("members", []) if m.get("role") == "outer" and "geometry" in m]
        return []

    for el in raw["elements"]:
        t = el.get("tags", {})
        rings = rings_of(el)
        if not rings:
            continue
        if "building" in t:
            for r in rings:
                if len(r) < 4 or area(r) < 20:
                    dropped += 1
                    continue
                layers["buildings"].append(flat(dp_ring(r, 0.5)))
        elif t.get("leisure") in ("park", "garden", "pitch") or t.get("landuse") in ("grass", "recreation_ground", "forest"):
            for r in rings:
                if len(r) >= 4:
                    layers["green"].append(flat(dp_ring(r, 1.0)))
        elif t.get("natural") == "water" or "waterway" in t:
            for r in rings:
                layers["water"].append(flat(dp_ring(r, 1.0) if r[0] == r[-1] else dp(r, 1.0)))
        elif "highway" in t:
            c = ROAD_CLASS.get(t["highway"])
            if not c:
                continue
            item = {"c": c, "p": flat(dp(rings[0], 0.7))}
            if t.get("name"):
                item["n"] = t["name"]
            if t.get("tunnel") in ("yes", "building_passage") or t.get("layer", "0").startswith("-"):
                item["tunnel"] = True
            if t.get("junction") == "roundabout":
                item["rb"] = True
            layers["roads"].append(item)
        elif "railway" in t:
            item = {"k": t["railway"], "p": flat(dp(rings[0], 1.0))}
            if t.get("tunnel") == "yes" or t["railway"] == "subway":
                item["tunnel"] = True
            layers["rail"].append(item)

    s, w, n, e = BBOX
    x0, y1 = proj(s, w)
    x1, y0 = proj(n, e)
    sites = json.loads(SITES.read_text())["sites"]
    anchors = {}
    for st in sites:
        x, y = proj(st["lat"], st["lon"])
        anchors[st["id"]] = {"x": round(x, 1), "y": round(y, 1), "in_frame": x0 <= x <= x1 and y0 <= y <= y1,
                             "coord_status": st["coord_status"]}

    base = {
        "meta": {
            "source": "OpenStreetMap via Overpass API, fetched 2026-11-11",
            "attribution": "© OpenStreetMap contributors (ODbL)",
            "query": QUERY,
            "crop": "Tight story crop (Vali, 2026-11-11): all story sites except Safdarjung Hospital (off-frame, ~6.5 km south), plus ~250 m padding.",
            "projection": {
                "type": "local equirectangular tangent plane",
                "origin": {"lat": ORIGIN[0], "lon": ORIGIN[1], "note": "OSM way 1493039594 'Jantar Mantar Protest Site'"},
                "R": R,
                "formula": "x = rad(lon - lon0) * R * cos(rad(lat0)); y = -rad(lat - lat0) * R   (metres; y points south for SVG)",
            },
            "viewBox": [round(x0, 1), round(y0, 1), round(x1 - x0, 1), round(y1 - y0, 1)],
            "simplify": "Douglas-Peucker: buildings 0.5 m, roads 0.7 m, green/water/rail 1 m; coords rounded to 0.1 m; buildings < 20 m² dropped",
            "counts": {k: len(v) for k, v in layers.items()},
            "dropped_small_buildings": dropped,
            "road_classes": sorted(set(ROAD_CLASS.values())),
            "encoding": "Polygons and lines are flat [x0,y0,x1,y1,...] arrays. roads[]: {c: class, p: coords, n?: name, tunnel?, rb?: roundabout}. rail[]: {k: railway tag, p, tunnel?}.",
        },
        "anchors": anchors,
        "layers": layers,
    }
    OUT.write_text(json.dumps(base, ensure_ascii=False, separators=(",", ":")))
    print(json.dumps(base["meta"]["counts"]), "viewBox", base["meta"]["viewBox"], f"{OUT.stat().st_size/1024:.0f} KB")
    print("off-frame anchors:", [k for k, v in anchors.items() if not v["in_frame"]])


if __name__ == "__main__":
    main()
