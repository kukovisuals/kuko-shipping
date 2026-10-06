import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";

/** Puts the camera at `target + offset · scale` whenever those change (e.g. phone vs desktop). */
export function FitView({
  target,
  offset,
  scale = 1,
}: {
  target: readonly [number, number, number];
  offset: readonly [number, number, number];
  scale?: number;
}) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { target?: { set(x: number, y: number, z: number): void }; update?(): void } | null;
  const [tx, ty, tz] = target;
  const [ox, oy, oz] = offset;

  useLayoutEffect(() => {
    camera.position.set(tx + ox * scale, ty + oy * scale, tz + oz * scale);
    camera.lookAt(tx, ty, tz);
    controls?.target?.set(tx, ty, tz);
    controls?.update?.();
  }, [camera, controls, tx, ty, tz, ox, oy, oz, scale]);

  return null;
}
