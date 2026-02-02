from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import yt_dlp
import os
import re
from pathlib import Path

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

DOWNLOAD_DIR = '/app/downloads'
Path(DOWNLOAD_DIR).mkdir(parents=True, exist_ok=True)

def sanitize_filename(filename):
    return re.sub(r'[<>:"/\\|?*]', '', filename)

@app.route('/api/info', methods=['POST'])
def get_info():
    data = request.json
    url = data.get('url')
    
    if not url:
        return jsonify({'error': 'Brak URL'}), 400
    
    # Wykryj platformę
    platform = detect_platform(url)
    
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }
    
    # Specjalne ustawienia dla różnych platform
    if platform == 'youtube':
        ydl_opts['extractor_args'] = {
            'youtube': {
                'player_client': ['android', 'web'],
                'skip': ['hls', 'dash']
            }
        }
    elif platform in ['instagram', 'facebook']:
        # Instagram i Facebook wymagają dodatkowych headerów
        ydl_opts['http_headers'] = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-us,en;q=0.5',
            'Sec-Fetch-Mode': 'navigate',
        }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            formats = []
            seen = set()
            
            # Dla Instagram/Facebook - często mają tylko jeden format
            if platform in ['instagram', 'facebook']:
                # Zbierz wszystkie formaty wideo
                for f in info.get('formats', []):
                    if f.get('vcodec') != 'none':
                        height = f.get('height', 0)
                        format_note = f.get('format_note', '')
                        quality_label = f"{height}p" if height else format_note or "Standard"
                        
                        formats.append({
                            'format_id': f['format_id'],
                            'quality': quality_label,
                            'ext': f.get('ext', 'mp4'),
                            'filesize': f.get('filesize', 0),
                            'protocol': f.get('protocol', 'https')
                        })
                
                # Jeśli brak formatów, dodaj domyślny
                if not formats:
                    formats.append({
                        'format_id': 'best',
                        'quality': 'Najlepsza dostępna',
                        'ext': 'mp4',
                        'filesize': info.get('filesize', 0),
                        'protocol': 'https'
                    })
            else:
                # YouTube - filtruj progresywne formaty
                for f in info.get('formats', []):
                    if f.get('protocol') in ['m3u8', 'm3u8_native', 'http_dash_segments']:
                        continue
                        
                    if f.get('vcodec') != 'none' and f.get('acodec') != 'none':
                        height = f.get('height', 0)
                        if height and height not in seen and height <= 1080:
                            seen.add(height)
                            formats.append({
                                'format_id': f['format_id'],
                                'quality': f"{height}p",
                                'ext': f.get('ext', 'mp4'),
                                'filesize': f.get('filesize', 0),
                                'protocol': f.get('protocol', 'https')
                            })
                
                if not formats:
                    formats.append({
                        'format_id': 'best',
                        'quality': 'Najlepsza dostępna',
                        'ext': 'mp4',
                        'filesize': 0,
                        'protocol': 'https'
                    })
            
            formats.sort(key=lambda x: int(str(x['quality']).replace('p', '').replace('Najlepsza dostępna', '9999').replace('Standard', '500')), reverse=True)
            
            # Audio formaty
            audio_formats = []
            audio_seen = set()
            for f in info.get('formats', []):
                if f.get('protocol') in ['m3u8', 'm3u8_native', 'http_dash_segments']:
                    continue
                    
                if f.get('acodec') != 'none' and f.get('vcodec') == 'none':
                    abr = f.get('abr', 0)
                    if abr and abr not in audio_seen:
                        audio_seen.add(abr)
                        audio_formats.append({
                            'format_id': f['format_id'],
                            'quality': f"{int(abr)}kbps",
                            'ext': f.get('ext', 'mp3')
                        })
            
            if not audio_formats:
                audio_formats.append({
                    'format_id': 'bestaudio',
                    'quality': 'Najlepsza dostępna',
                    'ext': 'mp3'
                })
            
            audio_formats.sort(key=lambda x: int(x['quality'].replace('kbps', '').replace('Najlepsza dostępna', '9999')), reverse=True)
            
            return jsonify({
                'title': info.get('title', 'Nieznany tytuł'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration', 0),
                'formats': formats[:10],
                'audio_formats': audio_formats[:5],
                'platform': platform
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def detect_platform(url):
    """Wykrywa platformę na podstawie URL"""
    url_lower = url.lower()
    if 'youtube.com' in url_lower or 'youtu.be' in url_lower:
        return 'youtube'
    elif 'instagram.com' in url_lower:
        return 'instagram'
    elif 'facebook.com' in url_lower or 'fb.watch' in url_lower or 'fb.com' in url_lower:
        return 'facebook'
    elif 'tiktok.com' in url_lower:
        return 'tiktok'
    elif 'twitter.com' in url_lower or 'x.com' in url_lower:
        return 'twitter'
    else:
        return 'other'

@app.route('/api/download', methods=['POST'])
def download():
    data = request.json
    url = data.get('url')
    download_type = data.get('type', 'video')
    format_id = data.get('format_id')
    
    if not url:
        return jsonify({'error': 'Brak URL'}), 400
    
    output_template = os.path.join(DOWNLOAD_DIR, '%(title)s.%(ext)s')
    
    # Podstawowe opcje - workaround dla SABR streaming
    base_opts = {
        'outtmpl': output_template,
        'quiet': False,
        'no_warnings': False,
        # Wyłączenie HLS/DASH gdy są problemy
        'extractor_args': {
            'youtube': {
                'player_client': ['android', 'web'],
                'skip': ['hls', 'dash']
            }
        },
        # Cookies i headers dla lepszej kompatybilności
        'nocheckcertificate': True,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
    }
    
    if download_type == 'audio':
        ydl_opts = {
            **base_opts,
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        }
    else:
        # Dla wideo - unikamy SABR formatów
        if format_id:
            # Sprawdź czy format nie jest HLS/DASH
            ydl_opts = {
                **base_opts,
                'format': f'{format_id}+bestaudio/best',
                'merge_output_format': 'mp4',
            }
        else:
            # Preferuj progresywne formaty (nie HLS/DASH)
            ydl_opts = {
                **base_opts,
                'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                'merge_output_format': 'mp4',
            }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            
            if download_type == 'audio':
                filename = os.path.splitext(filename)[0] + '.mp3'
            
            if os.path.exists(filename) and os.path.getsize(filename) > 0:
                return send_file(
                    filename,
                    as_attachment=True,
                    download_name=os.path.basename(filename)
                )
            else:
                return jsonify({'error': 'Plik nie został utworzony lub jest pusty. Spróbuj innego formatu.'}), 500
                
    except Exception as e:
        error_msg = str(e)
        if 'SABR' in error_msg or 'fragment not found' in error_msg:
            return jsonify({'error': 'Problem z pobieraniem tego formatu. Spróbuj wybrać inną jakość lub format.'}), 500
        return jsonify({'error': error_msg}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)