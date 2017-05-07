/* eslint-env mocha */
import FunctionTree from '../'
import ContextProvider from './Context'
import assert from 'assert'

describe('ContextProvider', () => {
  it('should add whatever is passed on to the context', () => {
    const ft = new FunctionTree([
      ContextProvider({
        foo: 'bar'
      })
    ])

    ft.run([
      ({foo}) => {
        assert.equal(foo, 'bar')
      }
    ])
  })
  it('should run with DebuggerProvider', () => {
    const DebuggerProvider = () => {
        function provider (context, functionDetails, payload) {
          context.debugger = {
            send (data) {
              console.log(data)
            }
          }

          return context
        }

        return provider
      }
    const ft = new FunctionTree([
      DebuggerProvider(),
      ContextProvider({
        foo: 'bar'
      })
    ])

    ft.run([
      ({foo}) => {
        assert.equal(foo, 'bar')
        assert.equal(foo.length, 3)
      }
    ])
  })
  it('should run with DebuggerProvider with function context', () => {
    const DebuggerProvider = () => {
        function provider (context, functionDetails, payload) {
          context.debugger = {
            send (data) {
              console.log(data)
            }
          }

          return context
        }

        return provider
      }
    const ft = new FunctionTree([
      DebuggerProvider(),
      ContextProvider({
        foo: () => { return 'bar' }
      })
    ])

    ft.run([
      ({foo}) => {
        assert.equal(foo(), 'bar')
      }
    ])
  })
})
