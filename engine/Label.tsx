import { Billboard, Text } from "@react-three/drei";
import { THEME, type ThemeColor } from "@/ui/theme";

// drei Text with the self-hosted font, not drei Html (React 19 unmount error in dev).
const FONT = "/fonts/silkscreen-latin-400-normal.woff";

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
  return (
    <Billboard position={position}>
      <Text font={FONT} fontSize={size} color={THEME[color]} anchorY="bottom" outlineWidth={size * 0.08} outlineColor={THEME.background}>
        {text}
      </Text>
    </Billboard>
  );
}
