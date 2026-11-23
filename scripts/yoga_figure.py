"""
Draws the yoga pose pictures. Original artwork made from joint angles, so there is no licence to worry about.

A pose gives the direction of each body segment as an angle in degrees on the picture: 0 points right, 90 points down,
180 points left and -90 points up. The figure is placed so its lowest point rests on the floor line and is centred.
"""
import math
from PIL import Image, ImageDraw

W, H = 360, 240
SS = 4  # draw four times larger, then shrink, for smooth edges
FLOOR = 206
BG = (241, 245, 249)
FLOOR_COLOR = (203, 213, 225)
BODY = (51, 65, 85)
FAR = (148, 163, 184)
ACCENT = (234, 88, 12)

L = {'torso': 60, 'neck': 10, 'upper': 33, 'fore': 31, 'thigh': 45, 'shin': 43, 'foot': 15}
HEAD_R = 13


def step(point, angle, length):
    a = math.radians(angle)
    return (point[0] + math.cos(a) * length, point[1] + math.sin(a) * length)


def joints(pose):
    """pose keys: t (torso), head, an (near arm: upper, fore), af (far arm), ln (near leg: thigh, shin, foot), lf (far leg)."""
    hip = (0.0, 0.0)
    shoulder = step(hip, pose['t'], L['torso'])
    neck = step(shoulder, pose['head'], L['neck'])
    head = step(neck, pose['head'], HEAD_R)
    out = {'hip': hip, 'shoulder': shoulder, 'neck': neck, 'head': head}
    for side in ('n', 'f'):
        upper, fore = pose['a' + side]
        elbow = step(shoulder, upper, L['upper'])
        wrist = step(elbow, fore, L['fore'])
        thigh, shin, foot = pose['l' + side]
        knee = step(hip, thigh, L['thigh'])
        ankle = step(knee, shin, L['shin'])
        toe = step(ankle, foot, L['foot'])
        out.update({f'elbow_{side}': elbow, f'wrist_{side}': wrist, f'knee_{side}': knee, f'ankle_{side}': ankle, f'toe_{side}': toe})
    return out


def fit_scale(points):
    """The scale that makes one figure fill the picture."""
    xs = [p[0] for p in points.values()]
    ys = [p[1] for p in points.values()]
    width = max(xs) - min(xs) + 2 * HEAD_R
    height = max(ys) - min(ys) + 2 * HEAD_R
    return max(0.9, min(0.86 * W / width, 0.84 * FLOOR / height, 1.25))


def place(points, fixed_scale=None):
    """Centres the figure, scales it up to fill the picture and rests its lowest point on the floor. Returns the points and the scale.
    Pass fixed_scale to draw every frame of one pose at the same size, so the figure does not jump in size while it moves."""
    xs = [p[0] for p in points.values()]
    ys = [p[1] for p in points.values()]
    width = max(xs) - min(xs) + 2 * HEAD_R
    height = max(ys) - min(ys) + 2 * HEAD_R
    scale = fixed_scale if fixed_scale else fit_scale(points)
    cx = (min(xs) + max(xs)) / 2
    placed = {name: (W / 2 + (p[0] - cx) * scale, p[1] * scale) for name, p in points.items()}
    shift_y = (FLOOR - 6 * scale) - max(y for _, y in placed.values())
    return {name: (p[0], p[1] + shift_y) for name, p in placed.items()}, scale


def draw_pose(pose, accent_tip=True, fixed_scale=None):
    pts, k = place(joints(pose), fixed_scale)
    image = Image.new('RGB', (W * SS, H * SS), BG)
    draw = ImageDraw.Draw(image)

    def line(a, b, width, color):
        width = width * 1.12
        pa = (a[0] * SS, a[1] * SS)
        pb = (b[0] * SS, b[1] * SS)
        draw.line([pa, pb], fill=color, width=int(width * SS))
        r = width * SS / 2
        for p in (pa, pb):
            draw.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=color)

    draw.rectangle([0, (FLOOR) * SS, W * SS, H * SS], fill=FLOOR_COLOR)
    # far limbs first, so the near ones are drawn on top
    for side, color, width in (('f', FAR, 10), ('n', BODY, 11)):
        line(pts['hip'], pts[f'knee_{side}'], width + 1, color)
        line(pts[f'knee_{side}'], pts[f'ankle_{side}'], width, color)
        line(pts[f'ankle_{side}'], pts[f'toe_{side}'], width - 2, color)
        if side == 'f':
            line(pts['shoulder'], pts['elbow_f'], width - 1, color)
            line(pts['elbow_f'], pts['wrist_f'], width - 2, color)
    line(pts['hip'], pts['shoulder'], 20, BODY)
    line(pts['shoulder'], pts['neck'], 8, BODY)
    for side in ('n',):
        line(pts['shoulder'], pts[f'elbow_{side}'], 10, BODY)
        line(pts[f'elbow_{side}'], pts[f'wrist_{side}'], 9, BODY)
    hx, hy = pts['head']
    r = HEAD_R * 1.1 * SS
    draw.ellipse([hx * SS - r, hy * SS - r, hx * SS + r, hy * SS + r], fill=BODY)
    if accent_tip:
        # a small orange dot on the hands shows where the hands are, which helps with the shape of the pose
        for side in ('n', 'f'):
            x, y = pts[f'wrist_{side}']
            rr = 4.6 * SS
            draw.ellipse([x * SS - rr, y * SS - rr, x * SS + rr, y * SS + rr], fill=ACCENT)
    return image.resize((W, H), Image.LANCZOS)


def pose(t, head=None, arms=((90, 90), (90, 90)), legs=((90, 90, 0), (90, 90, 0))):
    return {'t': t, 'head': t if head is None else head, 'an': arms[0], 'af': arms[1], 'ln': legs[0], 'lf': legs[1]}


def blend(a, b, amount):
    """A pose part of the way from a to b (amount 0 to 1). Each angle turns the short way round."""
    def turn(x, y):
        delta = (y - x + 180) % 360 - 180
        return x + delta * amount
    out = {}
    for key in a:
        if isinstance(a[key], tuple):
            out[key] = tuple(turn(x, y) for x, y in zip(a[key], b[key]))
        else:
            out[key] = turn(a[key], b[key])
    return out


def frame_scale(poses):
    """One scale for all frames of a pose: the smallest that fits every frame."""
    return min(fit_scale(joints(p)) for p in poses)
