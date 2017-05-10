/* eslint-env mocha */
import { WebSocket, Server } from 'mock-socket'
import Devtools from './'
import assert from 'assert'
import { FunctionTree } from '../FunctionTree'

describe('Devtools', () => {
  it.only('should throw when remoteDebugger is not set', () => {
    assert.throws(() => {
      const devtools = new Devtools()
    }, (err) => {
      if (err instanceof Error) {
        return err.message === 'Function-tree DevtoolsBase: You have to pass in the "remoteDebugger" option'
      }
    })
  })
  it.only('should init correctly', (done) => {
    const mockServer = new Server('ws://localhost:8585')
    mockServer.on('connection', (server) => {
      server.on('message', (event) => {
        // client send ping
        assert.equal(JSON.parse(event).type, 'ping')
      })
      assert.ok(server)
    })

    const devtools = new Devtools({
      socketClass: WebSocket,
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
  it.only('should work when debugger is open when app loads', (done) => {
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
      socketClass: WebSocket,
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
      socketClass: WebSocket,
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
})
