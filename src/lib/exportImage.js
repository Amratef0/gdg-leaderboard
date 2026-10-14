// Draws a shareable "Top 3" card to a canvas and triggers a PNG download.
// No extra dependency needed — pure Canvas API.
export function exportTop3Image(rows, title = "Top 3 This Week") {
  const width = 900;
  const height = 600;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#1a1f2e");
  bg.addColorStop(1, "#0d1117");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Header
  ctx.textAlign = "center";
  ctx.fillStyle = "#FBBC05";
  ctx.font = "bold 34px Arial";
  ctx.fillText("🏆 " + title, width / 2, 80);
  ctx.fillStyle = "#9aa4b2";
  ctx.font = "16px Arial";
  ctx.fillText("GDG on Campus CIC", width / 2, 110);

  const medals = ["🥇", "🥈", "🥉"];
  const colors = ["#FBBC05", "#C0C0C0", "#CD7F32"];
  const startY = 190;
  const rowHeight = 130;

  rows.slice(0, 3).forEach((r, idx) => {
    const y = startY + idx * rowHeight;

    // Card background
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.beginPath();
    ctx.roundRect(80, y - 45, width - 160, 100, 16);
    ctx.fill();
    ctx.strokeStyle = colors[idx];
    ctx.lineWidth = 2;
    ctx.stroke();

    // Medal
    ctx.font = "48px Arial";
    ctx.textAlign = "left";
    ctx.fillText(medals[idx], 110, y + 15);

    // Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Arial";
    ctx.fillText(r.full_name, 190, y - 2);

    // Track
    if (r.track?.name) {
      ctx.fillStyle = "#9aa4b2";
      ctx.font = "14px Arial";
      ctx.fillText(r.track.name, 190, y + 22);
    }

    // Points
    ctx.textAlign = "right";
    ctx.fillStyle = colors[idx];
    ctx.font = "bold 32px Arial";
    ctx.fillText(`${r.total_points} pts`, width - 110, y + 10);
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "#5a6473";
  ctx.font = "13px Arial";
  ctx.fillText("One Team. One Community.", width / 2, height - 30);

  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gdg_top3.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
