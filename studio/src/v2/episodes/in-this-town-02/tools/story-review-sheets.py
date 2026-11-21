"""Package existing native PNGs for review. Does not render or approve images."""
import hashlib
import json
import math
from pathlib import Path
import zipfile
from PIL import Image, ImageDraw

studio = Path(__file__).resolve().parents[5]
out = studio / 'out/v2-episodes/in-this-town-02'
source = out / 'three-frame-review'
report = json.loads((source / 'THREE_FRAME_REVIEW.json').read_text(encoding='utf-8'))
assert report['approved'] is False
rows = {}
for item in report['frames']:
    rows.setdefault(item['shot'], {})[item['point']] = item
assert len(rows) == report['shotCount']
dest = out / 'story-polish-review'
dest.mkdir(parents=True, exist_ok=True)
pages = []
items = list(rows.items())
for page in range(math.ceil(len(items) / 6)):
    subset = items[page * 6:(page + 1) * 6]
    sheet = Image.new('RGB', (540, len(subset) * 344), '#20252b')
    draw = ImageDraw.Draw(sheet)
    for row, (shot, points) in enumerate(subset):
        for col, point in enumerate(['start', 'middle', 'end']):
            item = points[point]
            filename = item['file']
            assert Path(filename).name == filename
            with Image.open(source / filename) as im:
                im.thumbnail((180, 320))
                sheet.paste(im.convert('RGB'), (col * 180, row * 344 + 24))
            draw.text((col * 180 + 4, row * 344 + 5), f'{shot} {point} f{item["frame"]}', fill='white')
    name = f'story-page-{page + 1:02d}.jpg'
    sheet.save(dest / name, quality=90)
    pages.append(name)
packet = {**report, 'contactSheets': pages, 'nativePngDirectory': str(source),
          'note': 'New source review, not approved. Inspect native PNGs for fine clipping, then moving clips.'}
(dest / 'STORY_REVIEW.json').write_text(json.dumps(packet, indent=2) + '\n', encoding='utf-8')
archive = out / 'EP02_New_Story_Review.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for name in pages + ['STORY_REVIEW.json']:
        z.write(dest / name, name)
print(json.dumps({'stage': 'NEW_STORY_STILLS_READY_FOR_INSPECTION', 'sheets': len(pages),
                  'zip': str(archive), 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
                  'visualApproval': False}, indent=2))
