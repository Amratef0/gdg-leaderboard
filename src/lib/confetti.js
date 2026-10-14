import confetti from "canvas-confetti";

export function fireTop3Confetti() {
  const duration = 1500;
  const end = Date.now() + duration;
  const colors = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];

  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// A bigger, longer celebration reserved for when the #1 spot itself
// changes hands — the biggest moment on the board. No sound (by request).
export function fireChampionConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;
  const colors = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];

  // one big centered burst right away
  confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 }, colors, startVelocity: 45 });

  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0 }, colors, startVelocity: 55 });
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1 }, colors, startVelocity: 55 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// Remembers (per browser) which students we've already celebrated
// entering the Top 3, so we don't re-fire confetti on every 20s poll.
export function shouldCelebrate(studentId, scopeKey) {
  if (typeof window === "undefined") return false;
  const key = `gdg-lb-celebrated:${scopeKey}`;
  const celebrated = JSON.parse(localStorage.getItem(key) || "[]");
  if (celebrated.includes(studentId)) return false;
  celebrated.push(studentId);
  localStorage.setItem(key, JSON.stringify(celebrated.slice(-50)));
  return true;
}

// Remembers (per browser) who's currently #1 in a given scope, and
// returns true exactly when that changes to someone new — used to
// trigger the bigger "champion" celebration only on a real handover.
export function championChanged(currentChampionId, scopeKey) {
  if (typeof window === "undefined" || !currentChampionId) return false;
  const key = `gdg-lb-champion:${scopeKey}`;
  const previous = localStorage.getItem(key);
  localStorage.setItem(key, currentChampionId);
  return previous !== null && previous !== currentChampionId;
}
