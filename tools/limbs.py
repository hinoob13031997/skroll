# Measures the planet discs in the film frames: rays from a rough centre find the limb (strongest bright→dark edge),
# a robust circle fit gives [cx, cy, r] in the shader's units (uv, radius in frame heights) for LIFE in src/voyage.js.
# usage: <venv>\Scripts\python.exe tools/limbs.py   → prints the circles, writes overlays to %TEMP%\limbs_<id>.jpg
import os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# id: file, rough centre and radius in 2000×1125 preview pixels, ray angles in degrees (0 = right, 90 = down)
P = {
 'luna':    ('02_luna_3840x2160.png',    (1400, 420), 470, (-100, 35)),
 'saturn':  ('03_saturn_3840x2160.png',  (1560, 680), 560, (-172, -25)),
 'venus':   ('04_venus_3840x2160.png',   (1410, 640), 620, (-172, -12)),
 'venus2':  ('04_venus_3840x2160.png',   (410, 148), 60, (-180, 180)),
 'mars':    ('05_mars_3840x2160.png',    (1150, 650), 800, (-85, -3)),
 'neptune': ('07_neptune_3840x2160.png', (1440, 840), 820, (-160, -40)),
 'path-luna':   ('сайт2/assets/plates/path_luna.png',    (1100, 530), 440, (-180, 180)),
 'path-saturn': ('сайт2/assets/plates/path_saturn.png',  (1270, 500), 330, (-175, -15)),
 'path-venus':  ('сайт2/assets/plates/path_venus.png',   (1150, 530), 430, (-180, 180)),
 'path-mars':   ('сайт2/assets/plates/path_mars.png',    (1240, 530), 470, (-180, 180)),
 'path-earth':  ('сайт2/assets/plates/path_earth.png',   (1160, 520), 430, (-180, 180)),
 'path-neptune':('сайт2/assets/plates/path_neptune.png', (1240, 530), 470, (-180, 180)),
 'pass-saturn': ('сайт2/assets/plates/pass_saturn.png',  (1154, 518), 443, (-180, 180)),
 'pass-saturn2':('сайт2/assets/plates/pass_saturn.png',  (315, 360), 180, (-180, 180)),
 'pass-venus':  ('сайт2/assets/plates/pass_venus.png',   (1442, 427), 371, (-180, 180)),
 'pass-mars':   ('сайт2/assets/plates/pass_mars.png',    (1166, 518), 450, (-180, 180)),
 'pass-mars2':  ('сайт2/assets/plates/pass_mars.png',    (392, 218), 158, (-180, 180)),
 'pass-earth':  ('сайт2/assets/plates/pass_earth.png',   (1188, 529), 448, (-180, 180)),
 'pass-earth2': ('сайт2/assets/plates/pass_earth.png',   (288, 281), 140, (-180, 180)),
 'pass-neptune':('сайт2/assets/plates/pass_neptune.png', (1166, 529), 450, (-180, 180)),
 'pass-neptune2':('сайт2/assets/plates/pass_neptune.png',(288, 387), 117, (-180, 180)),
 'neptune2':('07_neptune_3840x2160.png', (1860, 410), 105, (-180, 180)),
}

def fit(pts):
    x, y = pts[:, 0], pts[:, 1]
    A = np.c_[2 * x, 2 * y, np.ones(len(x))]
    b = x * x + y * y
    c = np.linalg.lstsq(A, b, rcond=None)[0]
    return c[0], c[1], math.sqrt(c[2] + c[0] ** 2 + c[1] ** 2)

for id, (f, (cx, cy), r, (a0, a1)) in P.items():
    im = Image.open(f).convert('L').resize((2000, 1125), Image.LANCZOS).filter(ImageFilter.GaussianBlur(2))
    L = np.asarray(im, np.float32)
    pts = []
    for a in np.linspace(a0, a1, 120):
        t = math.radians(a)
        rr = np.linspace(r * .7, r * 1.35, 400)
        xs, ys = cx + np.cos(t) * rr, cy + np.sin(t) * rr
        ok = (xs >= 1) & (xs < 1998) & (ys >= 1) & (ys < 1123)
        if ok.sum() < 60: continue
        v = L[ys[ok].astype(int), xs[ok].astype(int)]
        d = np.convolve(v, np.ones(7) / 7, 'same')
        g = d[:-6] - d[6:]
        i = int(np.argmax(g))
        if g[i] < 12: continue
        pts.append((xs[ok][i + 3], ys[ok][i + 3]))
    pts = np.array(pts)
    best = None
    rng = np.random.default_rng(1)
    for _ in range(400):  # RANSAC: rings, the jar and rocks also make edges
        s = pts[rng.choice(len(pts), 3, replace=False)]
        try: c = fit(s)
        except Exception: continue
        e = np.abs(np.hypot(pts[:, 0] - c[0], pts[:, 1] - c[1]) - c[2])
        n = (e < 4).sum()
        if best is None or n > best[0]: best = (n, e < 4)
    X, Y, R = fit(pts[best[1]])
    print(f"{id:9s} planet:[{X/2000:.3f},{Y/1125:.3f},{R/1125:.3f}]  inliers {best[0]}/{len(pts)}")
    ov = Image.open(f).convert('RGB').resize((1000, 562))
    d = ImageDraw.Draw(ov)
    d.ellipse([(X - R) / 2, (Y - R) / 2, (X + R) / 2, (Y + R) / 2], outline=(0, 255, 0), width=2)
    for p in pts[best[1]]: d.point((p[0] / 2, p[1] / 2), fill=(255, 0, 255))
    ov.save(os.path.join(os.environ['TEMP'], f'limbs_{id}.jpg'))


