import { COMPANY_TIME_ZONE } from "@/config/map";
import { REPLAY_SPEEDS, isLive, type Replay } from "@/domain/ship/replay";
import { localDateTime, localDayLabel, type Ms } from "@/domain/time";

/** "Thu 2 Oct · 15:00" in the company time zone. */
export function replayLabel(at: Ms): string {
  return `${localDayLabel(at, COMPANY_TIME_ZONE)} · ${localDateTime(at, COMPANY_TIME_ZONE).slice(11)}`;
}

/** Play the last week back: play/pause, a slider over the week, speed, and back to live. */
export function ReplayBar({
  replay,
  reducedMotion,
  onPlay,
  onPause,
  onSeek,
  onSpeed,
  onLive,
}: {
  replay: Replay;
  reducedMotion: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (at: Ms) => void;
  onSpeed: () => void;
  onLive: () => void;
}) {
  const live = isLive(replay);
  const next = REPLAY_SPEEDS[(REPLAY_SPEEDS.indexOf(replay.speed) + 1) % REPLAY_SPEEDS.length];
  return (
    <section
      aria-label="Replay the last week"
      className="ui-card pointer-events-auto absolute top-11 right-3 left-3 flex items-center gap-2 px-3 py-2 text-xs sm:top-3 sm:right-auto sm:left-1/2 sm:w-[30rem] sm:-translate-x-1/2"
    >
      <button
        type="button"
        onClick={replay.playing ? onPause : onPlay}
        disabled={reducedMotion}
        title={reducedMotion ? "Reduced motion is on: drag the slider instead" : undefined}
        aria-label={replay.playing ? "Pause replay" : "Play the last week"}
        className="ui-hover flex size-7 shrink-0 items-center justify-center rounded-full border border-line text-ink disabled:opacity-40"
      >
        <svg aria-hidden viewBox="0 0 12 12" className="size-3 fill-current">
          {replay.playing ? <path d="M2 1h3v10H2zM7 1h3v10H7z" /> : <path d="M2.5 1 11 6l-8.5 5z" />}
        </svg>
      </button>
      <input
        type="range"
        aria-label="Replay time"
        aria-valuetext={live ? "Live" : replayLabel(replay.at)}
        min={replay.from}
        max={replay.to}
        step="any"
        value={replay.at}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="min-w-0 flex-1 accent-accent"
      />
      <span className="w-28 shrink-0 text-right text-ink tabular-nums">{live ? "Live" : replayLabel(replay.at)}</span>
      <button type="button" onClick={onSpeed} aria-label={`Speed ${replay.speed}×, switch to ${next}×`} className="ui-label ui-hover shrink-0 rounded-md px-1.5 py-1 tabular-nums hover:text-ink">
        {replay.speed}×
      </button>
      {!live && (
        <button type="button" onClick={onLive} className="ui-label ui-hover shrink-0 rounded-md px-1.5 py-1 hover:text-ink">
          Live
        </button>
      )}
    </section>
  );
}
