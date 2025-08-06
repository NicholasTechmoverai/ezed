import aiohttp
import yt_dlp
import asyncio
from urllib.parse import urlparse
from utils.logger import setup_logger

logger = setup_logger("StreamDownloader")

class UnsupportedPlatformError(Exception):
    pass

class StreamDownloader:
    def __init__(self):
        self.platform_handlers = {
            'youtube': self._handle_youtube,
            'youtu.be': self._handle_youtube,
            'instagram': self._handle_instagram,
            'tiktok': self._handle_tiktok,
            'facebook': self._handle_facebook,
            'fb.watch': self._handle_facebook,
            'twitter': self._handle_twitter,
            'x.com': self._handle_twitter
        }

    async def download_stream(self, url: str, itag: str = 'best', start_byte: int = 0):
        """
        Universal streaming downloader for multiple platforms
        """
        try:
            platform = self._identify_platform(url)
            handler = self.platform_handlers.get(platform)
            
            if not handler:
                raise UnsupportedPlatformError(f"Unsupported platform: {url}")

            async for chunk in handler(url, itag, start_byte):
                yield chunk

        except Exception as e:
            logger.exception(f"Error streaming video: {str(e)}")
            yield f"[ERROR]{str(e)}".encode()

    def _identify_platform(self, url: str) -> str:
        """Identify the platform from the URL"""
        domain = urlparse(url).netloc.lower()
        if 'youtube' in domain or 'youtu.be' in domain:
            return 'youtube'
        elif 'instagram' in domain:
            return 'instagram'
        elif 'tiktok' in domain:
            return 'tiktok'
        elif 'facebook' in domain or 'fb.watch' in domain:
            return 'facebook'
        elif 'twitter' in domain or 'x.com' in domain:
            return 'twitter'
        return 'unknown'

    async def _handle_youtube(self, url: str, itag: str, start_byte: int):
        """YouTube streaming handler"""
        ydl_opts = {
            'format': itag,
            'noplaylist': True,
            'quiet': True,
            'extract_flat': False,
        }

        loop = asyncio.get_event_loop()
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await loop.run_in_executor(None, lambda: ydl.extract_info(url, download=False))
            video_url = next((fmt['url'] for fmt in info.get('formats', []) 
                            if fmt.get('format_id') == itag), None)

            if not video_url:
                raise ValueError("Requested format not available")

            async for chunk in self._stream_from_url(video_url, start_byte):
                yield chunk

    async def _handle_instagram(self, url: str, itag: str, start_byte: int):
        """Instagram streaming handler"""
        ydl_opts = {
            'format': 'best',
            'quiet': True,
        }

        loop = asyncio.get_event_loop()
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await loop.run_in_executor(None, lambda: ydl.extract_info(url, download=False))
            
            if not info.get('url'):
                raise ValueError("No stream URL found for Instagram post")

            async for chunk in self._stream_from_url(info['url'], start_byte):
                yield chunk

    async def _handle_tiktok(self, url: str, itag: str, start_byte: int):
        """TikTok streaming handler"""
        ydl_opts = {
            'format': 'best',
            'quiet': True,
        }

        loop = asyncio.get_event_loop()
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await loop.run_in_executor(None, lambda: ydl.extract_info(url, download=False))
            
            if not info.get('url'):
                raise ValueError("No stream URL found for TikTok video")

            async for chunk in self._stream_from_url(info['url'], start_byte):
                yield chunk

    async def _handle_facebook(self, url: str, itag: str, start_byte: int):
        """Facebook streaming handler"""
        ydl_opts = {
            'format': 'best',
            'quiet': True,
        }

        loop = asyncio.get_event_loop()
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await loop.run_in_executor(None, lambda: ydl.extract_info(url, download=False))
            
            if not info.get('url'):
                raise ValueError("No stream URL found for Facebook video")

            async for chunk in self._stream_from_url(info['url'], start_byte):
                yield chunk

    async def _handle_twitter(self, url: str, itag: str, start_byte: int):
        """Twitter/X streaming handler"""
        ydl_opts = {
            'format': 'best',
            'quiet': True,
        }

        loop = asyncio.get_event_loop()
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await loop.run_in_executor(None, lambda: ydl.extract_info(url, download=False))
            
            if not info.get('url'):
                raise ValueError("No stream URL found for Twitter video")

            async for chunk in self._stream_from_url(info['url'], start_byte):
                yield chunk

    async def _stream_from_url(self, media_url: str, start_byte: int):
        """Generic streaming from a direct media URL"""
        headers = {'Range': f'bytes={start_byte}-'} if start_byte > 0 else {}

        async with aiohttp.ClientSession() as session:
            async with session.get(media_url, headers=headers) as response:
                response.raise_for_status()

                content_length = response.headers.get('Content-Length')
                if content_length:
                    yield f"[CONTENT-LENGTH:{content_length}]".encode()

                async for chunk in response.content.iter_chunked(1024 * 64):  # 64KB chunks
                    yield chunk