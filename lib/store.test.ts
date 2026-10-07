import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from './store'

const reset = () => useStore.setState({ selectedRegion: null, pipelineCollapsed: false })

describe('store', () => {
  beforeEach(reset)

  it('selecting a region opens it, selecting another switches, selecting it again closes', () => {
    const { selectRegion } = useStore.getState()
    selectRegion('WEST')
    expect(useStore.getState().selectedRegion).toBe('WEST')
    selectRegion('SOUTH')
    expect(useStore.getState().selectedRegion).toBe('SOUTH')
    selectRegion('SOUTH')
    expect(useStore.getState().selectedRegion).toBeNull()
  })

  it('selectRegion(null) clears the selection (Escape)', () => {
    useStore.getState().selectRegion('WEST')
    useStore.getState().selectRegion(null)
    expect(useStore.getState().selectedRegion).toBeNull()
  })

  it('toggles the collapsed pipeline (callout 1)', () => {
    useStore.getState().togglePipelineCollapsed()
    expect(useStore.getState().pipelineCollapsed).toBe(true)
    useStore.getState().togglePipelineCollapsed()
    expect(useStore.getState().pipelineCollapsed).toBe(false)
  })
})
