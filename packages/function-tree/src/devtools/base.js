import Path from '../Path'

export class DevtoolsBase {
  constructor ({
    remoteDebugger = null,
    reconnect = true,
    reconnectInterval = 10000
  } = {}) {
    this.remoteDebugger = remoteDebugger

    if (!this.remoteDebugger) {
      throw new Error('Function-tree DevtoolsBase: You have to pass in the "remoteDebugger" option')
    }

    this.backlog = []
    this.isConnected = false
    this.ws = null
    this.reconnectInterval = reconnectInterval
    this.doReconnect = reconnect

    this.sendInitial = this.sendInitial.bind(this)

    this.init()
  }
  createSocket () {
    this.ws = new WebSocket(`ws://${this.remoteDebugger}`)
  }
  addListeners () {
    this.createSocket()
    this.ws.onmessage = this.onMessage.bind(this)
  }
  onMessage (event) { }
  reconnect () {
    setTimeout(() => {
      this.init()
    }, this.reconnectInterval)
  }
  /*
    The debugger might be ready or it might not. The initial communication
    with the debugger requires a "ping" -> "pong" to identify that it
    is ready to receive messages.
    1. Debugger is open when app loads
      - Devtools sends "ping"
      - Debugger sends "pong"
      - Devtools sends "init"
    2. Debugger is opened after app load
      - Debugger sends "ping"
      - Devtools sends "init"
  */
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

      this.sendExecutionMessage(message)
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

      this.sendExecutionMessage(message)
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

      this.sendExecutionMessage(message)
    })
    tree.on('functionStart', (execution, funcDetails, payload) => {
      const message = this.safeStringify({
        type: 'executionFunctionStart',
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

      this.sendExecutionMessage(message)
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

      this.sendExecutionMessage(message)
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

      this.sendExecutionMessage(message)
    })
  }
  sendExecutionMessage (message) {
    if (this.isConnected) {
      this.sendMessage(message)
    } else {
      this.backlog.push(message)
    }
  }
  sendInitial () { }
  createExecutionMessage (debuggingData, context, functionDetails, payload) { }
  /*
    Sends execution data to the debugger. Whenever a signal starts
    it will send a message to the debugger, but any functions in the
    function tree might also use this to send debugging data. Like when
    mutations are done or any wrapped methods run.
  */
  sendExecutionData (debuggingData, context, functionDetails, payload) {
    const message = this.createExecutionMessage(debuggingData, context, functionDetails, payload)

    this.sendExecutionMessage(message)
  }
}

export default DevtoolsBase
