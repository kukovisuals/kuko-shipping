import { THEME } from "@/ui/theme";

export function Atmosphere() {
  return (
    <>
      <color attach="background" args={[THEME.background]} />
      <fog attach="fog" args={[THEME.background, 160, 420]} />
      <ambientLight intensity={0.7} color={THEME.ink} />
      <directionalLight position={[-60, 120, 80]} intensity={1.3} color={THEME.ink} />
    </>
  );
}
