from yt_dlp import YoutubeDL
import os
from TikTokApi import TikTokApi
import os

def download_tiktok_audio(video_url):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': 'tiktok_audio/%(title)s.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': True,
    }
    
    # Create directory if it doesn't exist
    os.makedirs('tiktok_audio', exist_ok=True)
    
    with YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(video_url, download=True)
            print(f"Downloaded: {info['title']}.mp3")
            return True
        except Exception as e:
            print(f"Error downloading audio: {e}")
            return False

# Example usage:
video_url = "https://www.tiktok.com/@sync_movies/video/7521398192307473669"
download_tiktok_audio(video_url)





def download_tiktok_song(video_id):
    try:
        with TikTokApi() as api:
            video = api.video(id=video_id)
            audio_url = video.music['play_url']
            
            # Create directory if it doesn't exist
            os.makedirs('tiktok_audio', exist_ok=True)
            
            # Download the audio
            response = requests.get(audio_url)
            filename = f"tiktok_audio/{video_id}.mp3"
            
            with open(filename, 'wb') as f:
                f.write(response.content)
            
            print(f"Audio downloaded as {filename}")
            return True
    except Exception as e:
        print(f"Error: {e}")
        return False

# Example usage:
video_id = "1234567890123456789"  # The numeric ID from TikTok URL
download_tiktok_song(video_id)