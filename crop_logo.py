from PIL import Image

def analyze_and_crop():
    img = Image.open('assets/logo.png').convert('RGBA')
    w, h = img.size
    pixels = img.load()
    
    # Find bounding box for alpha > 5
    min_x, min_y = w, h
    max_x, max_y = 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > 5:
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
                
    print(f"Original size: {w}x{h}")
    print(f"Bounding box with alpha > 5: x_min={min_x}, y_min={min_y}, x_max={max_x}, y_max={max_y}")
    
    # If the bounding box is smaller than the image, crop it!
    if min_x > 0 or min_y > 0 or max_x < w - 1 or max_y < h - 1:
        cropped = img.crop((min_x, min_y, max_x + 1, max_y + 1))
        cropped.save('assets/logo.png')
        print(f"Successfully cropped logo to size: {cropped.size[0]}x{cropped.size[1]}")
    else:
        print("No cropping needed.")

if __name__ == '__main__':
    analyze_and_crop()
