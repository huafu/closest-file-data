const config = require('./jest.config')
module.exports = Object.assign({}, config, {
  rootDir: 'dist',
  testRegex: '\\.spec\\.js$',
  })
