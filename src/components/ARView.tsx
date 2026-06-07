'use client';

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { AlertTriangle, Loader2, Smartphone, RefreshCw } from 'lucide-react';
import { cacheAsset } from '@/lib/cache';

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
  const [modelReady, setModelReady] = useState(false);
  const modelRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const retryCount = useRef(0);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const iosCheck = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const androidCheck = /Android/.test(navigator.userAgent);
      setIsIOS(iosCheck);
      setIsAndroid(androidCheck);
    }

    // Start caching the model files immediately
    cacheAsset(glbSrc);
    cacheAsset(usdzSrc);
  }, [glbSrc, usdzSrc]);

  useEffect(() => {
    if (!isClient) return;

    let mounted = true;
    const checkModelViewer = () => {
      if (typeof customElements !== 'undefined' && customElements.get('model-viewer')) {
        if (mounted) setModelReady(true);
        return true;
      }
      return false;
    };

    if (checkModelViewer()) return;

    const interval = setInterval(() => {
      if (checkModelViewer()) clearInterval(interval);
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (mounted) {
        setState('error');
        setErrorMsg('3D viewer failed to load. Please refresh the page.');
      }
    }, 15000);

    return () => { mounted = false; clearInterval(interval); clearTimeout(timeout); };
  }, [isClient]);

  useEffect(() => {
    if (!modelReady || !modelRef.current) return;

    const modelViewer = modelRef.current;
    let mounted = true;

    const handleLoad = () => {
      if (mounted) {
        setState('ready');
      }
    };

    const handleError = (e: any) => {
      if (mounted) {
        setState('error');
        setErrorMsg('Failed to load 3D model. The file may be large.');
      }
    };

    modelViewer.addEventListener('load', handleLoad);
    modelViewer.addEventListener('error', handleError);

    if (modelViewer.loaded) {
      setState('ready');
    } else {
      const t = setTimeout(() => {
        if (mounted && state === 'loading') {
          setState('error');
          setErrorMsg('Model is taking too long to load.');
        }
      }, 30000);
      return () => { mounted = false; clearTimeout(t); modelViewer.removeEventListener('load', handleLoad); modelViewer.removeEventListener('error', handleError); };
    }

    return () => { mounted = false; modelViewer.removeEventListener('load', handleLoad); modelViewer.removeEventListener('error', handleError); };
  }, [modelReady, glbSrc]);

  const handleRetry = useCallback(() => {
    retryCount.current += 1;
    setState('loading');
    setErrorMsg(null);
  }, []);

  if (!isClient) return null;

  return (
    <div ref={containerRef} className="relative w-full h-[400px] md:h-[450px] bg-cream-dark rounded-xl overflow-hidden shadow-inner group">
      {state === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream-dark z-10">
          <Loader2 className="w-10 h-10 text-gold animate-spin mb-3" />
          <p className="text-sm text-muted font-medium">Loading 3D Model...</p>
          <p className="text-xs text-muted/40 mt-1">This may take a moment for large files</p>
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
          {modelReady && (
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
              loading="eager"
              touch-action="pan-y"
              style={{ width: '100%', height: '100%', display: 'block', minHeight: '400px' }}
            >
              <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full pointer-events-none">
                <p className="text-xs text-white font-bold tracking-wider uppercase">3D Model</p>
              </div>
            </model-viewer>
          )}

          {isIOS && (
            <a
              href={usdzSrc}
              rel="ar"
              className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold to-gold-light text-white px-8 py-3.5 rounded-full flex items-center gap-2.5 shadow-2xl hover:from-brown-dark hover:to-brown-dark transition-all transform active:scale-95 z-30 font-bold text-base ring-4 ring-white/30"
            >
              <Smartphone size={20} />
              VIEW IN AR
            </a>
          )}

          {!isIOS && isAndroid && (
            <button
              slot="ar-button"
              className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold to-gold-light text-white px-8 py-3.5 rounded-full flex items-center gap-2.5 shadow-2xl hover:from-brown-dark hover:to-brown-dark transition-all transform active:scale-95 z-30 font-bold text-base ring-4 ring-white/30"
            >
              <Smartphone size={20} />
              VIEW IN AR
            </button>
          )}

          {!isIOS && !isAndroid && (
            <div className="absolute bottom-5 right-5 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-xl z-20">
              <p className="text-xs text-white font-medium flex items-center gap-1.5">
                <Smartphone size={14} />
                Open on mobile for AR
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
});

ARView.displayName = 'ARView';
