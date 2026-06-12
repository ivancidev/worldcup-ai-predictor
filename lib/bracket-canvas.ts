import { Team, BracketSlot } from "./types";

export async function exportBracketToImage(bracket: BracketSlot[], champion: Team | null): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = 2400;
  canvas.height = 1250;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // ── 1. Background Gradient ──
  const grad = ctx.createLinearGradient(0, 0, 2400, 1250);
  grad.addColorStop(0, "#080b14");
  grad.addColorStop(0.5, "#0e1220");
  grad.addColorStop(1, "#141928");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2400, 1250);

  // Subtle grid overlay
  ctx.strokeStyle = "rgba(45, 58, 90, 0.1)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 2400; i += 80) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1250);
    ctx.stroke();
  }
  for (let j = 0; j < 1250; j += 80) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.lineTo(2400, j);
    ctx.stroke();
  }

  // Draw golden border frame
  ctx.strokeStyle = "rgba(245, 197, 24, 0.15)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(30, 30, 2340, 1190, 32);
  ctx.stroke();

  // ── 2. Header Title ──
  ctx.fillStyle = "#f5c518";
  ctx.textAlign = "center";
  ctx.font = "900 36px sans-serif";
  ctx.fillText("WORLD CUP 2026", 1200, 75);
  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = "#8899bb";
  ctx.fillText("COMPLETE TOURNAMENT BRACKET PREDICTION", 1200, 105);

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load: " + src));
      img.src = src;
    });
  };

  // ── 3. Preload all unique flag images concurrently ──
  const uniqueFlags = new Set<string>();
  bracket.forEach(slot => {
    if (slot.homeTeam?.flagCode) uniqueFlags.add(slot.homeTeam.flagCode.toLowerCase());
    if (slot.awayTeam?.flagCode) uniqueFlags.add(slot.awayTeam.flagCode.toLowerCase());
  });

  const flagCache: Record<string, HTMLImageElement> = {};
  const loadPromises = Array.from(uniqueFlags).map(async (code) => {
    const url = `https://flagcdn.com/w40/${code}.png`;
    try {
      const img = await loadImage(url);
      flagCache[code] = img;
    } catch {
      // ignore flag load failures
    }
  });

  let champFlagImg: HTMLImageElement | null = null;
  if (champion?.flagCode) {
    try {
      champFlagImg = await loadImage(`https://flagcdn.com/w160/${champion.flagCode.toLowerCase()}.png`);
    } catch {
      // ignore
    }
  }

  await Promise.all(loadPromises);

  // ── 4. Drawing Helpers ──
  const drawSlotBackground = (x: number, y: number, width: number, height: number) => {
    ctx.fillStyle = "#0d101d";
    ctx.strokeStyle = "#1e2640";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x - 8, y - 20, width + 16, height, 10);
    ctx.fill();
    ctx.stroke();
  };

  const drawTeamRow = (team: Team | null, score: number | null, x: number, y: number, align: "left" | "right") => {
    if (!team) {
      ctx.fillStyle = "#4a5570";
      ctx.font = "italic 13px sans-serif";
      ctx.textAlign = align;
      ctx.fillText("TBD", x, y);
      return;
    }

    const flagCode = team.flagCode ? team.flagCode.toLowerCase() : "";
    const flagImg = flagCode ? flagCache[flagCode] : null;
    if (flagImg) {
      const flagX = align === "left" ? x : x - 24;
      ctx.drawImage(flagImg, flagX, y - 12, 24, 16);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.strokeRect(flagX, y - 12, 24, 16);
    }

    ctx.fillStyle = "#e8eaf0";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = align;
    const nameX = align === "left" ? x + 32 : x - 34;
    const scoreStr = score !== null ? `${score}` : "—";
    const displayName = team.name.length > 18 ? team.name.slice(0, 16) + "…" : team.name;
    ctx.fillText(displayName, nameX, y);

    ctx.fillStyle = "#f5c518";
    ctx.font = "900 13px sans-serif";
    if (align === "left") {
      ctx.textAlign = "right";
      ctx.fillText(scoreStr, x + 180, y);
    } else {
      ctx.textAlign = "left";
      ctx.fillText(scoreStr, x - 180, y);
    }
  };

  const drawSlotCard = (slotId: string, x: number, y: number, align: "left" | "right") => {
    const slot = bracket.find(s => s.id === slotId);
    const boxX = align === "left" ? x : x - 180;
    drawSlotBackground(boxX, y, 180, 64);
    drawTeamRow(slot?.homeTeam ?? null, slot?.scoreA ?? null, x, y, align);
    drawTeamRow(slot?.awayTeam ?? null, slot?.scoreB ?? null, x, y + 30, align);
  };

  // ── 5. Connecting Lines ──
  ctx.strokeStyle = "rgba(245, 197, 24, 0.15)";
  ctx.lineWidth = 2;

  // Left Side: R32 to R16
  for (let i = 0; i < 4; i++) {
    const midY = 220 + 280 * i + 15;
    ctx.beginPath();
    ctx.moveTo(276, 150 + 280 * i + 15);
    ctx.lineTo(295, 150 + 280 * i + 15);
    ctx.lineTo(295, midY);
    ctx.lineTo(312, midY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(276, 290 + 280 * i + 15);
    ctx.lineTo(295, 290 + 280 * i + 15);
    ctx.lineTo(295, midY);
    ctx.lineTo(312, midY);
    ctx.stroke();
  }

  // Left Side: R16 to QF
  for (let i = 0; i < 2; i++) {
    const midY = 360 + 560 * i + 15;
    ctx.beginPath();
    ctx.moveTo(516, 220 + 560 * i + 15);
    ctx.lineTo(535, 220 + 560 * i + 15);
    ctx.lineTo(535, midY);
    ctx.lineTo(552, midY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(516, 500 + 560 * i + 15);
    ctx.lineTo(535, 500 + 560 * i + 15);
    ctx.lineTo(535, midY);
    ctx.lineTo(552, midY);
    ctx.stroke();
  }

  // Left Side: QF to SF
  {
    const midY = 640 + 15;
    ctx.beginPath();
    ctx.moveTo(756, 360 + 15);
    ctx.lineTo(775, 360 + 15);
    ctx.lineTo(775, midY);
    ctx.lineTo(792, midY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(756, 920 + 15);
    ctx.lineTo(775, 920 + 15);
    ctx.lineTo(775, midY);
    ctx.lineTo(792, midY);
    ctx.stroke();
  }

  // Left Side: SF to Final
  ctx.beginPath();
  ctx.moveTo(996, 640 + 15);
  ctx.lineTo(1045, 640 + 15);
  ctx.lineTo(1045, 800 + 15);
  ctx.lineTo(1092, 800 + 15);
  ctx.stroke();

  // Right Side: R32 to R16
  for (let i = 0; i < 4; i++) {
    const midY = 220 + 280 * i + 15;
    ctx.beginPath();
    ctx.moveTo(2124, 150 + 280 * i + 15);
    ctx.lineTo(2105, 150 + 280 * i + 15);
    ctx.lineTo(2105, midY);
    ctx.lineTo(2088, midY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(2124, 290 + 280 * i + 15);
    ctx.lineTo(2105, 290 + 280 * i + 15);
    ctx.lineTo(2105, midY);
    ctx.lineTo(2088, midY);
    ctx.stroke();
  }

  // Right Side: R16 to QF
  for (let i = 0; i < 2; i++) {
    const midY = 360 + 560 * i + 15;
    ctx.beginPath();
    ctx.moveTo(1884, 220 + 560 * i + 15);
    ctx.lineTo(1865, 220 + 560 * i + 15);
    ctx.lineTo(1865, midY);
    ctx.lineTo(1848, midY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(1884, 500 + 560 * i + 15);
    ctx.lineTo(1865, 500 + 560 * i + 15);
    ctx.lineTo(1865, midY);
    ctx.lineTo(1848, midY);
    ctx.stroke();
  }

  // Right Side: QF to SF
  {
    const midY = 640 + 15;
    ctx.beginPath();
    ctx.moveTo(1644, 360 + 15);
    ctx.lineTo(1625, 360 + 15);
    ctx.lineTo(1625, midY);
    ctx.lineTo(1608, midY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(1644, 920 + 15);
    ctx.lineTo(1625, 920 + 15);
    ctx.lineTo(1625, midY);
    ctx.lineTo(1608, midY);
    ctx.stroke();
  }

  // Right Side: SF to Final
  ctx.beginPath();
  ctx.moveTo(1404, 640 + 15);
  ctx.lineTo(1355, 640 + 15);
  ctx.lineTo(1355, 800 + 15);
  ctx.lineTo(1308, 800 + 15);
  ctx.stroke();

  // ── 6. Render all Match Slots ──

  // Left Column 0: R32
  for (let i = 0; i < 8; i++) drawSlotCard(`l-r32-${i}`, 80, 150 + 140 * i, "left");

  // Left Column 1: R16
  for (let i = 0; i < 4; i++) drawSlotCard(`l-r16-${i}`, 320, 220 + 280 * i, "left");

  // Left Column 2: QF
  for (let i = 0; i < 2; i++) drawSlotCard(`l-qf-${i}`, 560, 360 + 560 * i, "left");

  // Left Column 3: SF
  drawSlotCard("l-sf-0", 800, 640, "left");

  // Center Column: Final
  drawSlotCard("f-0", 1100, 800, "left");

  // Right Column 3: SF
  drawSlotCard("r-sf-0", 1600, 640, "right");

  // Right Column 2: QF
  for (let i = 0; i < 2; i++) drawSlotCard(`r-qf-${i}`, 1840, 360 + 560 * i, "right");

  // Right Column 1: R16
  for (let i = 0; i < 4; i++) drawSlotCard(`r-r16-${i}`, 2080, 220 + 280 * i, "right");

  // Right Column 0: R32
  for (let i = 0; i < 8; i++) drawSlotCard(`r-r32-${i}`, 2320, 150 + 140 * i, "right");

  // ── 7. Stage Column Headers ──
  ctx.fillStyle = "#8899bb";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ROUND OF 32", 180, 115);
  ctx.fillText("ROUND OF 16", 420, 115);
  ctx.fillText("QUARTERFINALS", 660, 115);
  ctx.fillText("SEMIFINALS", 900, 115);
  ctx.fillText("WORLD CUP FINAL", 1200, 770);
  ctx.fillText("SEMIFINALS", 1500, 115);
  ctx.fillText("QUARTERFINALS", 1740, 115);
  ctx.fillText("ROUND OF 16", 1980, 115);
  ctx.fillText("ROUND OF 32", 2220, 115);

  // ── 8. Champion Display (Center Top) ──
  if (champion && champFlagImg) {
    try {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(1100, 220, 200, 130, 16);
      ctx.clip();
      ctx.drawImage(champFlagImg, 1100, 220, 200, 130);
      ctx.restore();

      ctx.strokeStyle = "#f5c518";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(1100, 220, 200, 130, 16);
      ctx.stroke();
    } catch {
      // ignore
    }
  }

  ctx.fillStyle = "#f5c518";
  ctx.font = "900 16px sans-serif";
  ctx.fillText("WORLD CHAMPION", 1200, 385);

  ctx.fillStyle = "#e8eaf0";
  ctx.font = "900 44px sans-serif";
  ctx.fillText(champion ? champion.name.toUpperCase() : "TBD", 1200, 445);

  // Gold Trophy Badge
  ctx.fillStyle = "rgba(245, 197, 24, 0.08)";
  ctx.strokeStyle = "rgba(245, 197, 24, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(1060, 470, 280, 42, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#f5c518";
  ctx.fillText("🏆 GOLDEN TROPHY WINNER", 1200, 497);

  // ── 9. Footer branding ──
  ctx.textAlign = "center";
  ctx.font = "11px sans-serif";
  ctx.fillStyle = "#4a5570";
  ctx.fillText("worldcup-ai-predictor.app", 1200, 1200);

  // ── 10. Download Trigger ──
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `WC2026_Full_Bracket_Prediction_${champion ? champion.name : "Draft"}.png`;
  a.click();
}
