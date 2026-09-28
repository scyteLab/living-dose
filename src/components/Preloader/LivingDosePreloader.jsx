import React, { useEffect, useRef, useState, useCallback } from "react";
import "./preloader.css";

/**
 * LivingDosePreloader
 * Brand boot-sequence preloader — light, off-white, professional.
 *
 * The three brand-colored pieces (green / orange / blue) glide in from
 * off-screen on independent timing windows and settle into the icon mark
 * with a soft, controlled ease (no overshoot/bounce — refined, not playful).
 * A thin circular progress ring tracks real percentage. On completion the
 * wordmark fades up beneath the mark, then the whole screen clears.
 *
 * Usage:
 *   <LivingDosePreloader onComplete={() => setLoading(false)} duration={2600} />
 *
 * Wire `onComplete` to real readiness (auth check / initial fetch) rather
 * than a fixed timer wherever possible.
 */

const GREEN = "#7CAF42";
const ORANGE = "#F57F17";
const BLUE = "#369FF3";

const STATUS_MESSAGES = [
  { at: 0, text: "Preparing your ecosystem" },
  { at: 35, text: "Connecting food & nutrition" },
  { at: 65, text: "Linking preventive care" },
  { at: 90, text: "Finalizing your dashboard" },
];

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

// Independent arrival windows + gentle off-screen origins (no chaos, no overshoot)
const PIECES = [
  {
    id: "green",
    color: GREEN,
    start: 0.0,
    end: 0.55,
    from: { x: -60, y: 6, rot: -10, scale: 0.85 },
    unit: "vw",
  },
  {
    id: "orange",
    color: ORANGE,
    start: 0.1,
    end: 0.62,
    from: { x: 4, y: -55, rot: 8, scale: 0.85 },
    unit: "vh",
  },
  {
    id: "blue",
    color: BLUE,
    start: 0.18,
    end: 0.7,
    from: { x: 50, y: 40, rot: -8, scale: 0.85 },
    unit: "vw",
  },
];

export default function LivingDosePreloader({
  onComplete,
  duration = 2600,
  showReplay = false,
}) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("loading"); // loading | reveal | done
  const [runId, setRunId] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  const start = useCallback(() => {
    startRef.current = null;
    setProgress(0);
    setPhase("loading");

    const tick = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const pct = clamp01(elapsed / duration) * 100;
      setProgress(pct);

      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setPhase("reveal"), 200);
        setTimeout(() => {
          setPhase("done");
          if (onComplete) onComplete();
        }, 200 + 1500);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [duration, onComplete]);

  useEffect(() => {
    start();
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const replay = () => setRunId((n) => n + 1);

  const t = progress / 100;
  const status =
    [...STATUS_MESSAGES].reverse().find((s) => t * 100 >= s.at)?.text ||
    STATUS_MESSAGES[0].text;

  const circumference = 2 * Math.PI * 46;
  const dashOffset = circumference * (1 - t);

  return (
    <div
      className={`ldp-root ${phase === "done" ? "ldp-fadeout" : ""}`}
      aria-live="polite"
      aria-busy={phase !== "done"}
      role="status"
    >
      <div className="ldp-stage">
        <div className="ldp-ring-wrap">
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="ldpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={GREEN} />
                <stop offset="50%" stopColor={ORANGE} />
                <stop offset="100%" stopColor={BLUE} />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(31,42,26,0.08)" strokeWidth="2" />
            <circle
              cx="50" cy="50" r="46" fill="none"
              stroke="url(#ldpGrad)" strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 50 50)"
            />
          </svg>
        </div>

        <div className="ldp-logo-box">
          {PIECES.map((p) => {
            const localT = clamp01((t - p.start) / (p.end - p.start));
            const eased = easeOutCubic(localT);
            const offset = 1 - eased;
            const opacity = t < p.start ? 0 : Math.min(1, (t - p.start) / 0.1);

            const tx = p.unit === "vw" ? `${offset * p.from.x}vw` : "0px";
            const ty = p.unit === "vh" ? `${offset * p.from.y}vh` : `${offset * p.from.y}px`;
            const rot = offset * p.from.rot;
            const scale = 1 - offset * (1 - p.from.scale);

            const style = {
              opacity,
              transform: `translate(${tx}, ${ty}) rotate(${rot}deg) scale(${scale})`,
            };

            if (p.id === "green") {
              return (
                <div
                  key={p.id}
                  className="ldp-piece"
                  style={{ ...style, left: 0, width: "40%", height: "100%", background: GREEN, borderRadius: "999px 0 0 999px" }}
                />
              );
            }
            if (p.id === "orange") {
              return (
                <div
                  key={p.id}
                  className="ldp-piece"
                  style={{ ...style, left: "40%", width: "60%", height: "64%", background: ORANGE, borderRadius: "0 999px 0 0" }}
                />
              );
            }
            return (
              <div
                key={p.id}
                className="ldp-piece"
                style={{ ...style, left: "40%", top: "64%", width: "60%", height: "36%", background: BLUE, borderRadius: "0 0 999px 0" }}
              />
            );
          })}
        </div>
      </div>

      <div className="ldp-center-col">
        {phase === "loading" && (
          <>
            <div className="ldp-pct">{Math.round(progress)}%</div>
            <div className="ldp-status">{status}</div>
          </>
        )}

        {(phase === "reveal" || phase === "done") && (
          <div className="ldp-reveal">
            <div className="ldp-wordmark">Living Dose</div>
            <div className="ldp-tagline">Healthy Living Made Affordable</div>
          </div>
        )}
      </div>

      {phase === "done" && showReplay && (
        <button className="ldp-replay" onClick={replay}>
          Replay
        </button>
      )}
    </div>
  );
}
