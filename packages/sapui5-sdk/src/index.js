const path = require('path')

module.exports = {
  root: path.resolve(`${__dirname}/../lib`),
  resources: path.resolve(`${__dirname}/../lib/resources`),
  testResources: path.resolve(`${__dirname}/../lib/test-resources`),
}
