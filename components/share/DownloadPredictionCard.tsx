"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Download, Check } from "lucide-react";

interface DownloadPredictionCardProps {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  winner: string;
  confidence: number;
}

export function DownloadPredictionCard({
  teamA,
  teamB,
  scoreA,
  scoreB,
  winner,
  confidence,
}: DownloadPredictionCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const getCountryFlagCode = (name: string): string => {
        const map: Record<string, string> = {
          Mexico: "mx", "South Africa": "za", "Korea Republic": "kr", "Czech Republic": "cz",
          Canada: "ca", "Bosnia & Herz.": "ba", "Bosnia and Herzegovina": "ba", Qatar: "qa",
          Switzerland: "ch", Brazil: "br", Morocco: "ma", Haiti: "ht", Scotland: "gb-sct",
          USA: "us", "United States": "us", Paraguay: "py", Australia: "au", Turkey: "tr",
          Germany: "de", "Curaçao": "cw", Curacao: "cw", "Ivory Coast": "ci",
          "Cote D'Ivoire": "ci", Ecuador: "ec", Netherlands: "nl", Japan: "jp",
          Sweden: "se", Tunisia: "tn", Belgium: "be", Egypt: "eg", Iran: "ir",
          "IR Iran": "ir", "New Zealand": "nz", Spain: "es", "Cape Verde": "cv",
          "Saudi Arabia": "sa", Uruguay: "uy", France: "fr", Senegal: "sn", Iraq: "iq",
          Norway: "no", Argentina: "ar", Algeria: "dz", Austria: "at", Jordan: "jo",
          Portugal: "pt", "DR Congo": "cd", Uzbekistan: "uz", Colombia: "co",
          England: "gb-eng", Croatia: "hr", Ghana: "gh", Panama: "pa",
        };
        return map[name] || "un";
      };

      const codeA = getCountryFlagCode(teamA);
      const codeB = getCountryFlagCode(teamB);

      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // ── 1. Gradient Background ──
      const grad = ctx.createLinearGradient(0, 0, 1200, 630);
      grad.addColorStop(0, "#080b14");
      grad.addColorStop(0.5, "#0e1220");
      grad.addColorStop(1, "#141928");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 630);

      // Subtle tech grids
      ctx.strokeStyle = "rgba(45, 58, 90, 0.15)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 1200; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 630);
        ctx.stroke();
      }
      for (let j = 0; j < 630; j += 60) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(1200, j);
        ctx.stroke();
      }

      // Decorative border frame
      ctx.strokeStyle = "rgba(245, 197, 24, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(20, 20, 1160, 590, 24);
      ctx.stroke();

      // ── 2. Header text ──
      ctx.fillStyle = "#f5c518";
      ctx.textAlign = "center";
      ctx.font = "900 24px sans-serif";
      ctx.fillText("WORLD CUP 2026", 600, 75);
      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = "#8899bb";
      ctx.fillText("AI MATCH PREDICTION", 600, 110);

      // ── 3. Load & Draw Flags ──
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = src;
        });
      };

      const flagUrlA = `https://flagcdn.com/w320/${codeA.toLowerCase()}.png`;
      const flagUrlB = `https://flagcdn.com/w320/${codeB.toLowerCase()}.png`;

      try {
        const [imgA, imgB] = await Promise.all([
          loadImage(flagUrlA).catch(() => null),
          loadImage(flagUrlB).catch(() => null),
        ]);

        const drawRoundedImage = (img: HTMLImageElement, x: number, y: number, w: number, h: number, r: number) => {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, x, y, w, h);
          ctx.restore();
        };

        if (imgA) drawRoundedImage(imgA, 180, 160, 240, 160, 16);
        if (imgB) drawRoundedImage(imgB, 780, 160, 240, 160, 16);
      } catch (e) {
        console.error("Flag loading error: ", e);
      }

      // ── 4. Team Names & Scores ──
      ctx.fillStyle = "#e8eaf0";
      ctx.textAlign = "center";
      
      // Team Names
      ctx.font = "900 42px sans-serif";
      ctx.fillText(teamA, 300, 380);
      ctx.fillText(teamB, 900, 380);

      // Large Scores
      ctx.font = "900 130px sans-serif";
      ctx.fillStyle = "#f5c518";
      ctx.fillText(scoreA.toString(), 300, 520);
      ctx.fillText(scoreB.toString(), 900, 520);

      // VS Separator
      ctx.font = "900 70px sans-serif";
      ctx.fillStyle = "#2d3a5a";
      ctx.fillText("VS", 600, 250);

      // Score Divider
      ctx.font = "bold 60px sans-serif";
      ctx.fillStyle = "#1e2640";
      ctx.fillText("—", 600, 480);

      // ── 5. Winner & Confidence Badge ──
      const winnerLabel = `WINNER: ${winner.toUpperCase()}`;
      const confidenceLabel = `${confidence}% CONFIDENCE`;

      ctx.fillStyle = "rgba(245, 197, 24, 0.08)";
      ctx.strokeStyle = "rgba(245, 197, 24, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(420, 535, 360, 50, 14);
      ctx.fill();
      ctx.stroke();

      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = "#f5c518";
      ctx.fillText(`${winnerLabel}   •   ${confidenceLabel}`, 600, 566);

      // Footer branding
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#4a5570";
      ctx.fillText("worldcup-ai-predictor.app", 600, 605);

      // ── 6. Download Trigger ──
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `WC2026_${teamA}_vs_${teamB}_Prediction.png`;
      a.click();

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to generate image: ", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      onClick={handleDownload}
      disabled={downloading}
      className="w-full flex items-center justify-center gap-2 cursor-pointer mt-3"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-[#22c55e]" />
          <span>Card Downloaded!</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>{downloading ? "Generating Card..." : "Download Prediction Card"}</span>
        </>
      )}
    </Button>
  );
}
