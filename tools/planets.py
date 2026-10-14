# Cuts the six photoreal planets out of the flight plates (сайт2/assets/plates/path_*.png) for the home "system":
# a disc mask at the limb measured by tools/limbs.py (ORBS in src/voyage.js) + the thin lit atmosphere just outside it.
# Saturn keeps its rings: outside the disc the alpha comes from brightness inside the ring band, fading at both tips.
# usage: <venv>\Scripts\python.exe tools/planets.py   → dist/assets/system/{id}.webp
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'dist', 'assets', 'system')
os.makedirs(OUT, exist_ok=True)
# id: centre (uv) and radius (frame heights) — same numbers as ORBS['path-*']
DISCS = {
 'luna':    ((.554, .479), .382),
 'saturn':  ((.55, .469), .345),
 'venus':   ((.553, .465), .388),
 'mars':    ((.624, .465), .421),
 'earth':   ((.618, .491), .44),
 'neptune': ((.625, .465), .428),
}

# lit from the left in their plates: mirrored so all six share one sun on the right (no text on a planet to betray it)
FLIP = {'saturn', 'venus'}

def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

for pid, ((u, v), rr) in DISCS.items():
    im = Image.open(os.path.join(ROOT, 'сайт2', 'assets', 'plates', f'path_{pid}.png')).convert('RGB')
    W, H = im.size
    cx, cy, r = u * W, v * H, rr * H
    if pid == 'saturn':
        hw, top, bot = 2.3 * r, 1.12 * r, 1.12 * r
    else:
        hw = top = bot = 1.1 * r
    x0, y0 = int(round(cx - hw)), int(round(cy - top))
    x1, y1 = int(round(cx + hw)), int(round(cy + bot))
    # pad with black where the crop leaves the frame
    canvas = Image.new('RGB', (x1 - x0, y1 - y0))
    canvas.paste(im, (-x0, -y0))
    a = np.asarray(canvas).astype(np.float32) / 255
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    px, py = xx + x0 - cx, yy + y0 - cy
    d = np.hypot(px, py) / r
    lum = a @ np.array([.2126, .7152, .0722], np.float32)
    disc = 1 - smooth(.985, 1.0, d)                                  # the planet itself
    # lit atmosphere just past the limb — only on the sunlit (upper-right) side, where no foreground rocks touch the disc
    sx = -1 if pid in FLIP else 1
    lit = smooth(-.1, .6, (sx * px * .7 - py * .7) / np.maximum(d * r, 1))
    halo = smooth(1.08, 1.0, d) * np.clip((lum - .03) * 3.5, 0, 1) * lit
    alpha = np.maximum(disc, halo)
    if pid == 'saturn':
        # ring band: the rings run along a tilted line through the planet; keep what is bright near that line
        ang = np.deg2rad(15)
        along = (px * np.cos(ang) + py * np.sin(ang)) / r
        across = (-px * np.sin(ang) + py * np.cos(ang)) / r
        wid = .55 * np.sqrt(np.clip(1 - (along / 2.7) ** 2, 0, 1)) + .08   # projected ellipse of the rings
        band = smooth(wid + .1, wid - .05, np.abs(across)) * smooth(2.3, 1.8, np.abs(along))
        ring = band * np.clip((lum - .06) * 2.6, 0, 1)
        alpha = np.maximum(alpha, ring)
    rgba = np.dstack([a, alpha]) * 255
    if pid in FLIP:
        rgba = rgba[:, ::-1]
    Image.fromarray(rgba.astype(np.uint8), 'RGBA').save(os.path.join(OUT, f'{pid}.webp'), quality=88, method=6)
    print(pid, w, h)
