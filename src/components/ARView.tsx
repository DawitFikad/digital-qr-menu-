'use client';

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { AlertTriangle, Loader2, Smartphone, RefreshCw, BarChart3 } from 'lucide-react';

interface ARViewProps {
  glbSrc: string;
  usdzSrc: string;
  poster?: string;
  alt: string;
}

export const ARView: React.FC<ARViewProps> = memo(({ glbSrc, usdzSrc, poster, alt }) => {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showModelViewer, setShowModelViewer] = useState(false);
  const modelRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const retryCount = useRef(0);
  const preloaded = useRef(false);

  // Detect platform & preload models on mount
  useEffect(() => {
    setIsClient(true);
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const android = /Android/.test(navigator.userAgent);
    setIsIOS(ios);
    setIsAndroid(android);

    // On mobile, prefer native AR — skip model-viewer entirely
    if (ios || android) {
      setShowModelViewer(false);
      return;
    }

    // Desktop: preload model in background and show model-viewer
    const preload = async () => {
      try {
        await fetch(glbSrc, { cache: 'force-cache' });
        preloaded.current = true;
      } catch {}
    };
    preload();
    setShowModelViewer(true);
  }, [glbSrc, usdzSrc]);

  // On mobile, show native AR button immediately — no model-viewer overhead
  if (!isClient) return null;

  const absoluteUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return window.location.origin + path;
  };

  // iOS Quick Look — instant, no loading
  if (isIOS) {
    return (
      <div ref={containerRef} className="relative w-full h-[400px] md:h-[450px] bg-cream-dark rounded-xl overflow-hidden shadow-inner group">
        {poster ? (
          <img src={poster} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Smartphone size={48} className="text-gold/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-center">
          <p className="text-white/80 text-sm mb-3 font-medium">Tap to view in AR</p>
          <a
            href={absoluteUrl(usdzSrc)}
            rel="ar"
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-gold to-gold-light text-white px-8 py-3.5 rounded-full shadow-2xl hover:from-brown-dark hover:to-brown-dark transition-all transform active:scale-95 font-bold text-base ring-4 ring-white/30"
          >
            <Smartphone size={20} />
            VIEW IN AR
          </a>
        </div>
      </div>
    );
  }

  // Android Scene Viewer — instant, no loading
  if (isAndroid) {
    const sceneViewerUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(absoluteUrl(glbSrc))}&mode=ar_only`;
    return (
      <div ref={containerRef} className="relative w-full h-[400px] md:h-[450px] bg-cream-dark rounded-xl overflow-hidden shadow-inner group">
        {poster ? (
          <img src={poster} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Smartphone size={48} className="text-gold/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-center">
          <p className="text-white/80 text-sm mb-3 font-medium">Tap to view in AR</p>
          <a
            href={sceneViewerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-gold to-gold-light text-white px-8 py-3.5 rounded-full shadow-2xl hover:from-brown-dark hover:to-brown-dark transition-all transform active:scale-95 font-bold text-base ring-4 ring-white/30"
          >
            <Smartphone size={20} />
            VIEW IN AR
          </a>
        </div>
      </div>
    );
  }

  // Desktop: model-viewer with progressive loading
  useEffect(() => {
    if (!showModelViewer) return;
    let mounted = true;
    const check = () => {
      if (typeof customElements !== 'undefined' && customElements.get('model-viewer')) {
        if (mounted) return true;
      }
      return false;
    };
    if (check()) return;
    const interval = setInterval(() => {
      if (check()) clearInterval(interval);
    }, 200);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (mounted) {
        setState('error');
        setErrorMsg('3D viewer failed to load. Please refresh the page.');
      }
    }, 10000);
    return () => { mounted = false; clearInterval(interval); clearTimeout(timeout); };
  }, [showModelViewer]);

  useEffect(() => {
    if (!showModelViewer || !modelRef.current) return;
    const mv = modelRef.current;
    let mounted = true;

    const onProgress = (e: any) => {
      if (mounted && e.detail && typeof e.detail.totalProgress === 'number') {
        setProgress(Math.round(e.detail.totalProgress * 100));
      }
    };
    const onLoad = () => { if (mounted) { setState('ready'); setProgress(100); } };
    const onError = () => { if (mounted) { setState('error'); setErrorMsg('Failed to load 3D model.'); } };

    mv.addEventListener('progress', onProgress);
    mv.addEventListener('load', onLoad);
    mv.addEventListener('error', onError);

    if (mv.loaded) { setState('ready'); setProgress(100); }

    return () => { mounted = false; mv.removeEventListener('progress', onProgress); mv.removeEventListener('load', onLoad); mv.removeEventListener('error', onError); };
  }, [showModelViewer, glbSrc]);

  const handleRetry = useCallback(() => {
    retryCount.current += 1;
    setState('loading');
    setProgress(0);
    setErrorMsg(null);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[400px] md:h-[450px] bg-cream-dark rounded-xl overflow-hidden shadow-inner group">
      {state === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream-dark z-10 px-6">
          <Loader2 className="w-10 h-10 text-gold animate-spin mb-3" />
          <p className="text-sm text-muted font-medium">Loading 3D Model...</p>
          {progress > 0 && (
            <div className="w-full max-w-[200px] mt-3">
              <div className="h-1.5 bg-border-warm rounded-full overflow-hidden">
                <div className="h-full bg-gold rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted/40 mt-1 text-center">{progress}%</p>
            </div>
          )}
        </div>
      )}

      {state === 'error' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream-dark p-6 text-center z-20">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-3" />
          <p className="text-base text-black font-semibold">{errorMsg || 'Failed to load 3D model'}</p>
          <button
            onClick={handleRetry}
            className="mt-4 px-6 py-2.5 bg-gold text-white rounded-full text-sm font-bold hover:bg-brown-dark transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      ) : (
        <>
          {showModelViewer && (
            <model-viewer
              key={`${glbSrc}-${retryCount.current}`}
              ref={modelRef}
              src={glbSrc}
              ios-src={usdzSrc}
              poster={poster}
              alt={alt}
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-placement="floor"
              camera-controls
              auto-rotate
              shadow-intensity="1"
              exposure="1"
              reveal="auto"
              loading="lazy"
              touch-action="pan-y"
              style={{ width: '100%', height: '100%', display: 'block', minHeight: '400px' }}
            >
              <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full pointer-events-none">
                <p className="text-xs text-white font-bold tracking-wider uppercase">3D Preview</p>
              </div>
            </model-viewer>
          )}

          {!showModelViewer && (
            <div className="absolute inset-0 flex items-center justify-center bg-cream-dark">
              <div className="text-center px-6">
                <Smartphone size={48} className="text-gold/30 mx-auto mb-3" />
                <p className="text-sm text-muted font-medium mb-1">AR available on mobile</p>
                <p className="text-xs text-muted/40">Open this page on your phone</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});

ARView.displayName = 'ARView';
