import platform, os, re
import sys
import asyncio

# Set this at application startup
if platform.system() == "Windows":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

import aiohttp
import yt_dlp
from urllib.parse import urlparse
from utils.logger import setup_logger
import urllib.parse
import subprocess
from typing import AsyncGenerator, Optional, Tuple, List, Dict, Union
import shutil


def check_ffmpeg_available():
    if not shutil.which("ffmpeg"):
        raise RuntimeError("FFmpeg not found in PATH. Please install FFmpeg first.")


logger = setup_logger("StreamDownloader")


audio_formats = [
    "251",  # Opus ~160kbps webm
    "140",  # AAC ~128kbps m4a
    "250",  # Opus ~70kbps webm
    "249",  # Opus ~50kbps webm
    "234",  # Opus ~80kbps webm
    "233",  # Opus ~60kbps webm
]


video_formats = {
    2160: ["313"],  # 4K
    1440: ["271", "272"],  # 1440p
    1080: ["248", "614", "616", "137"],  # 1080p
    720: ["247", "609", "136"],  # 720p
    480: ["244", "606", "135"],  # 480p
}


class UnsupportedPlatformError(Exception):
    pass


class StreamDownloader:
    def __init__(self):
        self.platform_handlers = {
            "youtube": self._handle_youtube,
            "youtu.be": self._handle_youtube,
            "instagram": self._handle_instagram,
            "tiktok": self._handle_tiktok,
            "facebook": self._handle_facebook,
            "fb.watch": self._handle_facebook,
            "twitter": self._handle_twitter,
            "x.com": self._handle_twitter,
        }

    async def download_stream(self, url: str, itag: str = "best", start_byte: int = 0,token:str=None):
        """
        Universal streaming downloader for multiple platforms
        """
        try:
            platform = self._identify_platform(url)
            handler = self.platform_handlers.get(platform)

            if not handler:
                raise UnsupportedPlatformError(f"Unsupported platform: {url}")

            async for chunk in handler(url, itag, start_byte, [], token=token):
                yield chunk

        except Exception as e:
            logger.exception(f"Error streaming video: {str(e)}")
            yield f"[ERROR]{str(e)}".encode()

    def _identify_platform(self, url: str) -> str:
        """Identify the platform from the URL"""
        domain = urlparse(url).netloc.lower()
        if "youtube" in domain or "youtu.be" in domain:
            return "youtube"
        elif "instagram" in domain:
            return "instagram"
        elif "tiktok" in domain:
            return "tiktok"
        elif "facebook" in domain or "fb.watch" in domain:
            return "facebook"
        elif "twitter" in domain or "x.com" in domain:
            return "twitter"
        return "unknown"

    async def _handle_youtube(
        self, url: str, itag: str, start_byte: int, failed_itags=None, token=None
    ):
        if not isinstance(failed_itags, list):
            failed_itags = []

        if failed_itags is None:
            failed_itags = []
        try:
            """YouTube streaming handler"""
            ydl_opts = {
                "format": itag,
                "noplaylist": True,
                "quiet": True,
                "extract_flat": False,
            }

            loop = asyncio.get_event_loop()
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = await loop.run_in_executor(
                    None, lambda: ydl.extract_info(url, download=False)
                )
                video_url = next(
                    (
                        fmt["url"]
                        for fmt in info.get("formats", [])
                        if fmt.get("format_id") == itag
                    ),
                    None,
                )

                if not video_url:
                    raise ValueError("Requested format not available")

                async for chunk in self._stream_from_url(video_url, start_byte):
                    yield chunk

        except Exception as e:
            from app import notifications_namespace

            if "Requested format is not available" in str(e):
                logger.error("YouTube streaming failed for itag %s: %s", itag, str(e))

                failed_itags.append(itag)

                # AUDIO FALLBACK
                if itag in audio_formats:
                    for trial_itag in audio_formats:
                        if trial_itag not in failed_itags:
                            logger.info("Retrying with audio itag %s", trial_itag)
                            await notifications_namespace.trigger_notification({
                                "room": str(token),
                                "message": f"Requested format not available ,retrying with audio itag {trial_itag}",
                                "messageType": "error",
                            })
                            async for chunk in self._handle_youtube(
                                url, trial_itag, start_byte, failed_itags,token
                            ):
                                yield chunk
                            return

                # VIDEO FALLBACK WITH RESOLUTION STEP-DOWN
                else:
                    # Find current resolution
                    current_res = None
                    for res, formats in video_formats.items():
                        if itag in formats:
                            current_res = res
                            break

                    if current_res is not None:
                        # Create list of resolutions from current downwards
                        resolutions_to_try = sorted(
                            [r for r in video_formats.keys() if r <= current_res],
                            reverse=True,
                        )

                        for res in resolutions_to_try:
                            # If we're stepping to a lower resolution, skip remaining formats of previous one
                            if res < current_res:
                                logger.info("Stepping down to %sp fallback", res)
                                await notifications_namespace.trigger_notification({
                                    "room": str(token),
                                    "message": f"Requested format not available, Stepping down to {res}",
                                    "messageType": "error",
                                })
                            for trial_itag in video_formats[res]:
                                if trial_itag in failed_itags:
                                    continue

                                logger.info(
                                    "Retrying with %sp (itag %s)", res, trial_itag
                                )
                                await notifications_namespace.trigger_notification({
                                    "room": str(token),
                                    "message": f"Requested format not available ,retrying with {res} {trial_itag}",
                                    "messageType": "error",
                                })
                                try:
                                    async for chunk in self._handle_youtube(
                                        url, trial_itag, start_byte, failed_itags,token
                                    ):
                                        yield chunk
                                    return  # Success
                                
                                except Exception as retry_err:
                                    await notifications_namespace.trigger_notification({
                                        "room": str(token),
                                        "message": f"Download faled with {trial_itag} {res}",
                                        "messageType": "error",
                                    })
                                    logger.error(
                                        "Failed with itag %s (%sp): %s",
                                        trial_itag,
                                        res,
                                        retry_err,
                                    )
                                    failed_itags.append(trial_itag)

                logger.error("All fallback formats failed for %s", url)
                await notifications_namespace.trigger_notification({
                    "room": str(token),
                    "message": f"Download faled!!, All fallback formats failed for {url}",
                    "messageType": "error",
                })

            else:
                logger.error("Streaming YouTube failed: %s", str(e))
                await notifications_namespace.trigger_notification({
                    "room": str(token),
                    "message": f"Download failed{str(e)[:30]}",
                    "messageType": "error",
                })


    async def _handle_instagram(self, url: str, itag: str, start_byte: int ,ailed_itags=None, token=None):
        """Instagram streaming handler"""
        ydl_opts = {
            "format": "best",
            "quiet": True,
        }

        loop = asyncio.get_event_loop()
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await loop.run_in_executor(
                None, lambda: ydl.extract_info(url, download=False)
            )

            if not info.get("url"):
                raise ValueError("No stream URL found for Instagram post")

            async for chunk in self._stream_from_url(info["url"], start_byte):
                yield chunk

    async def _handle_tiktok(self, url: str, itag: str, start_byte: int,ailed_itags=None, token=None):
        """TikTok streaming handler"""
        ydl_opts = {
            "format": "best",
            "quiet": True,
        }

        loop = asyncio.get_event_loop()
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await loop.run_in_executor(
                None, lambda: ydl.extract_info(url, download=False)
            )

            if not info.get("url"):
                raise ValueError("No stream URL found for TikTok video")

            async for chunk in self._stream_from_url(info["url"], start_byte):
                yield chunk

    async def _handle_facebook(self, url: str, itag: str, start_byte: int,ailed_itags=None, token=None):
        """Facebook streaming handler"""
        ydl_opts = {
            "format": "best",
            "quiet": True,
        }

        loop = asyncio.get_event_loop()
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await loop.run_in_executor(
                None, lambda: ydl.extract_info(url, download=False)
            )

            if not info.get("url"):
                raise ValueError("No stream URL found for Facebook video")

            async for chunk in self._stream_from_url(info["url"], start_byte):
                yield chunk

    async def _handle_twitter(self, url: str, itag: str, start_byte: int,ailed_itags=None, token=None):
        """Twitter/X streaming handler"""
        ydl_opts = {
            "format": "best",
            "quiet": True,
        }

        loop = asyncio.get_event_loop()
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await loop.run_in_executor(
                None, lambda: ydl.extract_info(url, download=False)
            )

            if not info.get("url"):
                raise ValueError("No stream URL found for Twitter video")

            async for chunk in self._stream_from_url(info["url"], start_byte):
                yield chunk

    async def _stream_from_url(self, media_url: str, start_byte: int):
        """Generic streaming from a direct media URL"""
        headers = {"Range": f"bytes={start_byte}-"} if start_byte > 0 else {}

        async with aiohttp.ClientSession() as session:
            async with session.get(media_url, headers=headers) as response:
                response.raise_for_status()

                content_length = response.headers.get("Content-Length")
                if content_length:
                    yield f"[CONTENT-LENGTH:{content_length}]".encode()

                async for chunk in response.content.iter_chunked(
                    1024 * 64
                ):  # 64KB chunks
                    yield chunk


