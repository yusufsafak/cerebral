import {
  set,
  unset,
  toggle,
  state,
  input,
  output
} from 'cerebral/operators'

export default [
  // Copy
  set(input`bar`, state`foo.bar`),
  set(input`bar`, input`foo`),
  set(state`foo.bar`, input`foo`),
  set(state`bar.baz`, state`foo.bar`),

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
