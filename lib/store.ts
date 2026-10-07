import { create } from 'zustand'
import type { Region } from '@/lib/regions'

// Shared by DOM and 3D (wiki 09). A sidebar click writes selectedRegion;
// the late list and the map both read it.
type Store = {
  selectedRegion: Region | null
  pipelineCollapsed: boolean
  selectRegion: (region: Region | null) => void
  togglePipelineCollapsed: () => void
}

export const useStore = create<Store>((set) => ({
  selectedRegion: null,
  pipelineCollapsed: false,
  // Clicking the selected region again closes its list.
  selectRegion: (region) =>
    set((s) => ({ selectedRegion: s.selectedRegion === region ? null : region })),
  togglePipelineCollapsed: () => set((s) => ({ pipelineCollapsed: !s.pipelineCollapsed })),
}))
