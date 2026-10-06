// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { REPLAY_RATE, liveReplay, playReplay } from "@/domain/ship/replay";
import { useReplayClock } from "./useReplayClock";

let frame: ((state: unknown, dt: number) => void) | null = null;
vi.mock("@react-three/fiber", () => ({ useFrame: (cb: (state: unknown, dt: number) => void) => (frame = cb) }));

const NOW = Date.UTC(2026, 9, 6, 15);

function setup(reduced: boolean, start = playReplay(liveReplay(NOW))) {
  return renderHook(() => {
    const [replay, setReplay] = useState(start);
    useReplayClock(replay.playing, reduced, setReplay);
    return replay;
  });
}
const tick = (dt: number) => act(() => frame?.(null, dt));

describe("useReplayClock", () => {
  beforeEach(() => {
    frame = null;
  });

  it("moves the replay forward each frame while playing", () => {
    const { result } = setup(false);
    const from = result.current.at;
    tick(0.05);
    tick(0.05);
    expect(result.current.at).toBeCloseTo(from + 0.1 * REPLAY_RATE, 0);
  });

  it("caps a long frame, so a background tab doesn't jump", () => {
    const { result } = setup(false);
    const from = result.current.at;
    tick(5);
    expect(result.current.at).toBeCloseTo(from + 0.1 * REPLAY_RATE, 0);
  });

  it("stands still when paused or under reduced motion", () => {
    const paused = setup(false, liveReplay(NOW));
    tick(0.05);
    expect(paused.result.current.at).toBe(NOW);
    const reduced = setup(true);
    const from = reduced.result.current.at;
    tick(0.05);
    expect(reduced.result.current.at).toBe(from);
  });
});
