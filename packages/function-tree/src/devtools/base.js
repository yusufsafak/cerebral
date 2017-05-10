import Path from '../Path'
import WebSocket from 'universal-websocket-client'

export class DevtoolsBase {
  constructor (options = {
    socketClass: WebSocket,
    remoteDebugger: null,
    reconnect: true
  }) {
    this.remoteDebugger = options.remoteDebugger || null

    if (!this.remoteDebugger) {
      throw new Error('Function-tree DevtoolsBase: You have to pass in the "remoteDebugger" option')
    }

    this.socketClass = options.socketClass
    this.backlog = []
    this.isConnected = false
    this.ws = null
    this.reconnectInterval = 10000
    this.doReconnect = typeof options.reconnect === 'undefined' ? true : options.reconnect

    this.sendInitial = this.sendInitial.bind(this)

    this.init()
  }
  addListeners () {
    this.ws = new this.socketClass(`ws://${this.remoteDebugger}`)
    this.ws.onmessage = this.onMessage.bind(this)
  }
  onMessage (event) { }
  reconnect () {
    setTimeout(() => {
      this.init()
      this.ws.onclose = () => {
        this.isConnected = false
        this.reconnect()
      }
    }, this.reconnectInterval)
  }
  init () {
    this.addListeners()
    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({type: 'ping'}))
    }
    this.ws.onerror = () => {}
    this.ws.onclose = () => {
      this.isConnected = false

      if (this.doReconnect) {
        console.warn('Debugger application is not running on selected port... will reconnect automatically behind the scenes')
        this.reconnect()
      }
    }
  }
  sendMessage (stringifiedMessage) {
    this.ws.send(stringifiedMessage)
  }
  watchExecution (tree, source) {
    tree.on('start', (execution, payload) => {
      const message = JSON.stringify({
        type: 'executionStart',
        source: source,
        data: {
          execution: {
            executionId: execution.id,
            name: execution.name,
            staticTree: execution.staticTree,
            datetime: execution.datetime,
            executedBy: (payload && payload._execution) ? payload._execution : null
          }
        }
      })

      if (this.isConnected) {
        this.sendMessage(message)
      } else {
        this.backlog.push(message)
      }
    })
    tree.on('end', (execution) => {
      const message = JSON.stringify({
        type: 'executionEnd',
        source: source,
        data: {
          execution: {
            executionId: execution.id
          }
        }
      })
      this.latestExecutionId = execution.id

      if (this.isConnected) {
        this.sendMessage(message)
      } else {
        this.backlog.push(message)
      }
    })
    tree.on('pathStart', (path, execution, funcDetails) => {
      const message = JSON.stringify({
        type: 'executionPathStart',
        source: source,
        data: {
          execution: {
            executionId: execution.id,
            functionIndex: funcDetails.functionIndex,
            path
          }
        }
      })

      if (this.isConnected) {
        this.sendMessage(message)
      } else {
        this.backlog.push(message)
      }
    })
    tree.on('functionStart', (execution, funcDetails, payload) => {
      const message = this.safeStringify({
        type: 'execution',
        source: source,
        data: {
          execution: {
            executionId: execution.id,
            functionIndex: funcDetails.functionIndex,
            payload,
            data: null
          }
        }
      })

      if (this.isConnected) {
        this.sendMessage(message)
      } else {
        this.backlog.push(message)
      }
    })
    tree.on('functionEnd', (execution, funcDetails, payload, result) => {
      if (!result || (result instanceof Path && !result.payload)) {
        return
      }

      const message = this.safeStringify({
        type: 'executionFunctionEnd',
        source: source,
        data: {
          execution: {
            executionId: execution.id,
            functionIndex: funcDetails.functionIndex,
            output: result instanceof Path ? result.payload : result
          }
        }
      })

      if (this.isConnected) {
        this.sendMessage(message)
      } else {
        this.backlog.push(message)
      }
    })
    tree.on('error', (error, execution, funcDetails) => {
      const message = JSON.stringify({
        type: 'executionFunctionError',
        source: source,
        data: {
          execution: {
            executionId: execution.id,
            functionIndex: funcDetails.functionIndex,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
              func: funcDetails.function.toString()
            }
          }
        }
      })

      if (this.isConnected) {
        this.sendMessage(message)
      } else {
        this.backlog.push(message)
      }
    })
  }
  sendInitial () { }
  /*
    Create the stringified message for the debugger. As we need to
    store mutations with the default true "storeMutations" option used
    by time travel and jumping between Cerebral apps, we are careful
    not doing unnecessary stringifying.
  */
  createExecutionMessage (debuggingData, context, functionDetails, payload) { }
  sendExecutionData (debuggingData, context, functionDetails, payload) {
    const message = this.createExecutionMessage(debuggingData, context, functionDetails, payload)

    if (this.isConnected) {
      this.sendMessage(message)
    } else {
      this.backlog.push(message)
    }
  }
}

export default DevtoolsBase
