/* eslint-env mocha */
import { WebSocket, Server } from 'mock-socket'
import Devtools from './'
import assert from 'assert'
import { FunctionTree } from '../FunctionTree'


describe('Devtools', () => {
  it('should correctly initiate primitive', (done) => {
    const mockServer = new Server('ws://localhost:8585')
    mockServer.on('connection', (server) => {
      server.on('message', (event) => {
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
      mockServer.stop(done);
    }, 10);
  })
})
