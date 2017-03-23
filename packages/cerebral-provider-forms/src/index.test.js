/* eslint-env mocha */
import {Controller} from 'cerebral'
import {state} from 'cerebral/tags'
import FormsProvider from '.'
import setField from './operators/setField'
import assert from 'assert'
import rules from './rules'

describe('provider', () => {
  it('should be able to add rules', () => {
    const controller = Controller({
      providers: [
        FormsProvider({
          rules: {
            isBen (value) {
              return value === 'Ben'
            }
          }
        })
      ],
      state: {
        form: {
          name: {
            value: 'Ben',
            validationRules: ['isBen']
          }
        }
      },
      signals: {
        test: [
          ({forms}) => {
            const form = forms.get('form')
            assert.equal(form.name.value, 'Ben')
            assert.equal(form.name.isValid, true)
          }
        ]
      }
    })
    controller.getSignal('test')()
  })
  it('should be able to update rules', () => {
    const controller = Controller({
      providers: [FormsProvider()],
      state: {
        form: {
          name: {
            value: 'Ben',
            validationRules: ['isBen']
          }
        }
      },
      signals: {
        test: [
          ({forms}) => {
            forms.updateRules({
              isBen (value) {
                return value === 'Ben'
              }
            })
          },
          ({forms}) => {
            const form = forms.get('form')
            assert.equal(form.name.value, 'Ben')
            assert.equal(form.name.isValid, true)
          }
        ]
      }
    })
    controller.getSignal('test')()
  })
  it('should be able to set error messages', () => {
    const controller = Controller({
      providers: [
        FormsProvider({
          errorMessages: {
            minLength (value, minLengthValue) {
              assert.equal(value, 'Be')
              assert.equal(minLengthValue, 3)

              return `is length ${value.length}, should be ${minLengthValue}`
            }
          }
        })
      ],
      state: {
        form: {
          name: {
            value: 'Be',
            validationRules: ['minLength:3']
          }
        }
      },
      signals: {
        test: [
          ({forms}) => {
            const form = forms.get('form')
            assert.equal(form.name.value, 'Be')
            assert.equal(form.name.isValid, false)
            assert.equal(form.name.errorMessage, 'is length 2, should be 3')
          }
        ]
      }
    })
    controller.getSignal('test')()
    rules._errorMessages = {}
  })
  it('should be able to update error messages', () => {
    const controller = Controller({
      providers: [FormsProvider()],
      state: {
        form: {
          name: {
            value: 'Be',
            validationRules: ['minLength:3']
          }
        }
      },
      signals: {
        test: [
          ({forms}) => {
            forms.updateErrorMessages({
              minLength (value, minLengthValue) {
                assert.equal(value, 'Be')
                assert.equal(minLengthValue, 3)

                return `is length ${value.length}, should be ${minLengthValue}`
              }
            })
          },
          ({forms}) => {
            const form = forms.get('form')
            assert.equal(form.name.value, 'Be')
            assert.equal(form.name.isValid, false)
            assert.equal(form.name.errorMessage, 'is length 2, should be 3')
          }
        ]
      }
    })
    controller.getSignal('test')()
    rules._errorMessages = {}
  })
  it('should be able to update field error message', () => {
    const controller = Controller({
      providers: [
        FormsProvider({
          errorMessages: {
            minLength (value, minLengthValue) {
              return `is length ${value.length}, should be equal or more than ${minLengthValue}`
            },
            isEmail (value) {
              return `${value} is not valid email address`
            }
          }
        })
      ],
      state: {
        form: {
          email: {
            value: 'be',
            validationRules: ['minLength:3', 'isEmail']
          }
        }
      },
      signals: {
        test: [
          ({forms}) => {
            const form = forms.get('form')
            assert.equal(form.isValid, false)
            assert.equal(form.email.value, 'be')
            assert.equal(form.email.isValid, false)
            assert.equal(form.email.failedRule.name, 'minLength')
            assert.equal(form.email.failedRule.arg, 3)
            assert.equal(form.email.errorMessage, 'is length 2, should be equal or more than 3')
          }
        ],
        changeEmail: [
          setField(state`form.email`, 'ben@example.com'),
          ({forms}) => {
            const form = forms.get('form')
            assert.equal(form.email.value, 'ben@example.com')
            assert.equal(form.email.isValid, true)
            assert.equal(form.email.failedRule, null)
            assert.equal(form.email.errorMessage, undefined)
          }
        ]
      }
    })
    controller.getSignal('test')()
    controller.getSignal('changeEmail')()
    rules._errorMessages = {}
  })
  it('should be able to reset form', () => {
    const controller = Controller({
      providers: [FormsProvider()],
      state: {
        form: {
          name: {
            value: 'Be',
            defaultValue: 'Ben',
            validationRules: ['minLength:3']
          }
        }
      },
      signals: {
        test: [
          ({forms}) => {
            forms.reset('form')
            const form = forms.get('form')
            assert.equal(form.name.value, 'Ben')
            assert.equal(form.name.isValid, true)
          }
        ]
      }
    })
    controller.getSignal('test')()
    rules._errorMessages = {}
  })
  it('should be able to work with DebuggerProvider', () => {
    const DebuggerProviderFactory = () => {
      function DebuggerProvider (context, functionDetails, payload, prevPayload) {
        context.debugger = {
          wrapProvider (providerKey) { }
        }
        return context
      }
      return DebuggerProvider
    }
    const controller = Controller({
      providers: [DebuggerProviderFactory(), FormsProvider()],
      state: {
        form: {
          name: {
            value: 'Ben'
          }
        }
      },
      signals: {
        test: [
          ({forms}) => {
            const form = forms.get('form')
            assert.equal(form.name.value, 'Ben')
            assert.equal(form.name.isValid, true)
          }
        ]
      }
    })
    controller.getSignal('test')()
    rules._errorMessages = {}
  })
})
