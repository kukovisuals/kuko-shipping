import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { ACESFilmicToneMapping, NoToneMapping } from "three";
import { usePalette } from "@/engine/palette";

/** Sky, fog and lights; the same in both looks, only the colours change. */
export function Atmosphere() {
  const { look, colors } = usePalette();
  const light = look === "light";
  // Light renders without tone mapping so its whites stay white; dark keeps ACES for the neon. A
  // passive effect on purpose: leaving dark unmounts the bloom EffectComposer, whose passive cleanup
  // restores the tone mapping it saved, and this must run after that.
  const get = useThree((s) => s.get);
  useEffect(() => {
    get().gl.toneMapping = light ? NoToneMapping : ACESFilmicToneMapping;
  }, [get, light]);
  const sun = light ? colors.surface : colors.ink;
  return (
    <>
      <color attach="background" args={[colors.background]} />
      <fog attach="fog" args={[colors.background, 160, 420]} />
      <ambientLight intensity={light ? 2.2 : 0.7} color={sun} />
      <directionalLight position={[-60, 120, 80]} intensity={light ? 1.6 : 1.3} color={sun} />
    </>
  );
}
