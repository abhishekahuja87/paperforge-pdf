"""
Builds the exercise library data from the open "free-exercise-db" dataset (public domain, Unlicense).

Usage:  python3 scripts/build-exercise-library.py /path/to/free-exercise-db

Reads a hand-picked list of exercises, writes src/data/exerciseLibrary.json and small WebP pictures
(2 per exercise) into public/exercises/. Re-run it only when the list below changes.
"""
import json
import os
import re
import sys

from PIL import Image

PICKS = {
    'chest': ['Barbell Bench Press - Medium Grip', 'Incline Dumbbell Press', 'Dumbbell Bench Press', 'Dumbbell Flyes', 'Pushups', 'Incline Push-Up', 'Decline Push-Up', 'Cable Crossover', 'Butterfly', 'Dips - Chest Version', 'Push-Ups With Feet Elevated', 'Machine Bench Press'],
    'back': ['Pullups', 'Chin-Up', 'Wide-Grip Lat Pulldown', 'Seated Cable Rows', 'Bent Over Barbell Row', 'One-Arm Dumbbell Row', 'Inverted Row', 'Straight-Arm Pulldown', 'V-Bar Pulldown', 'Barbell Deadlift', 'Hyperextensions (Back Extensions)', 'Superman', 'Barbell Shrug', 'Dumbbell Shrug'],
    'shoulders': ['Dumbbell Shoulder Press', 'Barbell Shoulder Press', 'Arnold Dumbbell Press', 'Side Lateral Raise', 'Front Dumbbell Raise', 'Bent Over Dumbbell Rear Delt Raise With Head On Bench', 'Face Pull', 'Standing Dumbbell Upright Row', 'Band Pull Apart', 'Arm Circles', 'Machine Shoulder (Military) Press', 'Cable Rear Delt Fly'],
    'arms': ['Barbell Curl', 'Dumbbell Bicep Curl', 'Hammer Curls', 'Concentration Curls', 'Preacher Curl', 'Incline Dumbbell Curl', 'Standing Biceps Cable Curl', 'Zottman Curl', 'Triceps Pushdown', 'Triceps Pushdown - Rope Attachment', 'Dips - Triceps Version', 'Bench Dips', 'EZ-Bar Skullcrusher', 'Close-Grip Barbell Bench Press', 'Tricep Dumbbell Kickback', 'Triceps Overhead Extension with Rope', 'Push-Ups - Close Triceps Position', 'Palms-Up Barbell Wrist Curl Over A Bench', 'Wrist Circles'],
    'legs': ['Barbell Squat', 'Bodyweight Squat', 'Goblet Squat', 'Dumbbell Squat', 'Front Squat (Clean Grip)', 'Leg Press', 'Leg Extensions', 'Dumbbell Lunges', 'Barbell Walking Lunge', 'Bodyweight Walking Lunge', 'Dumbbell Step Ups', 'Hack Squat', 'Romanian Deadlift', 'Lying Leg Curls', 'Seated Leg Curl', 'Butt Lift (Bridge)', 'Single Leg Glute Bridge', 'Glute Kickback', 'Pull Through', 'Standing Calf Raises', 'Seated Calf Raise', 'Standing Dumbbell Calf Raise', 'Calf Press', 'Thigh Abductor', 'Thigh Adductor', 'Monster Walk', 'Side Leg Raises', 'One-Arm Kettlebell Swings'],
    'core': ['Plank', 'Crunches', 'Russian Twist', 'Dead Bug', 'Sit-Up', 'Reverse Crunch', 'Cable Crunch', 'Ab Roller', 'Side Bridge', 'Flat Bench Lying Leg Raise', 'Air Bike', 'Cocoons', 'Pallof Press', 'Oblique Crunches', 'Alternate Heel Touchers', 'Scissor Kick', 'Jackknife Sit-Up'],
    'cardio': ['Bicycling', 'Bicycling, Stationary', 'Elliptical Trainer', 'Jogging, Treadmill', 'Running, Treadmill', 'Rope Jumping', 'Rowing, Stationary', 'Recumbent Bike', 'Fast Skipping', 'Mountain Climbers', 'Freehand Jump Squat', 'Front Box Jump', 'Rocket Jump', 'Knee Tuck Jump', 'Scissors Jump', 'Double Leg Butt Kick'],
    'stretching': ['Hamstring Stretch', 'Standing Hamstring and Calf Stretch', 'Quad Stretch', 'Dynamic Chest Stretch', "Child's Pose", 'Cat Stretch', "World's Greatest Stretch", 'Kneeling Hip Flexor', 'Standing Gastrocnemius Calf Stretch', 'Triceps Stretch', 'Standing Biceps Stretch', 'Side Neck Stretch', 'Chin To Chest Stretch', 'Hug Knees To Chest', 'Seated Floor Hamstring Stretch', 'Upper Back Stretch', 'Overhead Stretch', 'Chest And Front Of Shoulder Stretch', 'Knee Across The Body', 'Ankle Circles', "Dancer's Stretch", 'Spinal Stretch', 'Standing Hip Circles'],
}

EQUIPMENT = {
    'body only': 'bodyweight', None: 'bodyweight', 'barbell': 'barbell', 'e-z curl bar': 'barbell', 'dumbbell': 'dumbbell',
    'machine': 'machine', 'cable': 'machine', 'kettlebells': 'other', 'bands': 'other', 'exercise ball': 'other',
    'foam roll': 'other', 'medicine ball': 'other', 'other': 'other',
}
LEVELS = {'beginner': 'beginner', 'intermediate': 'intermediate', 'expert': 'advanced'}
MUSCLE_NAMES = {'abdominals': 'abs', 'middle back': 'mid back', 'lats': 'lats', 'quadriceps': 'quads'}


def slug(text):
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', text.lower())).strip('-')


def main(source):
    data = json.load(open(os.path.join(source, 'dist', 'exercises.json'), encoding='utf-8'))
    by_name = {item['name']: item for item in data}
    out_dir = os.path.join('public', 'exercises')
    os.makedirs(out_dir, exist_ok=True)
    library = []
    missing = []
    for group, names in PICKS.items():
        for name in names:
            item = by_name.get(name)
            if not item or len(item['images']) < 2:
                missing.append(name)
                continue
            key = slug(item['name'])
            folder = os.path.join(out_dir, key)
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
    os.makedirs(os.path.join('src', 'data'), exist_ok=True)
    with open(os.path.join('src', 'data', 'exerciseLibrary.json'), 'w', encoding='utf-8') as handle:
        json.dump(library, handle, ensure_ascii=False, indent=1)
        handle.write('\n')
    print(f'{len(library)} exercises written; missing: {missing}')


if __name__ == '__main__':
    main(sys.argv[1])
