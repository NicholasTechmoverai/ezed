import aiohttp
import yt_dlp
import asyncio
from utils.logger import setup_logger

logger = setup_logger("YEIld")

async def download_stream(url:str, itag:str='best', start_byte=0):
    """
    Asynchronously streams a YouTube video chunk by chunk using yt-dlp.
    Yields the content length as a special first message, then chunks.
    """
    try:
        ydl_opts = {
            'format': itag,
            'noplaylist': True,
            'quiet': True,
        }

        loop = asyncio.get_event_loop()
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            video_info = await loop.run_in_executor(None, lambda: ydl.extract_info(url, download=False))
            video_url = next((fmt['url'] for fmt in video_info.get('formats', []) if fmt['format_id'] == itag), None)

            if not video_url:
                raise ValueError("Stream URL not found.")

        headers = {'Range': f'bytes={start_byte}-'}

        async with aiohttp.ClientSession() as session:
            async with session.get(video_url, headers=headers) as response:
                response.raise_for_status()

                content_length = response.headers.get('Content-Length')
                if content_length:
                    yield f"[CONTENT-LENGTH:{content_length}]".encode()  # Be sure to document/parse this correctly on frontend

                async for chunk in response.content.iter_chunked(64 * 1024):
                    yield chunk

    except Exception as e:
        print(f"Error streaming video: {str(e)}")
        # You could also raise here and catch it in the route handler
        yield b"Error: " + str(e).encode()
