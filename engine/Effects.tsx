import { Bloom, EffectComposer } from "@react-three/postprocessing";

/** Bloom on emissive parts only: anything with a colour above 1 and toneMapped off. */
export function Effects() {
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={1} intensity={1.1} mipmapBlur />
    </EffectComposer>
  );
}
