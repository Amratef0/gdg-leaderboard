"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";

export default function QrCodeCard() {
  const canvasRef = useRef(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const link = window.location.origin;
    setUrl(link);
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, link, { width: 200, margin: 1, color: { dark: "#14161A", light: "#ffffff" } });
    }
  }, []);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "gdg_leaderboard_qr.png";
    a.click();
  }

  return (
    <div className="card flex flex-col items-center gap-3 p-5 text-center">
      <p className="text-sm font-semibold text-gray-500">Scan to open the leaderboard</p>
      <canvas ref={canvasRef} className="rounded-lg" />
      <p className="break-all text-xs text-gray-400">{url}</p>
      <button onClick={handleDownload} className="btn-secondary">
        <Download size={14} /> Download QR
      </button>
    </div>
  );
}
