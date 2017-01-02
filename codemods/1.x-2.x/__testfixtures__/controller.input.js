/* eslint-disable */
import {Controller} from 'cerebral'
import Model from 'cerebral/models/immutable'

const controller = Controller(Model({
  // You can add some initial state here if you want
  foo: 'bar'
}))

export default controller
