"use client";

import React, { useState } from 'react';
import { Download, Share2, QrCode, Smartphone, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

import { RESTAURANT_URL } from '@/lib/constants';

export const QRCodeGenerator: React.FC = () => {
  const { t } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);

  const downloadQRCode = () => {
    setIsGenerating(true);
    try {
      const link = document.createElement('a');
      link.download = 'elshaday-restaurant-qr.png';
      link.href = '/api/qr-code';
      link.click();
    } catch (error) {
      console.error('Error downloading QR code:', error);
      navigator.clipboard.writeText(RESTAURANT_URL);
      alert('URL copied to clipboard!');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareQRCode = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: t.title || 'Elshaday Restaurant',
          text: t.subtitle || 'Experience Premium Hospitality & Traditional Flavors',
          url: RESTAURANT_URL,
        });
      } else {
        await navigator.clipboard.writeText(RESTAURANT_URL);
        alert('URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="bg-white card-accent rounded-3xl p-6 sm:p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gold rounded-2xl mb-4 shadow-lg shadow-gold/30">
          <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-coffee mb-2 font-heading">
          QR Code Generator
        </h3>
        <p className="text-sm text-coffee-muted/70 leading-relaxed">
          Generate a QR code for customers to scan and access the digital menu
        </p>
      </div>

      <div className="bg-cream-dark rounded-3xl p-4 sm:p-6 mb-6 border border-border-warm">
        <div className="flex justify-center">
          <div className="w-48 h-48 bg-white rounded-3xl flex items-center justify-center border-2 border-gold/30 shadow-inner">
            <div className="text-center">
              <QrCode className="w-16 h-16 text-gold/50 mx-auto mb-2" />
              <p className="text-xs text-coffee-muted/50">QR Code</p>
              <p className="text-xs text-coffee-muted/30 mt-1 truncate max-w-[160px]">{RESTAURANT_URL}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={downloadQRCode}
          disabled={isGenerating}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gold hover:bg-coffee-muted disabled:bg-gold/50 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-gold/30"
        >
          <Download size={18} />
          <span>{isGenerating ? 'Generating...' : 'Download QR Code'}</span>
        </button>

        <button
          onClick={shareQRCode}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-cream-dark hover:bg-border-warm text-coffee-muted rounded-2xl font-bold transition-all border border-border-warm hover:border-gold/30"
        >
          <Share2 size={18} />
          <span>Share URL</span>
        </button>
      </div>

      <div className="mt-6 p-4 bg-gold/5 rounded-2xl border border-gold/20">
        <p className="text-xs text-gold font-medium text-center">
          <strong>URL:</strong> {RESTAURANT_URL}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-coffee-muted/50">
        <Smartphone size={14} />
        <span>Customers can scan this QR code to view the menu</span>
      </div>

      <div className="mt-6 pt-6 border-t border-border-warm text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-gold" />
          <p className="text-gold font-bold tracking-widest text-xs uppercase font-heading">
            Designed by Kuraz Tech
          </p>
          <Sparkles className="w-4 h-4 text-gold" />
        </div>
      </div>
    </div>
  );
};
