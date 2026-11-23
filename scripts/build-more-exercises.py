"""
Adds more exercises from the open "free-exercise-db" dataset (public domain, Unlicense) to the Exercise Library.

Usage:  python3 scripts/build-more-exercises.py /path/to/free-exercise-db

Chooses by rule instead of by name: every stretch, every body-weight move that is not for experts, band, exercise-ball and
foam-roller moves, plus a few dumbbell, kettlebell and medicine-ball moves for each muscle group. Skips what the library already has,
so it is safe to run again. Writes src/data/exerciseLibrary.json and small WebP pictures into public/exercises/.
"""
import json
import os
import re
import sys

from PIL import Image

EQUIPMENT = {
    'body only': 'bodyweight', None: 'bodyweight', 'barbell': 'barbell', 'e-z curl bar': 'barbell', 'dumbbell': 'dumbbell',
    'machine': 'machine', 'cable': 'machine', 'kettlebells': 'other', 'bands': 'other', 'exercise ball': 'other',
    'foam roll': 'other', 'medicine ball': 'other', 'other': 'other',
}
LEVELS = {'beginner': 'beginner', 'intermediate': 'intermediate', 'expert': 'advanced'}
MUSCLE_NAMES = {'abdominals': 'abs', 'middle back': 'mid back', 'lats': 'lats', 'quadriceps': 'quads'}
GROUP_OF_MUSCLE = {
    'chest': 'chest', 'lats': 'back', 'middle back': 'back', 'lower back': 'back', 'traps': 'back', 'shoulders': 'shoulders',
    'biceps': 'arms', 'triceps': 'arms', 'forearms': 'arms', 'quadriceps': 'legs', 'hamstrings': 'legs', 'glutes': 'legs',
    'calves': 'legs', 'abductors': 'legs', 'adductors': 'legs', 'abdominals': 'core', 'neck': 'stretching',
}
CAPS = {'dumbbell': 3, 'kettlebells': 2, 'medicine ball': 1}  # per group, so the list stays balanced and the download small
SKIP_CATEGORIES = {'olympic weightlifting', 'strongman', 'powerlifting'}
# Left out on purpose: sprint and skill drills, Olympic-style kettlebell lifts, moves that need a partner or a bar, odd names, and neck loading.
EXCLUDE = ["Gorilla Chin/Crunch", "Spell Caster", "Butt-Ups", "Bottoms Up", "Moving Claw Series", "Linear 3-Part Start Technique", "Linear Acceleration Wall Drill", "Trail Running/Walking", "Kneeling Arm Drill", "Janda Sit-Up", "Wind Sprints", "Downward Facing Balance", "Prone Manual Hamstring", "Isometric Chest Squeezes", "Alternating Hang Clean", "Double Kettlebell Alternating Hang Clean", "Double Kettlebell Jerk", "Kettlebell Sumo High Pull", "Bottoms-Up Clean From The Hang Position", "Advanced Kettlebell Windmill", "Double Kettlebell Windmill", "Natural Glute Ham Raise", "Floor Glute-Ham Raise", "Vertical Swing", "Backward Medicine Ball Throw", "One-Arm Medicine Ball Slam", "Frog Sit-Ups", "Body-Up", "Weighted Ball Hyperextension", "Isometric Wipers", "Carioca Quick Step", "Single-Arm Push-Up", "Iron Crosses (stretch)", "Frog Hops", "Stomach Vacuum", "One Handed Hang", "Isometric Neck Exercise - Front And Back", "Isometric Neck Exercise - Sides", "Elbows Back", "Scapular Pull-Up", "V-Bar Pullup", "Wide-Grip Rear Pull-Up", "Catch and Overhead Throw", "Kettlebell Dead Clean", "Double Kettlebell Push Press", "Kettlebell Figure 8", "Kettlebell Pass Between The Legs", "Leg-Over Floor Press", "Front Squats With Two Kettlebells", "Chest Push (multiple response)", "Kettlebell Hang Clean"]



def slug(text):
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', text.lower())).strip('-')


def wanted(item):
    equipment, level, category = item.get('equipment'), item['level'], item['category']
    if category in SKIP_CATEGORIES or len(item['images']) < 2:
        return False
    if category == 'stretching':
        return True
    if level == 'expert':
        return False
    if equipment in ('body only', None, 'bands', 'exercise ball', 'foam roll'):
        return category in ('strength', 'plyometrics', 'cardio')
    if equipment in ('dumbbell', 'kettlebells', 'medicine ball'):
        return level == 'beginner' or equipment == 'kettlebells'
    return False


def group_of(item):
    if item['category'] == 'stretching':
        return 'stretching'
    if item['category'] in ('plyometrics', 'cardio'):
        return 'cardio'
    return GROUP_OF_MUSCLE.get(item['primaryMuscles'][0], 'core')


def main(source):
    data = json.load(open(os.path.join(source, 'dist', 'exercises.json'), encoding='utf-8'))
    path = os.path.join('src', 'data', 'exerciseLibrary.json')
    library = json.load(open(path, encoding='utf-8'))
    have = {entry['id'] for entry in library}
    used = {}
    added = 0
    for item in sorted(data, key=lambda entry: entry['name']):
        key = slug(item['name'])
        if key in have or item['name'] in EXCLUDE or not wanted(item):
            continue
        group = group_of(item)
        cap = CAPS.get(item.get('equipment'))
        if cap is not None:
            bucket = (item.get('equipment'), group)
            if used.get(bucket, 0) >= cap:
                continue
            used[bucket] = used.get(bucket, 0) + 1
        folder = os.path.join('public', 'exercises', key)
        os.makedirs(folder, exist_ok=True)
        for index, rel in enumerate(item['images'][:2]):
            image = Image.open(os.path.join(source, 'exercises', rel)).convert('RGB')
            image.thumbnail((360, 360))
            image.save(os.path.join(folder, f'{index}.webp'), 'WEBP', quality=72, method=6)
        library.append({
            'id': key,
            'name': item['name'],
            'group': group,
            'muscles': [MUSCLE_NAMES.get(m, m) for m in item['primaryMuscles']],
            'secondary': [MUSCLE_NAMES.get(m, m) for m in item['secondaryMuscles']],
            'equipment': EQUIPMENT.get(item.get('equipment'), 'other'),
            'level': LEVELS.get(item['level'], 'beginner'),
            'steps': [re.sub(r'\s+', ' ', step).strip() for step in item['instructions'] if step.strip()],
        })
        have.add(key)
        added += 1
    with open(path, 'w', encoding='utf-8') as handle:
        json.dump(library, handle, ensure_ascii=False, indent=1)
        handle.write('\n')
    print(f'{added} exercises added; {len(library)} in the library')


if __name__ == '__main__':
    main(sys.argv[1])
