import { useEventListener, useSafeState, useTargetElement, type ElementTarget } from '@shined/react-use'

export interface UseInputCompositionState {
  /**
   * Whether the input is in the composition state.
   */
  isComposing: boolean
  /**
   * The composition data.
   */
  data: string
}

export interface UseInputCompositionReturns extends UseInputCompositionState {}

export function useInputComposition<T extends HTMLElement>(target: ElementTarget<T>): UseInputCompositionReturns {
  const [state, setState] = useSafeState<UseInputCompositionState>({ isComposing: false, data: '' })

  const inputEl = useTargetElement(target)

  useEventListener(inputEl, ['compositionstart', 'compositionupdate'], (event: CompositionEvent) =>
    setState({ isComposing: true, data: event.data }),
  )

  useEventListener(inputEl, 'compositionend', () => setState({ isComposing: false, data: '' }))

  return state
}
