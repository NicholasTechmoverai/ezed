import platform
import sys
import platform
import asyncio

# Set this at application startup
if platform.system() == 'Windows':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
import aiohttp
import yt_dlp
from urllib.parse import urlparse
from utils.logger import setup_logger
import urllib.parse
import subprocess
from typing import AsyncGenerator, Optional, Tuple, List, Dict, Union
import shutil
from uuid import uuid4

def check_ffmpeg_available():
    if not shutil.which('ffmpeg'):
        raise RuntimeError("FFmpeg not found in PATH. Please install FFmpeg first.")
    
    
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

    # async def _handle_youtube(self, url: str, itag: str, start_byte: int):
    #     """YouTube streaming handler"""
    #     ydl_opts = {
    #         'format': itag,
    #         'noplaylist': True,
    #         'quiet': True,
    #         'extract_flat': False,
    #     }

    #     loop = asyncio.get_event_loop()
    #     with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    #         info = await loop.run_in_executor(None, lambda: ydl.extract_info(url, download=False))
    #         video_url = next((fmt['url'] for fmt in info.get('formats', []) 
    #                         if fmt.get('format_id') == itag), None)

    #         if not video_url:
    #             raise ValueError("Requested format not available")

    #         async for chunk in self._stream_from_url(video_url, start_byte):
    #             yield chunk
    
    async def _handle_youtube(self, url: str, itag: str, start_byte: int, timeout: int = 30):
        """YouTube streaming handler with timeout support"""
        try:
            if '+' in itag:
                video_itag, audio_itag = itag.split('+')
                try:
                    video_url, audio_url = await asyncio.wait_for(
                        self._get_youtube_stream_urls(url, video_itag, audio_itag),
                        timeout=timeout
                    )
                    async for chunk in self._stream_merged_youtube(video_url, audio_url, start_byte):
                        yield chunk
                except asyncio.TimeoutError:
                    raise RuntimeError("Timeout while fetching stream URLs")
            else:
                ydl_opts = {
                    'format': itag,
                    'noplaylist': True,
                    'quiet': True,
                    'extract_flat': False,
                }
                
                loop = asyncio.get_event_loop()
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = await loop.run_in_executor(None, lambda: ydl.extract_info(url, download=False))
                    media_url = next(
                        (fmt['url'] for fmt in info.get('formats', []) 
                        if str(fmt.get('format_id')) == str(itag)
                    ), None)

                    if not media_url:
                        available = [f['format_id'] for f in info.get('formats', [])]
                        raise ValueError(
                            f"Format {itag} not available. Existing formats: {available}"
                        )

                    async for chunk in self._stream_from_url(media_url, start_byte):
                        yield chunk
                        
        except Exception as e:
            logger.error("YouTube streaming failed: %s", str(e))
            raise

    async def _get_youtube_stream_urls(self, url: str, video_itag: str, audio_itag: str) -> tuple[str, str]:
        """Get both video and audio stream URLs with validation"""
        ydl_opts = {
            'noplaylist': True,
            'quiet': True,
            'extract_flat': False,
        }
        
        try:
            loop = asyncio.get_event_loop()
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = await loop.run_in_executor(None, lambda: ydl.extract_info(url, download=False))
                
                # Validate formats exist
                video_fmt = next(
                    (fmt for fmt in info.get('formats', [])
                    if str(fmt.get('format_id')) == str(video_itag) and fmt.get('vcodec') != 'none'),
                    None
                )
                
                audio_fmt = next(
                    (fmt for fmt in info.get('formats', [])
                    if str(fmt.get('format_id')) == str(audio_itag) and fmt.get('acodec') != 'none'),
                    None
                )
                
                if not video_fmt or not audio_fmt:
                    available_formats = [f['format_id'] for f in info.get('formats', [])]
                    raise ValueError(
                        f"Requested formats not found (video:{video_itag}, audio:{audio_itag}). "
                        f"Available formats: {available_formats}"
                    )
                
                return video_fmt['url'], audio_fmt['url']
                
        except Exception as e:
            raise RuntimeError(f"Failed to get stream URLs: {str(e)}") from e


    async def _stream_merged_youtube(self, video_url: str, audio_url: str, start_byte: int) -> AsyncGenerator[bytes, None]:
        """Stream merged video+audio using FFmpeg; fallback to threaded subprocess if needed."""
        proc = None

        ffmpeg_cmd = [
            'ffmpeg',
            '-i', video_url,
            '-i', audio_url,
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-f', 'matroska',
            '-movflags', 'frag_keyframe+empty_moov',
            '-'
        ]

        # First try the async subprocess API
        try:
            proc = await asyncio.create_subprocess_exec(
                *ffmpeg_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            # If start_byte requested, skip that many bytes (careful: may block)
            if start_byte > 0:
                await proc.stdout.readexactly(start_byte)

            while True:
                chunk = await proc.stdout.read(4096)
                if not chunk:
                    break
                yield chunk

            # wait for process to finish
            await proc.wait()
            return

        except NotImplementedError:
            # Async subprocess not supported in this event loop — fall back
            # to running subprocess in a thread so we can still yield asynchronously.
            loop = asyncio.get_running_loop()

            def run_proc():
                return subprocess.Popen(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            try:
                proc = await loop.run_in_executor(None, run_proc)

                # If start_byte requested, read/skip from proc.stdout synchronously
                if start_byte > 0:
                    to_skip = start_byte
                    while to_skip > 0:
                        chunk = proc.stdout.read(min(4096, to_skip))
                        if not chunk:
                            break
                        to_skip -= len(chunk)

                # Read from subprocess stdout in executor to avoid blocking the event loop
                while True:
                    chunk = await loop.run_in_executor(None, proc.stdout.read, 4096)
                    if not chunk:
                        break
                    yield chunk

                # Ensure we reap the process
                await loop.run_in_executor(None, proc.wait)
                return

            except Exception as e:
                # Try to terminate and re-raise
                try:
                    if proc and proc.poll() is None:
                        proc.terminate()
                except Exception:
                    pass
                raise RuntimeError(f"FFmpeg processing failed (sync fallback): {e}") from e

        except asyncio.CancelledError:
            if proc and getattr(proc, "returncode", None) is None:
                try:
                    proc.terminate()
                    await proc.wait()
                except Exception:
                    pass
            raise

        except Exception as e:
            # Any other exception — ensure proc termination
            try:
                if proc and getattr(proc, "returncode", None) is None:
                    proc.terminate()
                    await proc.wait()
            except Exception:
                pass
            raise RuntimeError(f"FFmpeg processing failed: {e}") from e

        finally:
            try:
                if proc and getattr(proc, "returncode", None) is None:
                    # proc might be asyncio subprocess or a Popen object
                    if isinstance(proc, asyncio.subprocess.Process):
                        proc.terminate()
                        await proc.wait()
                    else:
                        proc.terminate()
                        # For Popen, ensure we wait in executor
                        loop = asyncio.get_running_loop()
                        await loop.run_in_executor(None, proc.wait)
            except Exception:
                pass


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
                    
                    
                    
                    



class StreamMeta:
    DEFAULT_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    def __init__(self):
        self.session = aiohttp.ClientSession(headers=self.DEFAULT_HEADERS)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def close(self):
        if not self.session.closed:
            await self.session.close()

    async def _run_in_executor(self, func, *args):
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, func, *args)

    async def _extract_info(self, url: str, ydl_opts: Dict) -> Dict:
        """Shared method for info extraction with yt-dlp"""
        def extract():
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(url, download=False)

        result = await self._run_in_executor(extract)
        if not result:
            raise ValueError(f"Could not extract information from {url}")
        return result

    async def get_playlist_songs(self, playlist_url: str) -> Union[Tuple[str, List[Dict[str, str]]]]:
        """Extract playlist name and songs with proper error handling."""
        ydl_opts = {
            'extract_flat': 'in_playlist',
            'quiet': True,
            'no_warnings': True,
            'ignoreerrors': True,
            'extractor_args': {
                'youtube': {
                    'skip': ['dash', 'hls'],
                    'player_client': ['web', 'android'],
                    'player_skip': ['configs'],
                }
            }
        }

        try:
            result = await self._extract_info(playlist_url, ydl_opts)
            playlist_name = result.get("title", "Untitled Playlist")
            
            songs = [
                {
                    'title': entry.get('title', 'Untitled'),
                    'url': entry.get('url'),
                    'id': entry.get('id')
                }
                for entry in result.get('entries', [])
                if entry  # Skip None entries
            ]

            return playlist_name, songs

        except Exception as e:
            raise RuntimeError(f"Failed to fetch playlist: {str(e)}")

    async def fetch_streams(self, link: str) -> Dict:
        """Fetch available streams for a given URL."""
        if not link:
            return {"success": False, "message": "No URL provided"}

        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "simulate": True,
            "skip_download": True,
            "listformats": False,
            "socket_timeout": 10,
        }

        try:
            info = await self._extract_info(link, ydl_opts)
            streams = await self._fetch_stream_details(info.get("formats", []))
            
            return {
                "success": True,
                "streams": streams,
                "info": {
                    "title": info.get("title"),
                    "artist": info.get("uploader"),
                    "description": info.get("description"),
                    "views": info.get("view_count", 0),
                }
            }

        except Exception as e:
            return {"success": False, "message": f"Error: {str(e)}"}

    async def _fetch_stream_details(self, formats: List[Dict]) -> List[Dict]:
        """Fetch details for all available stream formats."""
        tasks = [self._get_stream_info(f) for f in formats]
        return await asyncio.gather(*tasks)

    async def _get_stream_info(self, stream_format: Dict) -> Dict:
        """Extract detailed information about a single stream format."""
        return {
            "itag": stream_format["format_id"],
            "ext": stream_format["ext"],
            "resolution": stream_format.get("resolution", "audio-only"),
            "video_codec": stream_format.get("vcodec", "N/A"),
            "audio_codec": stream_format.get("acodec", "N/A"),
            "vbr": stream_format.get("vbr", 0),
            "abr": stream_format.get("abr", 0),
            "size_mb": await self._get_file_size(stream_format)
        }

    async def _get_file_size(self, stream_format: Dict) -> float:
        """Calculate file size in MB from stream format info."""
        filesize = (
            stream_format.get("filesize") or 
            stream_format.get("filesize_approx") or 
            await self._parse_clen_from_url(stream_format.get("url"))
        )

        if filesize is None:
            return 0.0

        return round(filesize / (1024 * 1024), 3)

    async def _parse_clen_from_url(self, url: str) -> Union[int, None]:
        """Parse content length from URL parameters if available."""
        if not url:
            return None

        decoded_url = urllib.parse.unquote(url)
        clen_param = "clen="
        start_idx = decoded_url.find(clen_param)
        
        if start_idx == -1:
            return None

        start_idx += len(clen_param)
        end_idx = decoded_url.find(";", start_idx) or len(decoded_url)
        clen_value = decoded_url[start_idx:end_idx]

        try:
            return int(clen_value)
        except ValueError:
            return None


