/* eslint-env mocha */
import { WebSocket, Server } from 'mock-socket'
import Devtools from './'
import assert from 'assert'
import { FunctionTree } from '../FunctionTree'

Devtools.prototype.createSocket = function () {
  this.ws = new WebSocket(`ws://${this.remoteDebugger}`)
}

describe('Devtools', () => {
  describe('DevtoolsBase', () => {
    it('should throw when remoteDebugger is not set', () => {
      assert.throws(() => {
        new Devtools() // eslint-disable-line no-new
      }, (err) => {
        if (err instanceof Error) {
          return err.message === 'Devtools: You have to pass in the "remoteDebugger" option'
        }
      })
    })
  })
  it('should init correctly', (done) => {
    const mockServer = new Server('ws://localhost:8585')
    mockServer.on('connection', (server) => {
      server.on('message', (event) => {
        const message = JSON.parse(event)
        // client send ping
        assert.equal(message.type, 'ping')
      })
      assert.ok(server)
    })

    const devtools = new Devtools({
      remoteDebugger: 'localhost:8585',
      reconnect: true
    })
    setTimeout(() => {
      assert.equal(devtools.isConnected, false)
      assert.equal(devtools.reconnectInterval, 10000)
      assert.equal(devtools.doReconnect, true)
      mockServer.stop(done)
    }, 10)
  })
  it('should work when debugger is already opened', (done) => {
    const mockServer = new Server('ws://localhost:8585')
    let messages = []
    mockServer.on('connection', (server) => {
      server.on('message', (event) => {
        const message = JSON.parse(event)
        messages.push(message.type)
        switch (message.type) {
          case 'pong':
            server.send(JSON.stringify({type: 'ping'}))
            break
          case 'ping':
            server.send(JSON.stringify({type: 'pong'}))
            break
        }
      })
    })

    const devtools = new Devtools({
      remoteDebugger: 'localhost:8585',
      reconnect: true
    })
    setTimeout(() => {
      assert.deepEqual(messages, ['ping', 'init'])
      assert.equal(devtools.isConnected, true)
      mockServer.stop(done)
    }, 10)
  })
  /* it.only('should work when Debugger is opened after app load', (done) => {

    let messages = []

    const devtools = new Devtools({
      remoteDebugger: 'localhost:8585',
      reconnectInterval: 800
    })
    setTimeout(() => {
      const mockServer = new Server('ws://localhost:8585')
      mockServer.on('connection', (server) => {
        server.on('message', (event) => {
          const message = JSON.parse(event)
          messages.push(message.type)
          switch (message.type) {
            case 'pong':
              server.send(JSON.stringify({type: 'ping'}))
              break
            case 'ping':
              server.send(JSON.stringify({type: 'pong'}))
              break
          }
        })
      })
    }, 10)

    setTimeout(() => {
      assert.deepEqual(messages, ['pong', 'init'])
      assert.equal(devtools.isConnected, true)
      mockServer.stop(done);
    }, 1500);
  }) */
  it('should warn and reconnect to Debugger', (done) => {
    let warnCount = 0
    const originWarn = console.warn
    console.warn = function (...args) {
      warnCount++
      assert.equal(args[0], 'Debugger application is not running on selected port... will reconnect automatically behind the scenes')
      originWarn.apply(this, args)
    }
    const devtools = new Devtools({
      remoteDebugger: 'localhost:8585',
      reconnectInterval: 800
    })
    let mockServer
    let messages = []
    setTimeout(() => {
      mockServer = new Server('ws://localhost:8585')
      mockServer.on('connection', (server) => {
        server.on('message', (event) => {
          const message = JSON.parse(event)
          messages.push(message.type)
          switch (message.type) {
            case 'pong':
              server.send(JSON.stringify({type: 'ping'}))
              break
            case 'ping':
              server.send(JSON.stringify({type: 'pong'}))
              break
          }
        })
      })
    }, 700)

    setTimeout(() => {
      assert.deepEqual(messages, ['ping', 'init'])
      assert.equal(warnCount, 1)
      assert.equal(devtools.isConnected, true)
      console.warn = originWarn
      mockServer.stop(done)
    }, 1700)
  })
  it('should add function tree', (done) => {
    const mockServer = new Server('ws://localhost:8585')
    mockServer.on('connection', (server) => {
      server.on('message', (event) => {
        const message = JSON.parse(event)
        switch (message.type) {
          case 'pong':
            server.send(JSON.stringify({type: 'ping'}))
            break
          case 'ping':
            server.send(JSON.stringify({type: 'pong'}))
            break
        }
      })
    })

    const devtools = new Devtools({
      remoteDebugger: 'localhost:8585',
      reconnect: true
    })

    setTimeout(() => {
      const ft = new FunctionTree([])
      assert.equal(ft.contextProviders.length, 0)
      devtools.add(ft)
      assert.equal(ft.contextProviders.length, 1)
      assert.equal(devtools.trees.length, 1)
      assert.deepEqual(devtools.trees[0], ft)
      assert.equal(devtools.isConnected, true)
      mockServer.stop(done)
    }, 10)
  })
  it('should remove function tree', (done) => {
    const mockServer = new Server('ws://localhost:8585')
    mockServer.on('connection', (server) => {
      server.on('message', (event) => {
        const message = JSON.parse(event)
        switch (message.type) {
          case 'pong':
            server.send(JSON.stringify({type: 'ping'}))
            break
          case 'ping':
            server.send(JSON.stringify({type: 'pong'}))
            break
        }
      })
    })

    const devtools = new Devtools({
      remoteDebugger: 'localhost:8585',
      reconnect: true
    })

    setTimeout(() => {
      const ft = new FunctionTree([])
      devtools.add(ft)
      devtools.remove(ft)
      assert.equal(ft.contextProviders.length, 0)
      assert.equal(devtools.trees.length, 0)
      assert.equal(devtools.isConnected, true)
      mockServer.stop(done)
    }, 10)
  })
  it('should remove all trees', (done) => {
    const mockServer = new Server('ws://localhost:8585')
    mockServer.on('connection', (server) => {
      server.on('message', (event) => {
        const message = JSON.parse(event)
        switch (message.type) {
          case 'pong':
            server.send(JSON.stringify({type: 'ping'}))
            break
          case 'ping':
            server.send(JSON.stringify({type: 'pong'}))
            break
        }
      })
    })

    const devtools = new Devtools({
      remoteDebugger: 'localhost:8585',
      reconnect: true
    })

    setTimeout(() => {
      const ftA = new FunctionTree()
      ftA.type = 'A'
      devtools.add(ftA)
      assert.equal(ftA.contextProviders.length, 1)
      assert.equal(devtools.trees.length, 1)
      const ftB = new FunctionTree()
      ftB.type = 'B'
      devtools.add(ftB)
      assert.equal(ftB.contextProviders.length, 1)
      assert.equal(devtools.trees.length, 2)
      devtools.removeAll()
      assert.equal(ftA.contextProviders.length, 0)
      assert.equal(ftB.contextProviders.length, 0)
      assert.equal(devtools.trees.length, 0)
      assert.equal(devtools.isConnected, true)
      mockServer.stop(done)
    }, 10)
  })
  it('should watch function tree executions', (done) => {
    const mockServer = new Server('ws://localhost:8585')
    let messages = {}
    mockServer.on('connection', (server) => {
      server.on('message', (event) => {
        const message = JSON.parse(event)
        switch (message.type) {
          case 'pong':
            server.send(JSON.stringify({type: 'ping'}))
            break
          case 'ping':
            server.send(JSON.stringify({type: 'pong'}))
            break
          case 'init':
            break
          default:
            messages[message.type] = message
            break
        }
      })
    })

    const devtools = new Devtools({
      remoteDebugger: 'localhost:8585',
      reconnect: true
    })
    const ft = new FunctionTree([])
    devtools.add(ft)

    function actionA ({path}) {
      assert.ok(true)
      return path.success()
    }
    function actionB () {
      assert.ok(true)
      return { bar: 'baz' }
    }

    setTimeout(() => {
      ft.run([
        actionA, {
          success: [
            actionB
          ]
        }
      ], {
        foo: 'bar'
      })

      assert.deepEqual(Object.keys(messages), [ 'executionStart', 'executionFunctionStart', 'executionPathStart', 'executionFunctionEnd', 'executionEnd' ])
      assert.ok(messages.executionStart.data.execution)
      assert.equal(messages.executionStart.source, 'ft')

      assert.ok(messages.executionFunctionStart.data.execution)
      assert.equal(messages.executionFunctionStart.source, 'ft')
      assert.deepEqual(messages.executionFunctionStart.data.execution.payload, { foo: 'bar' })

      assert.ok(messages.executionPathStart.data.execution)
      assert.equal(messages.executionPathStart.source, 'ft')
      assert.equal(messages.executionPathStart.data.execution.path, 'success')

      assert.ok(messages.executionFunctionEnd.data.execution)
      assert.equal(messages.executionFunctionEnd.source, 'ft')
      assert.deepEqual(messages.executionFunctionEnd.data.execution.output, { bar: 'baz' })

      assert.ok(messages.executionEnd.data.execution)
      assert.equal(messages.executionEnd.source, 'ft')

      mockServer.stop(done)
    }, 10)
  })
  it('should watch function tree execution error', (done) => {
    const mockServer = new Server('ws://localhost:8585')
    let messages = {}
    mockServer.on('connection', (server) => {
      server.on('message', (event) => {
        const message = JSON.parse(event)
        switch (message.type) {
          case 'pong':
            server.send(JSON.stringify({type: 'ping'}))
            break
          case 'ping':
            server.send(JSON.stringify({type: 'pong'}))
            break
          case 'init':
            break
          default:
            messages[message.type] = message
            break
        }
      })
    })

    const devtools = new Devtools({
      remoteDebugger: 'localhost:8585',
      reconnect: true
    })
    const ft = new FunctionTree([])
    devtools.add(ft)

    function actionA () {
      return {
        foo: 'bar'
      }
    }

    ft.once('error', (error) => {
      assert.ok(error.message.match(/needs to be a path of either success/))
    })

    setTimeout(() => {
      ft.run([
        actionA, {
          success: []
        }
      ]).catch((error) => {
        assert.ok(error.message.match(/needs to be a path of either success/))
      })

      assert.deepEqual(Object.keys(messages), [ 'executionStart', 'executionFunctionStart', 'executionFunctionError' ])
      assert.ok(messages.executionStart.data.execution)
      assert.equal(messages.executionStart.source, 'ft')

      assert.ok(messages.executionFunctionStart.data.execution)
      assert.equal(messages.executionFunctionStart.source, 'ft')

      assert.ok(messages.executionFunctionError.data.execution)
      assert.equal(messages.executionFunctionError.source, 'ft')
      assert.equal(messages.executionFunctionError.data.execution.error.name, 'FunctionTreeExecutionError')
      assert.equal(messages.executionFunctionError.data.execution.error.func, actionA.toString())
      assert.ok(messages.executionFunctionError.data.execution.error.message.match(/needs to be a path of either success/))

      mockServer.stop(done)
    }, 10)
  })
  it('should keep execution messages when debugger is not ready and send bulk messages after debugger is ready', (done) => {
    const mockServer = new Server('ws://localhost:8585')
    let messages = {}
    mockServer.on('connection', (server) => {
      server.on('message', (event) => {
        const message = JSON.parse(event)
        switch (message.type) {
          case 'pong':
            server.send(JSON.stringify({type: 'ping'}))
            break
          case 'ping':
            server.send(JSON.stringify({type: 'pong'}))
            break
          case 'init':
            break
          default:
            messages[message.type] = message
            break
        }
      })
    })

    const devtools = new Devtools({
      remoteDebugger: 'localhost:8585',
      reconnect: true
    })
    const ft = new FunctionTree([])
    devtools.add(ft)

    function actionA ({path}) {
      assert.ok(true)
      return path.success()
    }
    function actionB () {
      assert.ok(true)
      return { bar: 'baz' }
    }
    ft.run([
      actionA, {
        success: [
          actionB
        ]
      }
    ], {
      foo: 'bar'
    })

    setTimeout(() => {
      assert.deepEqual(Object.keys(messages), [ 'bulk' ])
      assert.equal(messages.bulk.data.messages.length, 6)

      const executionStartMessage = JSON.parse(messages.bulk.data.messages[0])
      assert.equal(executionStartMessage.type, 'executionStart')
      assert.ok(executionStartMessage.data.execution)
      assert.equal(executionStartMessage.source, 'ft')

      let executionFunctionStartMessage = JSON.parse(messages.bulk.data.messages[1])
      assert.equal(executionFunctionStartMessage.type, 'executionFunctionStart')
      assert.ok(executionFunctionStartMessage.data.execution)
      assert.equal(executionFunctionStartMessage.source, 'ft')
      assert.deepEqual(executionFunctionStartMessage.data.execution.payload, { foo: 'bar' })

      const executionPathStartMessage = JSON.parse(messages.bulk.data.messages[2])
      assert.equal(executionPathStartMessage.type, 'executionPathStart')
      assert.ok(executionPathStartMessage.data.execution)
      assert.equal(executionPathStartMessage.source, 'ft')
      assert.equal(executionPathStartMessage.data.execution.path, 'success')

      executionFunctionStartMessage = JSON.parse(messages.bulk.data.messages[3])
      assert.equal(executionFunctionStartMessage.type, 'executionFunctionStart')
      assert.ok(executionFunctionStartMessage.data.execution)
      assert.equal(executionFunctionStartMessage.source, 'ft')
      assert.deepEqual(executionFunctionStartMessage.data.execution.payload, { foo: 'bar' })

      const executionFunctionEndMessage = JSON.parse(messages.bulk.data.messages[4])
      assert.equal(executionFunctionEndMessage.type, 'executionFunctionEnd')
      assert.ok(executionFunctionEndMessage.data.execution)
      assert.equal(executionFunctionEndMessage.source, 'ft')
      assert.deepEqual(executionFunctionEndMessage.data.execution.output, { bar: 'baz' })

      const executionEndMessage = JSON.parse(messages.bulk.data.messages[5])
      assert.equal(executionEndMessage.type, 'executionEnd')
      assert.ok(executionEndMessage.data.execution)
      assert.equal(executionEndMessage.source, 'ft')

      mockServer.stop(done)
    }, 10)
  })
  it('should send provider data', (done) => {
    const mockServer = new Server('ws://localhost:8585')
    let messages = {}
    mockServer.on('connection', (server) => {
      server.on('message', (event) => {
        const message = JSON.parse(event)
        switch (message.type) {
          case 'pong':
            server.send(JSON.stringify({type: 'ping'}))
            break
          case 'ping':
            server.send(JSON.stringify({type: 'pong'}))
            break
          case 'init':
            break
          default:
            messages[message.type] = message
            break
        }
      })
    })
    const MyProvider = (options = {}) => {
      let cachedProvider = null

      function createProvider (context) {
        return {
          doSomething (value) {
            return value
          }
        }
      }

      return (context) => {
        context.myProvider = cachedProvider = (cachedProvider || createProvider(context))

        if (context.debugger) {
          context.debugger.wrapProvider('myProvider')
        }

        return context
      }
    }
    const devtools = new Devtools({
      remoteDebugger: 'localhost:8585',
      reconnect: true
    })
    const ft = new FunctionTree([
      MyProvider()
    ])
    devtools.add(ft)

    function actionA ({myProvider}) {
      assert.ok(true)
      assert.equal(myProvider.doSomething('bar'), 'bar')
    }

    setTimeout(() => {
      ft.run([
        actionA
      ], {
        foo: 'bar'
      })

      assert.deepEqual(Object.keys(messages), [ 'executionStart', 'executionFunctionStart', 'execution', 'executionEnd' ])
      assert.ok(messages.executionStart.data.execution)
      assert.equal(messages.executionStart.source, 'ft')

      assert.ok(messages.executionFunctionStart.data.execution)
      assert.equal(messages.executionFunctionStart.source, 'ft')
      assert.deepEqual(messages.executionFunctionStart.data.execution.payload, { foo: 'bar' })

      assert.ok(messages.execution.data.execution)
      assert.equal(messages.execution.source, 'ft')
      assert.deepEqual(messages.execution.data.execution.payload, { foo: 'bar' })
      assert.equal(messages.execution.data.execution.data.method, 'myProvider.doSomething')
      assert.deepEqual(messages.execution.data.execution.data.args, ['bar'])

      assert.ok(messages.executionEnd.data.execution)
      assert.equal(messages.executionEnd.source, 'ft')

      mockServer.stop(done)
    }, 10)
  })
})
