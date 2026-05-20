import os
from PIL import Image

for f in os.listdir('.'):
    if 'logo' in f.lower() and f.endswith('.png'):
        try:
            img = Image.open(f)
            print(f"{f}: size={img.size}, mode={img.mode}")
        except Exception as e:
            print(f"{f}: error={e}")

for f in os.listdir('assets'):
    if 'logo' in f.lower() and f.endswith('.png'):
        try:
            img = Image.open(os.path.join('assets', f))
            print(f"assets/{f}: size={img.size}, mode={img.mode}")
        except Exception as e:
            print(f"assets/{f}: error={e}")
