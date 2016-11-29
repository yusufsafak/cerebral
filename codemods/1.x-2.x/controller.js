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

  modelInstances.replaceWith(objectExpression.get(0).node)

  return root.toSource()
}
