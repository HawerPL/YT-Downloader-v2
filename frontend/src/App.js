import React, { useState } from 'react';
import { Download, Video, Music, Loader2, AlertCircle, CheckCircle2, Youtube, Instagram, Facebook } from 'lucide-react';

export default function YouTubeDownloader() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedType, setSelectedType] = useState('video');
  const [selectedFormat, setSelectedFormat] = useState('');

  const detectPlatform = (url) => {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';
    if (urlLower.includes('instagram.com')) return 'instagram';
    if (urlLower.includes('facebook.com') || urlLower.includes('fb.watch')) return 'facebook';
    if (urlLower.includes('tiktok.com')) return 'tiktok';
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter';
    return 'other';
  };

  const getPlatformIcon = (platform) => {
    switch(platform) {
      case 'youtube': return <Youtube className="w-5 h-5" />;
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'facebook': return <Facebook className="w-5 h-5" />;
      default: return <Video className="w-5 h-5" />;
    }
  };

  const getPlatformColor = (platform) => {
    switch(platform) {
      case 'youtube': return 'from-red-600 to-red-700';
      case 'instagram': return 'from-pink-600 to-purple-600';
      case 'facebook': return 'from-blue-600 to-blue-700';
      default: return 'from-purple-600 to-pink-600';
    }
  };

  const fetchVideoInfo = async () => {
    if (!url.trim()) {
      setError('Wprowadź URL');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setVideoInfo(null);

    try {
      const response = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (response.ok) {
        setVideoInfo(data);
        if (data.formats?.length > 0) {
          setSelectedFormat(data.formats[0].format_id);
        }
      } else {
        setError(data.error || 'Nie udało się pobrać informacji o materiale');
      }
    } catch (err) {
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          type: selectedType,
          format_id: selectedFormat
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        setSuccess('Pobieranie zakończone!');
      } else {
        const data = await response.json();
        setError(data.error || 'Błąd podczas pobierania');
      }
    } catch (err) {
      setError('Błąd podczas pobierania pliku');
    } finally {
      setDownloading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const platform = url ? detectPlatform(url) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className={`bg-gradient-to-r ${platform ? getPlatformColor(platform) : 'from-purple-600 to-pink-600'} p-8 transition-all duration-300`}>
            <div className="flex items-center gap-3 mb-2">
              {platform ? getPlatformIcon(platform) : <Download className="w-8 h-8 text-white" />}
              <h1 className="text-3xl font-bold text-white">Multi Downloader</h1>
            </div>
            <p className="text-white/90">YouTube • Instagram • Facebook • TikTok • Twitter</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <label className="text-white font-medium block">URL materiału</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchVideoInfo()}
                  placeholder="https://..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={fetchVideoInfo}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Ładowanie...
                    </>
                  ) : (
                    'Pobierz info'
                  )}
                </button>
              </div>
              
              {/* Podpowiedzi dla różnych platform */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2 flex items-center gap-1">
                  <Youtube className="w-3 h-3 text-red-400" />
                  <span className="text-red-200">YouTube</span>
                </div>
                <div className="bg-pink-500/20 border border-pink-500/30 rounded-lg p-2 flex items-center gap-1">
                  <Instagram className="w-3 h-3 text-pink-400" />
                  <span className="text-pink-200">Instagram</span>
                </div>
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-2 flex items-center gap-1">
                  <Facebook className="w-3 h-3 text-blue-400" />
                  <span className="text-blue-200">Facebook</span>
                </div>
                <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-lg p-2 flex items-center gap-1">
                  <Video className="w-3 h-3 text-cyan-400" />
                  <span className="text-cyan-200">TikTok</span>
                </div>
                <div className="bg-sky-500/20 border border-sky-500/30 rounded-lg p-2 flex items-center gap-1">
                  <Video className="w-3 h-3 text-sky-400" />
                  <span className="text-sky-200">Twitter/X</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-green-200">{success}</p>
              </div>
            )}

            {videoInfo && (
              <div className="space-y-4 animate-fade-in">
                {videoInfo.thumbnail && (
                  <div className="relative rounded-xl overflow-hidden">
                    <img
                      src={videoInfo.thumbnail}
                      alt={videoInfo.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {videoInfo.platform && (
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r ${getPlatformColor(videoInfo.platform)} text-white`}>
                            {videoInfo.platform.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-semibold text-lg">{videoInfo.title}</h3>
                      {videoInfo.duration > 0 && (
                        <p className="text-white/80 text-sm mt-1">
                          Czas trwania: {formatDuration(videoInfo.duration)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-white font-medium block">Typ pobierania</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setSelectedType('video');
                        if (videoInfo.formats?.length > 0) {
                          setSelectedFormat(videoInfo.formats[0].format_id);
                        }
                      }}
                      className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        selectedType === 'video'
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <Video className="w-5 h-5" />
                      <span className="font-medium">Wideo (MP4)</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedType('audio');
                        if (videoInfo.audio_formats?.length > 0) {
                          setSelectedFormat(videoInfo.audio_formats[0].format_id);
                        }
                      }}
                      className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        selectedType === 'audio'
                          ? 'bg-pink-600 border-pink-600 text-white'
                          : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <Music className="w-5 h-5" />
                      <span className="font-medium">Audio (MP3)</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-white font-medium block">Jakość</label>
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {selectedType === 'video' ? (
                      videoInfo.formats?.map((format) => (
                        <option key={format.format_id} value={format.format_id} className="bg-slate-800">
                          {format.quality} - {format.ext}
                          {format.filesize > 0 && ` (${(format.filesize / 1024 / 1024).toFixed(1)} MB)`}
                        </option>
                      ))
                    ) : (
                      videoInfo.audio_formats?.map((format) => (
                        <option key={format.format_id} value={format.format_id} className="bg-slate-800">
                          {format.quality} - {format.ext}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Pobieranie...
                    </>
                  ) : (
                    <>
                      <Download className="w-6 h-6" />
                      Pobierz {selectedType === 'video' ? 'wideo' : 'audio'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6 text-white/60 text-sm">
          Obsługuje YouTube, Instagram Reels, Facebook, TikTok, Twitter/X i wiele innych
        </div>
      </div>
    </div>
  );
}