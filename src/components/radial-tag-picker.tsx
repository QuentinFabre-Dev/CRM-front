"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Tag } from "@/lib/types";

const RADIUS = 92;
const INNER_RADIUS = 32;
const DEADZONE = 20;

interface Point {
  x: number;
  y: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): Point {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(cx: number, cy: number, startAngle: number, endAngle: number): string {
  const outerStart = polarToCartesian(cx, cy, RADIUS, endAngle);
  const outerEnd = polarToCartesian(cx, cy, RADIUS, startAngle);
  const innerStart = polarToCartesian(cx, cy, INNER_RADIUS, startAngle);
  const innerEnd = polarToCartesian(cx, cy, INNER_RADIUS, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${innerStart.x} ${innerStart.y}`,
    `L ${outerStart.x} ${outerStart.y}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

export function RadialTagPicker({
  tags,
  origin,
  onSelect,
  onClose,
}: {
  tags: Tag[];
  origin: Point | null;
  onSelect: (tagId: string) => void;
  onClose: () => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const hoveredRef = useRef<number | null>(null);
  const segmentAngle = 360 / Math.max(1, tags.length);

  useEffect(() => {
    // Reset for each new gesture; the ref (not this state closure) is the
    // source of truth read by handleUp, so it can't go stale between renders.
    hoveredRef.current = null;
    setHovered(null);
  }, [origin]);

  useEffect(() => {
    if (!origin) return;

    const handleMove = (e: PointerEvent) => {
      const dx = e.clientX - origin.x;
      const dy = e.clientY - origin.y;
      const dist = Math.hypot(dx, dy);
      if (dist < DEADZONE) {
        hoveredRef.current = null;
        setHovered(null);
        return;
      }
      const rawDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      const fromTop = (rawDeg + 90 + 360) % 360;
      const index = Math.floor(fromTop / segmentAngle);
      hoveredRef.current = index;
      setHovered(index);
    };

    const handleUp = () => {
      const index = hoveredRef.current;
      if (index !== null && tags[index]) {
        onSelect(tags[index].id);
      }
      onClose();
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    // Intentionally re-subscribed only when the gesture (origin) or tag set changes,
    // not on every hover change — handleUp reads hoveredRef, never stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, segmentAngle, tags]);

  const wedges = useMemo(() => {
    if (!origin) return [];
    return tags.map((tag, i) => {
      const start = i * segmentAngle;
      const end = start + segmentAngle;
      const mid = start + segmentAngle / 2;
      const labelPos = polarToCartesian(0, 0, (RADIUS + INNER_RADIUS) / 2, mid);
      return { tag, path: wedgePath(0, 0, start, end), labelPos, index: i };
    });
  }, [origin, tags, segmentAngle]);

  if (!origin || tags.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        style={{ pointerEvents: "none" }}
      >
        <motion.svg
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          width={RADIUS * 2 + 8}
          height={RADIUS * 2 + 8}
          viewBox={`${-RADIUS - 4} ${-RADIUS - 4} ${RADIUS * 2 + 8} ${RADIUS * 2 + 8}`}
          style={{
            position: "fixed",
            left: origin.x,
            top: origin.y,
            transform: "translate(-50%, -50%)",
            filter: "drop-shadow(0 12px 28px hsl(var(--shadow-color) / 0.25))",
          }}
        >
          <circle r={RADIUS} fill="hsl(var(--surface))" stroke="hsl(var(--border))" strokeWidth={1} />
          {wedges.map(({ tag, path, labelPos, index }) => (
            <g key={tag.id}>
              <path
                d={path}
                fill={hovered === index ? `hsl(${tag.color})` : `hsl(${tag.color} / 0.16)`}
                stroke="hsl(var(--surface))"
                strokeWidth={2}
                style={{ transition: "fill 0.1s ease" }}
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10.5}
                fontWeight={600}
                fill={hovered === index ? "white" : `hsl(${tag.color})`}
                style={{ pointerEvents: "none" }}
              >
                {tag.label}
              </text>
            </g>
          ))}
          <circle r={INNER_RADIUS - 2} fill="hsl(var(--surface-2))" stroke="hsl(var(--border))" strokeWidth={1} />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9.5}
            fill="hsl(var(--muted-foreground))"
            style={{ pointerEvents: "none" }}
          >
            {hovered !== null ? tags[hovered]?.label : "annuler"}
          </text>
        </motion.svg>
      </motion.div>
    </AnimatePresence>
  );
}
