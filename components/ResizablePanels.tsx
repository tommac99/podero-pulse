"use client";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  /** Initial widths in px. Center is flexible (fills remaining space). */
  initialLeftPx?: number;
  initialRightPx?: number;
  minLeftPx?: number;
  minCenterPx?: number;
  minRightPx?: number;
}

export function ResizablePanels({
  left,
  center,
  right,
  initialLeftPx = 220,
  initialRightPx = 480,
  minLeftPx = 180,
  minCenterPx = 240,
  minRightPx = 320,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPx, setLeftPx] = useState(initialLeftPx);
  const [rightPx, setRightPx] = useState(initialRightPx);

  const dragging = useRef<null | "left" | "right">(null);
  const startX = useRef(0);
  const startLeftPx = useRef(0);
  const startRightPx = useRef(0);

  const onMouseDown = useCallback((side: "left" | "right") => (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = side;
    startX.current = e.clientX;
    startLeftPx.current = leftPx;
    startRightPx.current = rightPx;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [leftPx, rightPx]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const totalWidth = containerRef.current.offsetWidth;
      const delta = e.clientX - startX.current;

      if (dragging.current === "left") {
        const newLeft = Math.max(minLeftPx, Math.min(
          startLeftPx.current + delta,
          totalWidth - rightPx - minCenterPx - 10
        ));
        setLeftPx(newLeft);
      } else {
        const newRight = Math.max(minRightPx, Math.min(
          startRightPx.current - delta,
          totalWidth - leftPx - minCenterPx - 10
        ));
        setRightPx(newRight);
      }
    };

    const onUp = () => {
      dragging.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [leftPx, rightPx, minLeftPx, minCenterPx, minRightPx]);

  return (
    <div ref={containerRef} className="flex-1 flex min-h-0 overflow-hidden">
      {/* Left panel */}
      <div style={{ width: leftPx, minWidth: leftPx }} className="flex flex-col overflow-hidden shrink-0">
        {left}
      </div>

      {/* Left drag handle */}
      <DragHandle onMouseDown={onMouseDown("left")} />

      {/* Center panel — fills remaining space */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {center}
      </div>

      {/* Right drag handle */}
      <DragHandle onMouseDown={onMouseDown("right")} />

      {/* Right panel */}
      <div style={{ width: rightPx, minWidth: rightPx }} className="flex flex-col overflow-hidden shrink-0">
        {right}
      </div>
    </div>
  );
}

function DragHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative w-[5px] shrink-0 cursor-col-resize select-none group z-10"
      title="Drag to resize"
    >
      {/* Track line */}
      <div
        className="absolute inset-y-0 left-[2px] w-px transition-colors duration-150"
        style={{ background: hovered ? "rgba(125,91,230,0.5)" : "rgba(255,255,255,0.05)" }}
      />
      {/* Grip dots — visible on hover */}
      {hovered && (
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex flex-col items-center gap-[3px]">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-[3px] h-[3px] rounded-full bg-podero-purple/70" />
          ))}
        </div>
      )}
    </div>
  );
}
