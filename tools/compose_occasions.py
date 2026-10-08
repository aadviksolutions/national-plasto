"""Compose 'Furniture for every occasion' card images from real catalogue cut-outs."""
import json, os
from PIL import Image, ImageDraw, ImageFilter, ImageOps

os.chdir(r'C:\Users\tannu\national-plasto')
src = open('js/catalogue-2026.js', encoding='utf-8').read()
D = json.loads(src[src.index('['):src.rindex(']') + 1])
IDX = {(p['b'], p['n']): p for p in D}
W, H = 1200, 948
OUT = 'images/occasions'
os.makedirs(OUT, exist_ok=True)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def background(wall, floor, horizon):
    bg = Image.new('RGB', (W, H))
    d = ImageDraw.Draw(bg)
    for y in range(H):
        if y < horizon:
            c = lerp(lerp(wall, (255, 255, 255), 0.35), wall, y / horizon)
        else:
            c = lerp(floor, lerp(floor, (0, 0, 0), 0.06), (y - horizon) / (H - horizon))
        d.line([(0, y), (W, y)], fill=c)
    # soft light spot behind the products
    glow = Image.new('L', (W, H), 0)
    ImageDraw.Draw(glow).ellipse([W * 0.12, -H * 0.15, W * 0.88, horizon * 1.05], fill=110)
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    bg.paste(Image.new('RGB', (W, H), (255, 255, 255)), (0, 0), glow)
    # gentle horizon line
    hl = Image.new('L', (W, H), 0)
    ImageDraw.Draw(hl).rectangle([0, horizon - 1, W, horizon + 1], fill=60)
    hl = hl.filter(ImageFilter.GaussianBlur(3))
    bg.paste(Image.new('RGB', (W, H), lerp(floor, (0, 0, 0), 0.12)), (0, 0), hl)
    return bg


def cutout(b, n, i=0, mirror=False):
    im = Image.open(IDX[(b, n)]['img'][i]['f']).convert('RGBA')
    im = im.crop(im.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox())
    return ImageOps.mirror(im) if mirror else im


def place(bg, item, cx, base, h):
    """Put item with its feet on y=base, centred on cx, scaled to height h."""
    h = int(h * 1.1)
    im = item.resize((int(item.width * h / item.height), h), Image.LANCZOS)
    x, y = int(cx - im.width / 2), int(base - h)
    # contact shadow
    sh = Image.new('L', (W, H), 0)
    sw = im.width * 0.55
    ImageDraw.Draw(sh).ellipse([cx - sw, base - 16, cx + sw, base + 16], fill=120)
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    bg.paste(Image.new('RGB', (W, H), (60, 50, 40)), (0, 0), sh.point(lambda a: int(a * 0.55)))
    bg.paste(im, (x, y), im)


# Each scene: wall colour, floor colour, horizon y, then items back-to-front:
# (brand, model, image index, mirror, centre x, baseline y, height)
SCENES = {
    'living-room': ((236, 226, 212), (214, 199, 180), 610, [
        ('Next', 'Fantasy', 0, False, 600, 760, 250),
        ('Next', 'Magnetik', 0, False, 300, 830, 520),
        ('Next', 'Vanity Super Deluxe', 0, True, 905, 830, 520),
    ]),
    'dining-sets': ((240, 232, 220), (220, 206, 188), 600, [
        ('Next', 'Cherish with Caliber', 0, False, 600, 860, 640),
    ]),
    'kids': ((253, 236, 214), (246, 214, 180), 620, [
        ('Next', 'Kidjee Jr', 0, False, 640, 760, 250),
        ('Next', 'Rocker', 0, False, 280, 860, 440),
        ('Next', 'Bonny', 0, True, 960, 860, 420),
    ]),
    'storage': ((226, 232, 240), (203, 211, 222), 640, [
        ('Next', 'Utility Rack 5', 0, False, 940, 830, 600),
        ('Next', 'Cellar Wardrobe', 0, False, 560, 850, 520),
        ('Next', 'Wardrobe', 0, False, 230, 860, 700),
    ]),
    'kitchen-utility': ((248, 240, 226), (232, 217, 196), 640, [
        ('Next', 'Rozy', 0, False, 600, 760, 300),
        ('Next', 'Swift', 0, False, 330, 860, 470),
        ('Next', 'Marvel', 0, False, 880, 860, 260),
    ]),
    'schools': ((225, 235, 245), (200, 214, 230), 620, [
        ('Next', 'Toss', 0, False, 600, 780, 470),
        ('National', 'Activa', 0, False, 300, 860, 540),
        ('Sapphire', 'Ideal', 0, True, 900, 860, 540),
    ]),
    'hotels-resorts': ((228, 236, 224), (205, 216, 198), 620, [
        ('Next', 'Maze', 0, False, 600, 790, 300),
        ('Next', 'Ultimate', 0, False, 290, 860, 480),
        ('Next', 'Ultimate', 0, True, 910, 860, 480),
    ]),
    'cafes-restaurants': ((240, 230, 222), (218, 202, 190), 620, [
        ('Captain', 'Flora', 0, False, 600, 800, 290),
        ('Next', 'Kraft', 0, False, 250, 860, 500),
        ('Next', 'Matt', 0, True, 950, 860, 500),
    ]),
}

for name, (wall, floor, horizon, items) in SCENES.items():
    bg = background(wall, floor, horizon)
    for b, n, i, mir, cx, base, h in items:
        place(bg, cutout(b, n, i, mir), cx, base, h)
    bg.save(f'{OUT}/{name}.jpg', quality=86, optimize=True, progressive=True)
    print(name)
