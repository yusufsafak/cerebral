/* eslint-env mocha */
import validate from './validate'
import assert from 'assert'
import rules from '../rules'

describe('validate', () => {
  it('should return initialValidation if there is no validationRules', () => {
    const result = validate(null, 'Ben')
    assert.deepEqual(result, {
      isValid: true,
      failedRule: null
    })
  })
  it('should validate using validationRules', () => {
    const result = validate(null, 'Ben', ['isNumeric'])
    assert.equal(result.isValid, false)
    assert.equal(result.failedRule.name, 'isNumeric')
  })
  it('should validate with multiple rules', () => {
    const result = validate(null, 'Ben', ['isNumeric', 'minLength:2'])
    assert.equal(result.isValid, false)
    assert.equal(result.failedRule.name, 'isNumeric')
  })
  it('should return initialValidation if there is no failed rules', () => {
    const result = validate(null, 'Ben', ['isValue', 'minLength:2'])
    assert.deepEqual(result, {
      isValid: true,
      failedRule: null
    })
  })
  it('should validate when validationRule arg is not JSON parsable', () => {
    const result = validate(null, 'Ben', ['equals:Ben'])
    assert.deepEqual(result, {
      isValid: true,
      failedRule: null
    })
  })
})
