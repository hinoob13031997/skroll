# Depth maps for the film frames (white = near, black = far) -> dist/assets/film/depth/<id>.webp
# Depth Anything V2 (Small). The map is dilated a little so foreground edges stay slightly larger than the objects
# themselves: when the camera moves, the background stretches, not the edge of a rock or the jar.
# usage: <venv>\Scripts\python.exe tools/depth.py [id ...]   (venv: %LOCALAPPDATA%\moonvit-depth)
import sys, os
import numpy as np
from PIL import Image, ImageFilter
from transformers import pipeline

SRC = {'hero': '01_hero_3840x2160.png', 'luna': '02_luna_3840x2160.png', 'saturn': '03_saturn_3840x2160.png',
       'venus': '04_venus_3840x2160.png', 'mars': '05_mars_3840x2160.png', 'earth': '06_earth_3840x2160.png',
       'neptune': '07_neptune_3840x2160.png', 'final': '08_final_reveal_3840x2160.png'}
# frames "on the way": open space with the next world's planet (сайт2/IMAGE_PROMPTS.md, section 0)
for w in ('luna', 'saturn', 'venus', 'mars', 'earth', 'neptune'):
    SRC['path-' + w] = f'сайт2/assets/plates/path_{w}.png'
# open space and passing planets between the worlds (сайт2/assets/plates/new → cruise_*/pass_*)
for n in ('cruise_a', 'cruise_b', 'pass_saturn', 'pass_venus', 'pass_mars', 'pass_earth', 'pass_neptune'):
    SRC[n.replace('_', '-')] = f'сайт2/assets/plates/{n}.png'
OUT = 'dist/assets/film/depth'
W, H = 1280, 720
os.makedirs(OUT, exist_ok=True)
pipe = pipeline('depth-estimation', model='depth-anything/Depth-Anything-V2-Small-hf', device='cpu')

for id in (sys.argv[1:] or SRC):
    im = Image.open(SRC[id]).convert('RGB').resize((1540, 866), Image.LANCZOS)
    d = np.asarray(pipe(im)['predicted_depth'].squeeze(), dtype=np.float32)
    lo, hi = np.percentile(d, 1), np.percentile(d, 99.5)
    d = np.clip((d - lo) / (hi - lo), 0, 1) ** 1.1
    m = Image.fromarray((d * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
    m = m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2.2))
    m.save(f'{OUT}/{id}.webp', quality=90)
    print('ok', id)
