from yt_dlp import YoutubeDL
import os
# from facebook_scraper import get_video_url
import requests
import os

def download_facebook_video(video_url):
    ydl_opts = {
        'format': 'best',  # Choose the best quality available
        'outtmpl': 'facebook_videos/%(title)s.%(ext)s',
        'quiet': True,
    }
    
    # Create directory if it doesn't exist
    os.makedirs('facebook_videos', exist_ok=True)
    
    with YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(video_url, download=True)
            print(f"Downloaded: {info['title']}.{info['ext']}")
            return True
        except Exception as e:
            print(f"Error downloading video: {e}")
            return False





# def download_fb_video(post_url):
#     try:
#         # Get video URL
#         video_url = get_video_url(post_url, cookies="cookies.txt")
        
#         # Create directory if it doesn't exist
#         os.makedirs('facebook_videos', exist_ok=True)
        
#         # Download the video
#         response = requests.get(video_url, stream=True)
#         response.raise_for_status()
        
#         filename = f"facebook_videos/video_{int(time.time())}.mp4"
#         with open(filename, 'wb') as f:
#             for chunk in response.iter_content(chunk_size=8192):
#                 f.write(chunk)
        
#         print(f"Video downloaded as {filename}")
#         return True
#     except Exception as e:
#         print(f"Error: {e}")
#         return False



print(download_facebook_video("https://youtu.be/RE87rQkXdNw?list=RDGMEMWO-g6DgCWEqKlDtKbJA1Gw"))