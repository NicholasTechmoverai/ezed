from yt_dlp import YoutubeDL
import os

def download_x_video(video_url):
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': 'x_videos/%(title)s.%(ext)s',
        'quiet': True,
    }
    
    # Create directory if it doesn't exist
    os.makedirs('x_videos', exist_ok=True)
    
    with YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(video_url, download=True)
            print(f"Downloaded: {info['title']}.{info['ext']}")
            return True
        except Exception as e:
            print(f"Error downloading video: {e}")
            return False

