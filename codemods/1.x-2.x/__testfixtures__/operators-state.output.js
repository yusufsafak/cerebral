import {
  set,
  copy,
  unset,
  toggle,
  state,
  input,
  output
} from 'cerebral/operators'

export default [
  // Copy
  set(state`foo.bar`, input`bar`),
  set(input`foo`, output`bar`),
  set(input`foo`, state`foo.bar`),
  set(state`foo.bar`, state`bar.baz`),

  // Set state
  set(state`foo.bar`, true),
  set(state`foo.bar`, true),

  // Unset key from object
  unset(state`users.user0`),
  unset(state`users.user0`),

  // Toggle a boolean value in your state
  toggle(state`foo`),
  toggle(state`foo`)
]
