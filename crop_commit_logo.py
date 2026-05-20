from PIL import Image

def crop_commit():
    img = Image.open('commit_logo.png').convert('RGBA')
    alpha = img.split()[-1]
    bbox = alpha.getbbox()
    if bbox:
        cropped = img.crop(bbox)
        cropped.save('commit_logo_cropped.png')
        print(f"Cropped commit_logo.png from {img.size} to {cropped.size}")
    else:
        print("No bounding box found for commit_logo.png")

if __name__ == '__main__':
    crop_commit()
