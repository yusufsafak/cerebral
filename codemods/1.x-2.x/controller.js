module.exports = function (fileInfo, api) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const modelImports = root.find(j.ImportDeclaration, {
    source: {
      value: 'cerebral/models/immutable'
    }
  })

  if (!modelImports.length) {
    return null
  }

  const modelImportName = modelImports.find(j.Identifier).get(0).node.name

  modelImports.remove()

  const modelInstances = root.find(j.CallExpression, {
    callee: {
      name: modelImportName
    }
  })

  const objectExpression = modelInstances.find(j.ObjectExpression)
  if (!objectExpression.length) {
    return null
  }

  const newObject = j.objectExpression([
  	j.property('init', j.identifier("state"), objectExpression.get(0).node)
  ])

  modelInstances.replaceWith(newObject)

  return root.toSource()
}
