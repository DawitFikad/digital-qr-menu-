"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Smartphone, Loader2, AlertTriangle, RefreshCw } from "lucide-react";

interface ARViewProps {
  glbSrc: string;
  usdzSrc: string;
  alt: string;
}

export const ARView: React.FC<ARViewProps> = ({ glbSrc, usdzSrc, alt }) => {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const modelRef = useRef<HTMLElement>(null);
  const retryKey = useRef(0);

  useEffect(() => {
    setIsClient(true);
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsAndroid(/Android/.test(ua));
    import("@google/model-viewer").catch(() => {});
  }, []);

  useEffect(() => {
    if (!isClient) return;
    let mounted = true;
    const check = () => {
      if (customElements.get("model-viewer")) {
        if (mounted) setModelReady(true);
        return true;
      }
      return false;
    };
    if (check()) return;
    const interval = setInterval(() => { if (check()) clearInterval(interval); }, 200);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (mounted) { setState("error"); setErrorMsg("3D viewer failed to load. Refresh the page."); }
    }, 15000);
    return () => { mounted = false; clearInterval(interval); clearTimeout(timeout); };
  }, [isClient]);

  useEffect(() => {
    if (!modelReady || !modelRef.current || state !== "loading") return;
    const viewer = modelRef.current;
    let mounted = true;
    const onLoad = () => { if (mounted) setState("ready"); };
    const onError = () => { if (mounted) { setState("error"); setErrorMsg("Failed to load 3D model."); } };
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);
    if ((viewer as any).loaded) setState("ready");
    const timeout = setTimeout(() => {
      if (mounted && state === "loading") { setState("error"); setErrorMsg("Model load timed out."); }
    }, 30000);
    return () => { mounted = false; clearTimeout(timeout); viewer.removeEventListener("load", onLoad); viewer.removeEventListener("error", onError); };
  }, [modelReady, glbSrc]);

  const handleRetry = useCallback(() => {
    retryKey.current += 1;
    setState("loading");
    setErrorMsg(null);
  }, []);

  if (!isClient) return null;

  const mvProps: Record<string, any> = {
    key: `${glbSrc}-${retryKey.current}`,
    ref: modelRef,
    src: glbSrc,
    "ios-src": usdzSrc,
    alt,
    ar: true,
    "ar-modes": "webxr scene-viewer quick-look",
    "ar-placement": "floor",
    "camera-controls": true,
    "auto-rotate": true,
    "shadow-intensity": "1",
    exposure: "1",
    loading: "eager",
    "touch-action": "pan-y",
    style: { width: "100%", height: "100%", display: "block" },
  };

  return (
    <div className="relative w-full h-[350px] md:h-[400px] bg-cream-dark rounded-xl overflow-hidden">
      {state === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream-dark z-10">
          <Loader2 className="w-8 h-8 text-gold animate-spin mb-2" />
          <p className="text-sm text-muted font-medium">Loading 3D model...</p>
        </div>
      )}

      {state === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-cream-dark p-6 text-center z-20">
          <AlertTriangle className="w-10 h-10 text-red-400 mb-2" />
          <p className="text-sm text-black font-semibold">{errorMsg || "Failed to load"}</p>
          <button onClick={handleRetry} className="mt-3 px-5 py-2 bg-gold text-white rounded-full text-sm font-semibold hover:bg-brown-dark transition-colors flex items-center gap-1.5">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : (
        <>
          {modelReady && React.createElement("model-viewer", mvProps)}

          {(isIOS || isAndroid) && (
            <div
              slot="ar-button"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold to-gold/80 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-2xl hover:brightness-110 transition-all active:scale-95 z-30 font-bold text-sm cursor-pointer"
            >
              <Smartphone size={18} />
              VIEW IN AR
            </div>
          )}

          {!isIOS && !isAndroid && (
            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg z-20">
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
};
