/** Canvas frame shape painters — shared by web + WebView. */

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Paint glasses / accessory silhouette in local coords (origin = bridge center).
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} frame
 * @param {number} ow overlay width
 * @param {number} oh overlay height
 */
export function paintFrameShape(ctx, frame, ow, oh) {
  const color = frame.color || "#111";
  const tint = frame.lens_tint || "rgba(0,0,0,0.25)";
  const style = frame.style || "wayfarer";
  ctx.lineWidth = Math.max(3, ow * 0.025);
  ctx.strokeStyle = color;
  ctx.fillStyle = tint;

  if (style === "round") {
    const r = oh * 0.42;
    const gap = ow * 0.08;
    ctx.beginPath();
    ctx.arc(-gap / 2 - r, 0, r, 0, Math.PI * 2);
    ctx.arc(gap / 2 + r, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-gap / 2, 0);
    ctx.lineTo(gap / 2, 0);
    ctx.stroke();
  } else if (style === "aviator") {
    ctx.beginPath();
    ctx.moveTo(-ow / 2, 0);
    ctx.quadraticCurveTo(-ow / 4, -oh / 2, 0, -oh * 0.1);
    ctx.quadraticCurveTo(ow / 4, -oh / 2, ow / 2, 0);
    ctx.quadraticCurveTo(ow / 4, oh / 2, 0, oh * 0.25);
    ctx.quadraticCurveTo(-ow / 4, oh / 2, -ow / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === "cat_eye") {
    ctx.beginPath();
    ctx.moveTo(-ow / 2, oh * 0.1);
    ctx.lineTo(-ow * 0.35, -oh * 0.35);
    ctx.lineTo(-ow * 0.05, -oh * 0.1);
    ctx.lineTo(ow * 0.05, -oh * 0.1);
    ctx.lineTo(ow * 0.35, -oh * 0.35);
    ctx.lineTo(ow / 2, oh * 0.1);
    ctx.quadraticCurveTo(ow * 0.25, oh * 0.45, 0, oh * 0.3);
    ctx.quadraticCurveTo(-ow * 0.25, oh * 0.45, -ow / 2, oh * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === "sport") {
    roundRect(ctx, -ow / 2, -oh / 3, ow, oh * 0.7, 16);
    ctx.fill();
    ctx.stroke();
  } else if (style === "rectangle") {
    const lw = ow * 0.42;
    const lh = oh * 0.55;
    const gap = ow * 0.08;
    roundRect(ctx, -gap / 2 - lw, -lh / 2, lw, lh, 4);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, gap / 2, -lh / 2, lw, lh, 4);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-gap / 2, 0);
    ctx.lineTo(gap / 2, 0);
    ctx.stroke();
  } else if (style === "browline") {
    const lw = ow * 0.42;
    const lh = oh * 0.65;
    const gap = ow * 0.08;
    roundRect(ctx, -gap / 2 - lw, -lh / 2, lw, lh, 4);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, gap / 2, -lh / 2, lw, lh, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(-gap / 2 - lw, -lh / 2, lw, lh * 0.22);
    ctx.fillRect(gap / 2, -lh / 2, lw, lh * 0.22);
    ctx.beginPath();
    ctx.moveTo(-gap / 2, 0);
    ctx.lineTo(gap / 2, 0);
    ctx.stroke();
  } else if (style === "hex") {
    const drawHex = (cx) => {
      const r = oh * 0.4;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };
    const gap = ow * 0.08;
    const r = oh * 0.4;
    drawHex(-gap / 2 - r);
    drawHex(gap / 2 + r);
    ctx.beginPath();
    ctx.moveTo(-gap / 2, 0);
    ctx.lineTo(gap / 2, 0);
    ctx.stroke();
  } else if (style === "earring") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, oh * 0.25, oh * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -oh * 0.2, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === "hat") {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, oh * 0.15, ow / 2, oh * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -oh * 0.05, ow * 0.35, oh * 0.35, 0, Math.PI, 0);
    ctx.fill();
  } else if (style === "necklace") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-ow / 2, -oh / 2);
    ctx.quadraticCurveTo(0, oh / 2, ow / 2, -oh / 2);
    ctx.stroke();
    ctx.fillStyle = "#E8C547";
    ctx.beginPath();
    ctx.arc(0, oh * 0.35, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === "clip_on") {
    const r = oh * 0.38;
    const gap = ow * 0.1;
    ctx.beginPath();
    ctx.ellipse(-gap / 2 - r, 0, r, r * 0.85, 0, 0, Math.PI * 2);
    ctx.ellipse(gap / 2 + r, 0, r, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    const lw = ow * 0.42;
    const lh = oh * 0.7;
    const gap = ow * 0.08;
    roundRect(ctx, -gap / 2 - lw, -lh / 2, lw, lh, 10);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, gap / 2, -lh / 2, lw, lh, 10);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-gap / 2, 0);
    ctx.lineTo(gap / 2, 0);
    ctx.stroke();
  }
}
