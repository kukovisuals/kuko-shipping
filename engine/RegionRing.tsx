import { Billboard, Text } from "@react-three/drei";
import { useState } from "react";
import type { Color } from "three";
import { FONT } from "@/engine/Label";
import { usePalette } from "@/engine/palette";
import type { ThemeColor } from "@/ui/theme";

export type RingSegment = { share: number; color: Color };

const GAP = 0.06; // radians between arcs

/** A donut that always faces the camera: arcs split by share (clockwise from the top), a big number
 * in the middle, a title above and an optional note below. Click to open. */
export function RegionRing({
  position,
  radius,
  segments,
  value,
  caption,
  title,
  note,
  noteColor = "muted",
  onSelect,
}: {
  position: [number, number, number];
  radius: number;
  segments: readonly RingSegment[];
  value: string;
  caption: string;
  title: string;
  note?: string;
  noteColor?: ThemeColor;
  onSelect?: () => void;
}) {
  const { look, colors } = usePalette();
  const [hover, setHover] = useState(false);
  const inner = radius * 0.8;
  const shown = segments.filter((s) => s.share > 0);
  const gap = shown.length > 1 ? GAP : 0;
  const arcs = shown.map((s, i) => {
    const start = shown.slice(0, i).reduce((sum, x) => sum + x.share, 0);
    return { color: s.color, thetaStart: Math.PI / 2 - (start + s.share) * 2 * Math.PI + gap / 2, thetaLength: Math.max(0.01, s.share * 2 * Math.PI - gap) };
  });
  const disc = radius * 1.14;

  return (
    <Billboard position={position}>
      <group
        scale={hover ? 1.06 : 1}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "";
        }}
      >
        {/* A soft drop shadow: a faint disc a little lower and behind. */}
        <mesh position={[0, -radius * 0.08, -0.02]}>
          <circleGeometry args={[disc * 1.04, 64]} />
          <meshBasicMaterial color={look === "light" ? colors.ink : colors.background} transparent opacity={look === "light" ? 0.08 : 0.6} depthWrite={false} />
        </mesh>
        <mesh>
          <circleGeometry args={[disc, 64]} />
          <meshBasicMaterial color={colors.surface} />
        </mesh>
        {hover && (
          <mesh position-z={0.01}>
            <ringGeometry args={[disc - 0.05, disc, 64]} />
            <meshBasicMaterial color={colors.accent} />
          </mesh>
        )}
        <mesh position-z={0.01}>
          <ringGeometry args={[inner, radius, 64]} />
          <meshBasicMaterial color={colors.body} />
        </mesh>
        {arcs.map((a, i) => (
          <mesh key={i} position-z={0.02}>
            <ringGeometry args={[inner, radius, 48, 1, a.thetaStart, a.thetaLength]} />
            <meshBasicMaterial color={a.color} toneMapped={false} />
          </mesh>
        ))}
        <Text font={FONT} fontSize={radius * 0.6} color={colors.ink} position={[0, radius * 0.08, 0.03]} anchorX="center" anchorY="middle" letterSpacing={-0.02}>
          {value}
        </Text>
        <Text font={FONT} fontSize={radius * 0.14} color={colors.muted} position={[0, -radius * 0.4, 0.03]} anchorX="center" anchorY="middle">
          {caption}
        </Text>
        <Text
          font={FONT}
          fontSize={radius * 0.28}
          color={colors.ink}
          position={[0, disc + 0.2, 0.03]}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={radius * 0.015}
          outlineColor={colors.background}
        >
          {title}
        </Text>
        {note && (
          <Text
            font={FONT}
            fontSize={radius * 0.2}
            color={colors[noteColor]}
            position={[0, -disc - 0.2, 0.03]}
            anchorX="center"
            anchorY="top"
            outlineWidth={radius * 0.02}
            outlineColor={colors.background}
          >
            {note}
          </Text>
        )}
      </group>
    </Billboard>
  );
}
