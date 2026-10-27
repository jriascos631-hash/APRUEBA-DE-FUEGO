import React, { useState, useEffect, useRef } from 'react';
import { Story } from '../../types';
import { isVideoSource } from '../../utils/mediaUtils';
import { 
  X, 
  Heart, 
  Eye, 
  Flame, 
  Share2, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Send, 
  Sparkles,
  Music
} from 'lucide-react';
import { StoryAudioPlayerBadge } from '../audioStories/StoryAudioPlayerBadge';
import { StoryAudioMeta } from '../../types';

interface StoryViewerModalProps {
  story: Story;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({ 
  story, 
  onClose, 
  onNext, 
  onPrev 
}) => {
  const [progress, setProgress] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [quickComment, setQuickComment] = useState('');
  const [commentSent, setCommentSent] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = isVideoSource(story.mediaUrl, story.mediaType);

  // Parse attached audio metadata if available
  const storyAudio: StoryAudioMeta | undefined = story.audio || (story.audioUrl ? {
    audioUrl: story.audioUrl,
    title: story.audioTitle || 'Música Cristiana',
    artist: story.audioArtist || 'A Prueba de Fuego',
    type: story.audioType || 'catalog',
    duration: story.audioDuration || 30,
    license: story.audioLicense || 'Dominio Público',
    attribution: story.audioAttribution || 'Himnario Cristiano',
  } : undefined);

  // Story Progress Timer
  useEffect(() => {
    setProgress(0);
    setIsPaused(false);
    setCommentSent(false);

    if (isVideo) {
      // Si es video, el progreso se puede sincronizar con el video element
      return;
    }

    // Si tiene audio adjunto, sincronizamos la duración con el audio (máximo 30s)
    const durationMs = storyAudio?.duration 
      ? Math.max(4000, Math.min(30, storyAudio.duration) * 1000) 
      : 6000;
    const intervalTime = 60;
    const increment = (intervalTime / durationMs) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (isPaused) return prev;
        if (prev >= 100) {
          clearInterval(interval);
          if (onNext) onNext();
          else onClose();
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [story.id, onNext, onClose, isVideo, isPaused, storyAudio?.duration]);

  // Video Time Update listener
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || !isVideo) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 6;
    const pct = Math.min(100, (cur / dur) * 100);
    setProgress(pct);
  };

  const handleVideoEnded = () => {
    if (onNext) {
      onNext();
    } else {
      onClose();
    }
  };

  const handleTogglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVideo && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
    } else {
      setIsPaused(!isPaused);
    }
  };

  const handleSendQuickComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickComment.trim()) return;
    setCommentSent(true);
    setQuickComment('');
    setTimeout(() => setCommentSent(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4 select-none">
      <div 
        className="relative flex flex-col w-full max-w-sm h-[88vh] max-h-[740px] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl"
      >
        
        {/* Progress bar */}
        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1.5">
          <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Header Overlay */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <img
              src={story.authorAvatar}
              alt={story.authorName}
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-full object-cover ring-2 ring-amber-500 shadow-md"
            />
            <div>
              <p className="text-xs font-bold leading-tight drop-shadow-md text-white">{story.authorName}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-amber-300 drop-shadow-sm font-semibold">
                <span className="capitalize">{story.category}</span>
                <span>·</span>
                <span className="text-slate-300">{story.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isVideo && (
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
                title={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            )}

            <button 
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Media or Visual Content Display */}
        <div 
          onClick={handleTogglePlayPause}
          className="relative flex-1 bg-black flex items-center justify-center overflow-hidden cursor-pointer"
        >
          {isVideo && story.mediaUrl ? (
            <video
              ref={videoRef}
              src={story.mediaUrl}
              autoPlay
              playsInline
              muted={isMuted}
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
              className="h-full w-full object-cover"
            />
          ) : story.mediaUrl ? (
            <img
              src={story.mediaUrl}
              alt="Estado Espiritual"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-amber-900/60 via-slate-900 to-slate-950 p-6 flex flex-col justify-center items-center text-center">
              <Flame className="h-12 w-12 text-amber-500 mb-4 animate-bounce" />
            </div>
          )}

          {/* Pause Indicator overlay */}
          {isPaused && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none z-20">
              <div className="p-4 rounded-full bg-black/60 text-white backdrop-blur-md">
                <Pause className="h-8 w-8 fill-white" />
              </div>
            </div>
          )}

          {/* Navigation Tap Zones (Left: Prev, Right: Next) */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if (onPrev) onPrev();
            }}
            className="absolute left-0 top-16 bottom-24 w-1/4 z-10" 
          />
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if (onNext) onNext();
              else onClose();
            }}
            className="absolute right-0 top-16 bottom-24 w-1/4 z-10" 
          />

          {/* Floating Audio Player Badge */}
          {storyAudio && (
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="absolute top-20 left-3 right-3 z-20 pointer-events-auto"
            >
              <StoryAudioPlayerBadge audio={storyAudio} isStoryPaused={isPaused} />
            </div>
          )}

          {/* Text & Scripture Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/40 flex flex-col justify-end p-5 pointer-events-none">
            {story.bibleVerse && (
              <div className="mb-2 p-2.5 rounded-xl bg-amber-500/25 border border-amber-500/50 backdrop-blur-md pointer-events-auto shadow-md">
                <p className="text-xs font-bold text-amber-300 drop-shadow">📖 {story.bibleVerse}</p>
              </div>
            )}
            
            {story.textContent && (
              <p className="text-sm font-medium text-white leading-relaxed drop-shadow-lg mb-2">
                {story.textContent}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-slate-300 pt-2 border-t border-white/15">
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-amber-400" />
                <span>{story.viewsCount} vistas</span>
              </span>
              {isVideo && (
                <span className="px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 text-[10px] font-bold">
                  🎥 Video de Galería
                </span>
              )}
              <span className="text-[10px] text-amber-400 font-bold ml-auto">
                {story.expiresAt}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Reaction & Response Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col gap-2 z-30">
          
          {commentSent ? (
            <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>¡Mensaje de fe enviado al autor!</span>
            </div>
          ) : (
            <form onSubmit={handleSendQuickComment} className="flex items-center gap-2">
              <input
                type="text"
                value={quickComment}
                onChange={(e) => setQuickComment(e.target.value)}
                placeholder="Responder a este estado con fe..."
                className="flex-1 px-3.5 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />

              {quickComment.trim() ? (
                <button
                  type="submit"
                  className="p-2 rounded-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              ) : (
                <>
                  <button 
                    type="button"
                    onClick={() => setHasLiked(!hasLiked)}
                    className={`p-2 rounded-full border transition-all ${
                      hasLiked 
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title="Dar Amén/Corazón"
                  >
                    <Heart className={`h-4 w-4 ${hasLiked ? 'fill-rose-500' : ''}`} />
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: `Estado de ${story.authorName}`, text: story.textContent || '', url: window.location.href });
                      } else {
                        alert('¡Enlace del estado copiado!');
                      }
                    }}
                    className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Compartir estado"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
