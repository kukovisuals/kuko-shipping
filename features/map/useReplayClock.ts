import { useFrame } from "@react-three/fiber";
import type { Dispatch, SetStateAction } from "react";
import { stepReplay, type Replay } from "@/domain/ship/replay";

/** Longest frame step taken, so a tab coming back from the background doesn't jump a day. */
const MAX_STEP_S = 0.1;

/** Drives the replay from the render loop: each frame steps the clock by the frame's time. Call it
 * inside the <Canvas>. Under reduced motion it never steps — the viewer drags the slider instead. */
export function useReplayClock(playing: boolean, reducedMotion: boolean, setReplay: Dispatch<SetStateAction<Replay>>) {
  useFrame((_, dt) => {
    if (!playing || reducedMotion) return;
    setReplay((r) => stepReplay(r, Math.min(dt, MAX_STEP_S)));
  });
}
