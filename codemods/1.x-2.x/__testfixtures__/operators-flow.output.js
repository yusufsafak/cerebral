/* eslint-disable */
import {when, wait, state, input} from 'cerebral/operators';

export default [
  // Conditional truthy check of state or input
  when(state`foo.isAwesome`), {
    true: [],
    false: []
  },

  when(input`foo.isAwesome`), {
    true: [],
    false: []
  }
]
