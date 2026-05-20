from PIL import Image
import os

for f in os.listdir('.'):
    if 'logo' in f.lower() and f.endswith('.png'):
        try:
            img = Image.open(f)
            if img.mode == 'RGBA':
                alpha = img.split()[-1]
                bbox = alpha.getbbox()
                print(f"{f}: RGBA, size={img.size}, bounding box of alpha > 0={bbox}")
            else:
                print(f"{f}: {img.mode}, size={img.size}, no alpha channel")
        except Exception as e:
            print(f"{f}: error={e}")
