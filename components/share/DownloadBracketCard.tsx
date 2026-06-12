"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Download, Check } from "lucide-react";
import { Team, BracketSlot } from "@/lib/types";
import { exportBracketToImage } from "@/lib/bracket-canvas";

interface DownloadBracketCardProps {
  bracket: BracketSlot[];
  champion: Team | null;
  className?: string;
  variant?: "gold" | "secondary" | "ghost" | "primary" | "danger";
  size?: "sm" | "lg" | "md";
}

export function DownloadBracketCard({
  bracket,
  champion,
  className = "w-full mt-3",
  variant = "gold",
  size = "md",
}: DownloadBracketCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await exportBracketToImage(bracket, champion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to generate bracket card image: ", err);
    } finally {
      setDownloading(false);
    }
  };


  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={downloading}
      className={`flex items-center justify-center gap-1.5 cursor-pointer ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>Exported!</span>
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5" />
          <span>{downloading ? "Generating..." : "Export Image"}</span>
        </>
      )}
    </Button>
  );
}
