/* eslint-env mocha */
'use strict'

import assert from 'assert'
import {state, signal, props} from '../tags'
import {compute} from '../'
import {Container, StateContainer, connect, decorator} from '../viewFactories/react'
import { WebSocket, Server } from 'mock-socket'
import {Devtools} from './'
import Controller from '../Controller'
import React from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'

Devtools.prototype.createSocket = function () {
  this.ws = new WebSocket(`ws://${this.remoteDebugger}`)
}


describe('Devtools', () => {
  it('should throw when remoteDebugger is not set', () => {
    assert.throws(() => {
      const devtools = new Devtools({})
    }, (err) => {
      if (err instanceof Error) {
        return err.message === 'Function-tree DevtoolsBase: You have to pass in the "remoteDebugger" option'
      }
    })
  })
  it('should init correctly and work when debugger is open when app loads', (done) => {
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
    const controller = new Controller({
      devtools: new Devtools({
        remoteDebugger: 'localhost:8585',
        reconnect: true
      })
    })
    assert.equal(controller.devtools.isConnected, false)
    setTimeout(() => {
      assert.deepEqual(messages, ['ping', 'init', 'bulk', 'components'])
      assert.equal(controller.devtools.isConnected, true)
      assert.equal(controller.devtools.reconnectInterval, 5000)
      assert.equal(controller.devtools.doReconnect, true)
      assert.deepEqual(controller.devtools.debuggerComponentsMap, {})
      assert.equal(controller.devtools.debuggerComponentDetailsId, 1)
      assert.equal(controller.devtools.storeMutations, true)
      assert.equal(controller.devtools.preventExternalMutations, true)
      assert.equal(controller.devtools.preventPropsReplacement, false)
      assert.equal(controller.devtools.bigComponentsWarning, 10)

      assert.deepEqual(controller.devtools.controller, controller)
      assert.deepEqual(controller.devtools.originalRunTreeFunction, controller.run)
      assert.equal(controller.devtools.isResettingDebugger, false)
      assert.equal(controller.devtools.initialModelString, JSON.stringify(controller.model.get()))
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
  it('should warn and try to reconnect to Debugger', (done) => {
    let warnCount = 0
    const originWarn = console.warn
    console.warn = function (...args) {
      warnCount++
      assert.equal(args[0], 'Debugger application is not running on selected port... will reconnect automatically behind the scenes')
      originWarn.apply(this, args)
    }
    const controller = new Controller({
      devtools: new Devtools({
        remoteDebugger: 'localhost:8585',
        reconnectInterval: 800
      })
    })
    assert.equal(controller.devtools.isConnected, false)
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
      assert.deepEqual(messages, ['ping', 'init', 'bulk', 'components'])
      assert.equal(warnCount, 1)
      assert.equal(controller.devtools.isConnected, true)
      console.warn = originWarn
      mockServer.stop(done);
    }, 1700);
  })
  /*
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

      mockServer.stop(done);
    }, 10);
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

      mockServer.stop(done);
    }, 10);
  })
  it('should keep execution messages when debugger is not ready and send all execution messages after debugger is ready', (done) => {
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

      mockServer.stop(done);
    }, 10);
  })*/
})
