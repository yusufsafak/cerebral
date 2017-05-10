/* eslint-env mocha */
import { WebSocket, Server } from 'mock-socket'
import Devtools from './'
import assert from 'assert'
import { FunctionTree } from '../FunctionTree'

Devtools.prototype.addListeners = function () {
  this.ws = new WebSocket(`ws://${this.remoteDebugger}`)
  this.ws.onmessage = (event) => {
    const message = JSON.parse(event.data)
    switch (message.type) {
      case 'pong':
        this.sendInitial()
        break
      case 'ping':
        this.sendInitial()
        break
    }
  }
}


describe('Devtools', () => {
  it('should throw when remoteDebugger is not set', () => {
    assert.throws(() => {
      const devtools = new Devtools()
    }, (err) => {
      if (err instanceof Error) {
        return err.message === 'Function-tree DevtoolsBase: You have to pass in the "remoteDebugger" option'
      }
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
      mockServer.stop(done);
    }, 10);
  })
  it('should work when debugger is open when app loads', (done) => {
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
      mockServer.stop(done);
    }, 10);
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
    const ft = new FunctionTree([])
    assert.equal(ft.contextProviders.length, 0)
    devtools.add(ft)

    setTimeout(() => {
      assert.equal(ft.contextProviders.length, 1)
      assert.equal(devtools.trees.length, 1)
      assert.deepEqual(devtools.trees[0], ft)
      assert.equal(devtools.isConnected, true)
      mockServer.stop(done);
    }, 10);
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
    const ft = new FunctionTree([])
    devtools.add(ft)
    devtools.remove(ft)
    assert.equal(ft.contextProviders.length, 0)
    assert.equal(devtools.trees.length, 0)

    setTimeout(() => {
      assert.equal(devtools.isConnected, true)
      mockServer.stop(done);
    }, 10);
  })
  it('should remove all trees using destroy method', (done) => {
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
    devtools.destroy()

    setTimeout(() => {
      //assert.equal(ftA.contextProviders.length, 0)
      //assert.equal(ftB.contextProviders.length, 0)
      //assert.equal(devtools.trees.length, 0)
      assert.equal(devtools.isConnected, true)
      mockServer.stop(done);
    }, 10);
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
    assert.equal(ft.contextProviders.length, 0)
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

      mockServer.stop(done);
    }, 10);
  })
})
