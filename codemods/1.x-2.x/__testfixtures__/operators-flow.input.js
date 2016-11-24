import {
  state,
  input,
  when,
  delay
} from 'cerebral/operators'

export default [
  // Conditional truthy check of state or input
  when('state:foo.isAwesome'), {
    true: [],
    false: []
  },

  when('input:foo.isAwesome'), {
    true: [],
    false: []
  },

  // Wait 200ms, then continue chain
  ...delay(200, [
    doSomething
  ])
]
