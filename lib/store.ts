import { create } from 'zustand'
import type { Region } from '@/lib/regions'

// Shared by DOM and 3D (wiki 09). A sidebar click writes selectedRegion;
// the late list and the map both read it.
type Store = {
  selectedRegion: Region | null
  pipelineCollapsed: boolean
  // The weekly loop (wiki 11): DOM owns the play/pause button, 3D owns the clock and reports the day (0-6).
  weekPlaying: boolean
  weekDay: number
  selectRegion: (region: Region | null) => void
  togglePipelineCollapsed: () => void
  toggleWeekPlaying: () => void
  setWeekDay: (day: number) => void
}

export const useStore = create<Store>((set) => ({
  selectedRegion: null,
  pipelineCollapsed: false,
  weekPlaying: false,
  weekDay: 0,
  // Clicking the selected region again closes its list.
  selectRegion: (region) =>
    set((s) => ({ selectedRegion: s.selectedRegion === region ? null : region })),
  togglePipelineCollapsed: () => set((s) => ({ pipelineCollapsed: !s.pipelineCollapsed })),
  // Pausing keeps the day; the loop restarts from Monday only when 3D wraps around.
  toggleWeekPlaying: () => set((s) => ({ weekPlaying: !s.weekPlaying })),
  setWeekDay: (day) => set((s) => (s.weekDay === day ? s : { weekDay: day })),
}))
