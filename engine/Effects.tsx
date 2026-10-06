import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { usePalette } from "@/engine/palette";

/** Bloom on emissive parts only: anything with a colour above 1 and toneMapped off. Night look only. */
export function Effects() {
  const { look } = usePalette();
  if (look !== "dark") return null;
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={1} intensity={0.45} mipmapBlur />
    </EffectComposer>
  );
}
