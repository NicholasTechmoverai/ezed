# import instaloader
# from urllib.parse import urlparse
# from yt_dlp import YoutubeDL

# async def extract_shortcode(url: str, content_type: str) -> str:
#     """
#     Extract shortcode from an Instagram URL.
#     :param url: Full Instagram URL.
#     :param content_type: Type of content ('reel', 'p', 'tv', etc.)
#     :return: Shortcode string.
#     """
#     if 'instagram.com' not in url:
#         return "Please provide a valid Instagram URL."

#     if f"/{content_type}/" not in url:
#         return f"The provided URL is not of type '{content_type}'."

#     try:
#         path = urlparse(url).path.strip('/')  # Removes domain, leaves path
#         parts = path.split('/')
#         if len(parts) >= 2:
#             return parts[1]
#         else:
#             return "Could not extract shortcode from URL."
#     except Exception as e:
#         return f"Error while parsing URL: {e}"



# # import asyncio

# # url = "https://www.instagram.com/reel/CrvL2UdJKo5/"
# # asyncio.run(download_video(url, content_type="reel"))

# # import instaloader

# def download_reel_insta(reel_url:str):
#     L = instaloader.Instaloader()
    
#     try:
#         post = instaloader.Post.from_shortcode(L.context, reel_url.split("/")[-2])
#         L.download_post(post, target='reels')
#         print("Reel downloaded successfully!")
#     except Exception as e:
#         print(f"Error downloading reel: {e}")



# def download_reel_ytdlp(reel_url:str):
#     ydl_opts = {
#         'format': 'best',
#         'outtmpl': 'reels/%(title)s.%(ext)s',
        
#     }
    
#     with YoutubeDL(ydl_opts) as ydl:
#         try:
#             ydl.download([reel_url])
#             print("Reel downloaded successfully!")
#         except Exception as e:
#             print(f"Error downloading reel: {e}")


# # # Example usage:
# # reel_url = "https://www.instagram.com/reel/DM3b0N_IPTv/"
# # download_reel(reel_url)

import yt_dlp

def list_formats_with_builtin(url):
    ydl_opts = {'quiet': True, 'no_warnings': True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        filename = info.get('filename') or f"{info.get('title')}.{info.get('ext')}"
        print(filename)


if __name__ == "__main__":
    list_formats_with_builtin("https://www.youtube.com/watch?v=jKIEUdAMtrQ")
