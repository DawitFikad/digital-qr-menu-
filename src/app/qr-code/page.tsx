"use client";

import React from "react";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QRCodePage() {
  const router = useRouter();

  return (
    <div className="luxury-bg">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-muted/60 mb-6"
        >
          <ArrowLeft size={18} />
          Back to Menu
        </button>
        <h1 className="text-xl font-bold text-black mb-1">QR Code Generator</h1>
        <p className="text-sm text-muted/60 mb-6">
          Generate QR codes for customers to scan and access your menu
        </p>
        <QRCodeGenerator />
      </div>
    </div>
  );
}
