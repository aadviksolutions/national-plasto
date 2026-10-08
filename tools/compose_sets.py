"""Build clean dining-set photos (no models) from the catalogue's own table and chair cut-outs.

Some photoshoot set photos had models in every shot, so those sets are rebuilt here from the
separate table / chair photos of the same models. Output: transparent .webp cut-outs, 820px tall,
matching the rest of images/catalogue.

Run from the repo root:  python tools/compose_sets.py
"""
import json
from PIL import Image, ImageOps

SRC = open('js/catalogue-2026.js', encoding='utf-8').read()
CAT = json.loads(SRC[SRC.index('['):SRC.rindex(']') + 1])
H = 820


def part(brand, name, i, cat=None):
    p = next(p for p in CAT if p['b'] == brand and p['n'] == name and (cat is None or p['c'] == cat))
    im = Image.open(p['img'][i]['f']).convert('RGBA')
    return im.crop(im.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox())


def scaled(im, h):
    return im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)


def compose(table, chair, table_h, chair_h, back_h, gap, back_inset, stool=False):
    """Table in the middle, a chair either side in front and (for chairs) two behind the table."""
    t, c = scaled(table, table_h), scaled(chair, chair_h)
    cm = ImageOps.mirror(c) if not stool else c
    width = c.width * 2 + t.width + gap * 2
    canvas = Image.new('RGBA', (width + 40, H), (0, 0, 0, 0))
    floor = H - 20
    tx = (canvas.width - t.width) // 2
    if back_h:
        b = scaled(chair, back_h)
        bm = ImageOps.mirror(b)
        back_floor = floor - (chair_h - back_h) - 40
        canvas.alpha_composite(b, (tx + back_inset, back_floor - b.height))
        canvas.alpha_composite(bm, (tx + t.width - back_inset - bm.width, back_floor - bm.height))
    canvas.alpha_composite(t, (tx, floor - t.height - 8))
    canvas.alpha_composite(c, (tx - gap - c.width + c.width // 4, floor - c.height))
    canvas.alpha_composite(cm, (tx + t.width + gap - c.width // 4, floor - cm.height))
    canvas = canvas.crop(canvas.getchannel('A').getbbox())
    pad = 20
    out = Image.new('RGBA', (canvas.width + pad * 2, canvas.height + pad * 2), (0, 0, 0, 0))
    out.alpha_composite(canvas, (pad, pad))
    if out.height != H:
        out = scaled(out, H)
    return out


SETS = {
    # file stem: (table, chair, table_h, chair_h, back_h, gap, back_inset, stool)
    'next-glance-with-kinky-set-1': (part('Next', 'Glance', 0, 'Tables'), part('Next', 'Kinky', 2), 470, 560, 500, -90, 40, False),
    'next-maze-with-spread-set-1': (part('Next', 'Maze', 0, 'Tables'), part('Next', 'Spread', 1), 500, 600, 520, 10, -60, False),
    'next-maze-with-spread-set-2': (part('Next', 'Maze', 1, 'Tables'), part('Next', 'Spread', 2), 500, 600, 520, 10, -60, False),
    'next-mesh-with-cross-set-1': (part('Next', 'Mesh', 1, 'Tables'), part('Next', 'Cross', 1, 'Stools'), 270, 300, 0, 40, 0, True),
    'next-mesh-with-cross-set-2': (part('Next', 'Mesh', 2, 'Tables'), part('Next', 'Cross', 0, 'Stools'), 270, 300, 0, 40, 0, True),
}

if __name__ == '__main__':
    for stem, args in SETS.items():
        im = compose(*args)
        im.save(f'images/catalogue/next/{stem}.webp', quality=88, method=6)
        print(stem, im.size)
