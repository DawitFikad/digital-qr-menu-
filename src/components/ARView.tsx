'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Box, AlertTriangle, Loader2, View, Smartphone } from 'lucide-react';

interface ARViewProps {
  glbSrc: string;
  usdzSrc: string;
  poster?: string;
  alt: string;
}

export const ARView: React.FC<ARViewProps> = ({ glbSrc, usdzSrc, poster, alt }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const modelRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
    // Check if AR is supported
    if (typeof window !== 'undefined') {
      const iosCheck = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const androidCheck = /Android/.test(navigator.userAgent);
      setIsIOS(iosCheck);
      setIsAndroid(androidCheck);
    }
  }, []);

  useEffect(() => {
    if (isClient && modelRef.current) {
      const modelViewer = modelRef.current;

      const handleLoad = () => {
        setIsLoading(false);
      };

      const handleError = (e: any) => {
        console.error('Model viewer error:', e);
        setError('Failed to load 3D model.');
        setIsLoading(false);
      };

      modelViewer.addEventListener('load', handleLoad);
      modelViewer.addEventListener('error', handleError);

      // Force a reload if the src changed
      if (modelViewer.loaded) {
        setIsLoading(false);
      }

      return () => {
        modelViewer.removeEventListener('load', handleLoad);
        modelViewer.removeEventListener('error', handleError);
      };
    }
  }, [isClient, glbSrc]);

  if (!isClient) return null;

  return (
    <div className="relative w-full h-[350px] bg-stone-100 rounded-xl overflow-hidden shadow-inner group">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50 z-10">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mb-2" />
          <p className="text-xs text-stone-500 font-medium">Loading 3D Model...</p>
        </div>
      )}

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50 p-6 text-center z-20">
          <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
          <p className="text-sm text-stone-700 font-semibold">{error}</p>
          <button
            onClick={() => { setError(null); setIsLoading(true); }}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-full text-xs font-bold hover:bg-amber-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <model-viewer
            key={glbSrc}
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
            style={{ width: '100%', height: '100%', display: 'block', minHeight: '350px' }}
          >
            <div className="absolute top-4 left-4 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full pointer-events-none">
              <p className="text-[10px] text-white font-bold tracking-wider uppercase">Interactive 3D</p>
            </div>
          </model-viewer>

          {/* iOS-specific AR button */}
          {isIOS && (
            <a
              href={usdzSrc}
              rel="ar"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-2xl hover:from-amber-600 hover:to-amber-700 transition-all transform active:scale-95 z-30 font-bold text-sm ring-4 ring-white/30"
            >
              <Smartphone size={18} />
              VIEW IN AR
            </a>
          )}

          {/* Android AR button (uses model-viewer's built-in) */}
          {!isIOS && isAndroid && (
            <button
              slot="ar-button"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-2xl hover:from-amber-600 hover:to-amber-700 transition-all transform active:scale-95 z-30 font-bold text-sm ring-4 ring-white/30"
            >
              <Smartphone size={18} />
              VIEW IN AR
            </button>
          )}

          {!isIOS && !isAndroid && (
            <div className="absolute bottom-4 right-4 bg-blue-500/90 backdrop-blur-md px-3 py-2 rounded-lg z-20">
              <p className="text-[10px] text-white font-medium flex items-center gap-1">
                <Smartphone size={10} />
                AR works best on mobile
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
