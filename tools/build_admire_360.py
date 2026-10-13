import os
import shutil
import numpy as np
from PIL import Image, ImageFilter, ImageOps
import subprocess

brain_dir = r"C:\Users\acer\.gemini\antigravity-ide\brain\38d18bce-97ec-4233-8a4b-e56bd7319743"
source_files = [
    "admire_front_clean_0_1791912611940.jpg",      # 0 deg
    "admire_front_right_45_1791912631090.jpg",     # 45 deg
    "admire_side_90_1791912463297.jpg",            # 90 deg
    "admire_rear_right_135_1791912499491.jpg",     # 135 deg
    "admire_back_180_1791912481857.jpg",           # 180 deg
    "admire_rear_left_225_1791912516660.jpg",      # 225 deg
    "admire_left_270_1791912532503.jpg",           # 270 deg
    "admire_front_left_315_1791912553869.jpg"      # 315 deg
]

out_frames_dir = r"images\catalogue\national\admire-360"
out_video_mp4 = r"videos\products\national-admire-360.mp4"
out_video_webm = r"videos\products\national-admire-360.webm"
tmp_render_dir = r"videos\products\tmp_frames"

os.makedirs(out_frames_dir, exist_ok=True)
os.makedirs(tmp_render_dir, exist_ok=True)

# 1. Load the 8 keyframes
key_images = []
for fname in source_files:
    p = os.path.join(brain_dir, fname)
    im = Image.open(p).convert("RGBA")
    key_images.append(im)

print(f"Loaded {len(key_images)} 360 keyframe angles.")

# 2. Generate 16 or 24 high quality keyframes for web interactive viewer
# Save 8 base angles as crisp WebP files
for idx, im in enumerate(key_images):
    deg = idx * 45
    webp_path = os.path.join(out_frames_dir, f"frame_{idx:02d}.webp")
    jpg_path = os.path.join(out_frames_dir, f"frame_{idx:02d}.jpg")
    im.convert("RGB").save(webp_path, "WEBP", quality=92)
    im.convert("RGB").save(jpg_path, "JPEG", quality=90)

print(f"Saved base keyframe WebPs to {out_frames_dir}")

# 3. Generate high frame-rate video sequence (64 frames = 8 steps * 8 subframes)
# Using cosine cross-dissolve with subtle horizontal flow for seamless 360 rotation
total_steps = len(key_images)
subframes_per_step = 8  # 8 * 8 = 64 total frames for 360 video
target_w, target_h = 720, 960

frame_idx = 0
for step in range(total_steps):
    curr_im = key_images[step].resize((target_w, target_h), Image.Resampling.LANCZOS)
    next_im = key_images[(step + 1) % total_steps].resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    curr_arr = np.array(curr_im, dtype=np.float32)
    next_arr = np.array(next_im, dtype=np.float32)

    for sub in range(subframes_per_step):
        t = sub / float(subframes_per_step)
        # Smooth S-curve transition
        alpha = 0.5 * (1.0 - np.cos(np.pi * t))
        
        # Cross-dissolve blend
        blended_arr = (1.0 - alpha) * curr_arr + alpha * next_arr
        blended_img = Image.fromarray(np.uint8(np.clip(blended_arr, 0, 255)), mode="RGBA")
        
        # Save temporary render frame for ffmpeg
        frame_filename = os.path.join(tmp_render_dir, f"vframe_{frame_idx:04d}.png")
        blended_img.convert("RGB").save(frame_filename, "PNG")
        frame_idx += 1

print(f"Rendered {frame_idx} sequential video frames in {tmp_render_dir}.")

# 4. Use ffmpeg to encode MP4 and WebM video
# 64 frames at 16 fps = 4 seconds per complete 360 degree spin
ffmpeg_cmd_mp4 = [
    "ffmpeg", "-y",
    "-framerate", "16",
    "-i", os.path.join(tmp_render_dir, "vframe_%04d.png"),
    "-c:v", "libx264",
    "-profile:v", "high",
    "-level", "4.0",
    "-pix_fmt", "yuv420p",
    "-crf", "18",
    "-preset", "slow",
    "-movflags", "+faststart",
    out_video_mp4
]

ffmpeg_cmd_webm = [
    "ffmpeg", "-y",
    "-framerate", "16",
    "-i", os.path.join(tmp_render_dir, "vframe_%04d.png"),
    "-c:v", "libvpx-vp9",
    "-crf", "22",
    "-b:v", "0",
    "-pix_fmt", "yuv420p",
    out_video_webm
]

print("Encoding MP4 video...")
subprocess.run(ffmpeg_cmd_mp4, check=True)
print(f"Generated MP4: {out_video_mp4}")

print("Encoding WebM video...")
subprocess.run(ffmpeg_cmd_webm, check=True)
print(f"Generated WebM: {out_video_webm}")

# Clean up temporary PNGs
shutil.rmtree(tmp_render_dir, ignore_errors=True)
print("Complete! 360 video generation finished successfully.")
