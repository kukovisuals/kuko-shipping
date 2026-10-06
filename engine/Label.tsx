import { Billboard, Text } from "@react-three/drei";
import { usePalette } from "@/engine/palette";
import type { ThemeColor } from "@/ui/theme";

// drei Text with the self-hosted font, not drei Html (React 19 unmount error in dev).
export const FONT = "/fonts/inter-latin-600-normal.woff";

export function Label({
  text,
  position,
  size = 1.2,
  color = "ink",
}: {
  text: string;
  position: [number, number, number];
  size?: number;
  color?: ThemeColor;
}) {
  const { colors } = usePalette();
  return (
    <Billboard position={position}>
      <Text font={FONT} fontSize={size} color={colors[color]} anchorY="bottom" outlineWidth={size * 0.05} outlineColor={colors.background}>
        {text}
      </Text>
    </Billboard>
  );
}
