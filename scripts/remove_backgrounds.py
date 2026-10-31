import os
from pathlib import Path
from rembg import remove
from PIL import Image

ASSET_DIRS = [
    Path("apps/web/public/images/mascots"),
    Path("apps/web/public/images/empty-states"),
    Path("apps/web/public/images/illustrations"),
]

def process_file(file_path: Path):
    if file_path.suffix.lower() not in [".png", ".jpg", ".jpeg"]:
        return
    # Skip wide landscape hero banners because they are meant to be full scenic backgrounds
    if "hero-banner" in file_path.name:
        print(f"Skipping scenic landscape banner: {file_path.name}")
        return

    print(f"Removing background from: {file_path} ...")
    try:
        input_image = Image.open(file_path).convert("RGBA")
        output_image = remove(input_image)
        # Save as PNG
        out_path = file_path.with_suffix(".png")
        output_image.save(out_path, format="PNG")
        print(f"  -> Saved transparent PNG: {out_path} ({output_image.size})")
    except Exception as e:
        print(f"  Error processing {file_path}: {e}")

def main():
    for asset_dir in ASSET_DIRS:
        if not asset_dir.exists():
            continue
        for file in asset_dir.glob("*"):
            if file.is_file():
                process_file(file)

if __name__ == "__main__":
    main()
