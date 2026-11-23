"""
Builds the yoga poses: src/data/yogaLibrary.json and four pictures per pose in public/exercises/<id>/.
Picture 0 is the start, 1 is the hold, 2 is a third of the way in and 3 is two thirds of the way in. The page plays 0, 2, 3, 1 and back.

Usage:  python3 scripts/build-yoga-library.py

The pictures are original line figures drawn from joint angles (scripts/yoga_figure.py), so there is no licence to follow.
The pose list, with names, muscles and steps, is in scripts/yoga_poses.py. Run it again when that list changes.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from yoga_figure import blend, draw_pose, frame_scale  # noqa: E402
from yoga_poses import POSES  # noqa: E402


def main():
    library = []
    for key, name, level, muscles, secondary, start, hold, steps in POSES:
        folder = os.path.join('public', 'exercises', key)
        os.makedirs(folder, exist_ok=True)
        frames = [start, hold, blend(start, hold, 1 / 3), blend(start, hold, 2 / 3)]
        scale = frame_scale(frames)
        for index, pose in enumerate(frames):
            draw_pose(pose, fixed_scale=scale).save(os.path.join(folder, f'{index}.webp'), 'WEBP', quality=88, method=6)
        library.append({'id': key, 'name': name, 'group': 'yoga', 'muscles': muscles, 'secondary': secondary, 'equipment': 'bodyweight', 'level': level, 'frames': 4, 'steps': steps})
    os.makedirs(os.path.join('src', 'data'), exist_ok=True)
    with open(os.path.join('src', 'data', 'yogaLibrary.json'), 'w', encoding='utf-8') as handle:
        json.dump(library, handle, ensure_ascii=False, indent=1)
        handle.write('\n')
    print(f'{len(library)} yoga poses written')


if __name__ == '__main__':
    main()