class StreamMeta:
    DEFAULT_HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
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

    async def get_playlist_songs(
        self, playlist_url: str
    ) -> Union[Tuple[str, List[Dict[str, str]]]]:
        """Extract playlist name and songs with proper error handling."""
        ydl_opts = {
            "extract_flat": "in_playlist",
            "quiet": True,
            "no_warnings": True,
            "ignoreerrors": True,
            "extractor_args": {
                "youtube": {
                    "skip": ["dash", "hls"],
                    "player_client": ["web", "android"],
                    "player_skip": ["configs"],
                }
            },
        }

        try:
            result = await self._extract_info(playlist_url, ydl_opts)
            playlist_name = result.get("title", "Untitled Playlist")

            songs = [
                {
                    "title": entry.get("title", "Untitled"),
                    "url": entry.get("url"),
                    "id": entry.get("id"),
                }
                for entry in result.get("entries", [])
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
                    "url":link
                },
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
            "size_mb": await self._get_file_size(stream_format),
        }

    async def _get_file_size(self, stream_format: Dict) -> float:
        """Calculate file size in MB from stream format info."""
        filesize = (
            stream_format.get("filesize")
            or stream_format.get("filesize_approx")
            or await self._parse_clen_from_url(stream_format.get("url"))
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

    async def get_download_info(self, url: str, itag: str = None) -> dict:
        try:
            if itag and "+" in itag:
                itag = itag.split("+", 1)[0]

            if itag in audio_formats:
                itag = "234"
            else:
                itag = "18"

            ydl_opts = {
                "quiet": True,
                "no_warnings": True,
                "simulate": True,
                "skip_download": True,
                "forceurl": True,
                "format": itag or "best",
                "noplaylist": True,
                "socket_timeout": 10,
            }

            info = await self._extract_info(url, ydl_opts)

            filename = (
                info.get("filename")
                or f"{info.get('title', 'unknown')}.{info.get('ext', 'mp4')}"
            )
            filesize = info.get("filesize") or info.get("filesize_approx") or 0

            return {
                "filename": filename,
                "filesize_bytes": filesize,
                "filesize_mb": round(filesize / (1024 * 1024), 3) if filesize else 0,
                "extension": info.get("ext"),
                "mime_type": info.get("mime_type"),
                "title": info.get("title"),
                "uploader": info.get("uploader"),
                "duration": info.get("duration"),
                "url": info.get("url"),
            }
        except Exception as e:
            # You can log the error here if you want
            # For now, return an empty dict or error info
            return {"error": str(e), "url": url, "itag": itag}


# async def _handle_youtube(self, url: str, itag: str, start_byte: int, timeout: int = 30, failed_itags=None):
    #     """YouTube streaming handler with retry + resolution fallback."""
    #     if failed_itags is None:
    #         failed_itags = []

    #     try:
    #         ydl_opts = {
    #             'format': itag,
    #             'noplaylist': True,
    #             'quiet': True,
    #             'extract_flat': False,
    #         }

    #         # Remove playlist identifiers for cleaner URL
    #         url = url.split('?list')[0].split('&list')[0]

    #         loop = asyncio.get_event_loop()
    #         with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    #             info = await loop.run_in_executor(None, lambda: ydl.extract_info(url, download=False))
    #             media_url = next(
    #                 (fmt['url'] for fmt in info.get('formats', [])
    #                 if str(fmt.get('format_id')) == str(itag)),
    #                 None
    #             )

    #             if not media_url:
    #                 available = [f['format_id'] for f in info.get('formats', [])]
    #                 raise ValueError(f"Format {itag} not available. Existing formats: {available}")

    #             async for chunk in self._stream_from_url(media_url, start_byte):
    #                 yield chunk

    #     except Exception as e:
    #         if "Requested format is not available" in str(e):
    #             logger.error("YouTube streaming failed for itag %s: %s", itag, str(e))
    #             failed_itags.append(itag)

    #             # AUDIO FALLBACK
    #             if itag in audio_formats:
    #                 for trial_itag in audio_formats:
    #                     if trial_itag not in failed_itags:
    #                         logger.info("Retrying with audio itag %s", trial_itag)
    #                         async for chunk in self._handle_youtube(url, trial_itag, start_byte, timeout, failed_itags):
    #                             yield chunk
    #                         return

    #             # VIDEO FALLBACK WITH RESOLUTION STEP-DOWN
    #             else:
    #                 # Find current resolution
    #                 current_res = None
    #                 for res, formats in video_formats.items():
    #                     if itag in formats:
    #                         current_res = res
    #                         break

    #                 if current_res is not None:
    #                     # Create list of resolutions from current downwards
    #                     resolutions_to_try = sorted(
    #                         [r for r in video_formats.keys() if r <= current_res],
    #                         reverse=True
    #                     )

    #                     for res in resolutions_to_try:
    #                         # If we're stepping to a lower resolution, skip remaining formats of previous one
    #                         if res < current_res:
    #                             logger.info("Stepping down to %sp fallback", res)

    #                         for trial_itag in video_formats[res]:
    #                             if trial_itag in failed_itags:
    #                                 continue

    #                             logger.info("Retrying with %sp (itag %s)", res, trial_itag)
    #                             try:
    #                                 async for chunk in self._handle_youtube(url, trial_itag, start_byte, timeout, failed_itags):
    #                                     yield chunk
    #                                 return  # Success
    #                             except Exception as retry_err:
    #                                 logger.error("Failed with itag %s (%sp): %s", trial_itag, res, retry_err)
    #                                 failed_itags.append(trial_itag)

    #             logger.error("All fallback formats failed for %s", url)

    #         else:
    #             logger.error("Streaming YouTube failed: %s", str(e))