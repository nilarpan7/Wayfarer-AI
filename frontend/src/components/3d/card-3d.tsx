"use client";

import React, { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface Card3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max tilt angle in degrees, default 10
  glareOpacity?: number; // max opacity of glare, default 0.2
  scaleOnHover?: number; // scale factor on hover, default 1.02
  enableGlare?: boolean;
}

export function Card3D({
  children,
  className,
  maxTilt = 10,
  glareOpacity = 0.2,
  scaleOnHover = 1.02,
  enableGlare = true,
  style,
  ...props
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<string>("");
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0,
  });
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within element
      const y = e.clientY - rect.top; // y position within element

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Normalization from -1 to 1
      const normalizedX = (x - centerX) / centerX;
      const normalizedY = (y - centerY) / centerY;

      // Calculate tilt angles (reversed for natural perspective)
      const rotateX = -normalizedY * maxTilt;
      const rotateY = normalizedX * maxTilt;

      setTransform(
        `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(
          2
        )}deg) scale3d(${scaleOnHover}, ${scaleOnHover}, ${scaleOnHover})`
      );

      if (enableGlare) {
        setGlarePosition({
          x: (x / rect.width) * 100,
          y: (y / rect.height) * 100,
          opacity: glareOpacity,
        });
      }
    },
    [maxTilt, scaleOnHover, enableGlare, glareOpacity]
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn("relative transition-all duration-200 ease-out", className)}
      style={{
        transform: transform || "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transformStyle: "preserve-3d",
        willChange: "transform",
        ...style,
      }}
      {...props}
    >
      {children}

      {/* Holographic Specular Glare Reflection */}
      {enableGlare && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 350px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, ${glarePosition.opacity}), transparent 70%)`,
            mixBlendMode: "overlay",
            opacity: isHovered ? 1 : 0,
            borderRadius: "inherit",
          }}
        />
      )}
    </div>
  );
}
