const closestFileData = require('..').default
const { readFileSync } = require('fs')
const { relative, resolve, sep } = require('path')

const PROJECT_ROOT = resolve(__dirname, 'dummy-root', 'project')
const rootify = p => '/project/' + relative(PROJECT_ROOT, p).replace(sep, '/')

describe('looking for babel config', () => {
  const babelReaders = [
    { basename: '.babelrc', read: f => JSON.parse(readFileSync(f, 'utf-8')) },
    { basename: '.babelrc.js', read: f => require(f) },
    { basename: 'package.json', read: f => require(f).babel },
  ]

  it('should get the config from .babelrc in /', () => {
    const result = closestFileData(PROJECT_ROOT, babelReaders)
    expect(rootify(result.path)).toBe(`/project/.babelrc`)
    expect(result.data).toEqual({ filename: '/project/.babelrc' })
  })

  it('should get the config from .babelrc.js in /src', () => {
    let result
    const doExpect = () => {
      expect(rootify(result.path)).toBe(`/project/src/.babelrc.js`)
      expect(result.data).toEqual({ filename: '/project/src/.babelrc.js' })
    }
    result = closestFileData(`${PROJECT_ROOT}/src`, babelReaders)
    doExpect()
    result = closestFileData(`${PROJECT_ROOT}/src/index.js`, babelReaders)
    doExpect()
    result = closestFileData(`${PROJECT_ROOT}/src/utils/dummy.js`, babelReaders)
    doExpect()
  })

  it('should get the config from within package.json in /project/src/sub-project', () => {
    const result = closestFileData(`${PROJECT_ROOT}/src/sub-project`, babelReaders)
    expect(rootify(result.path)).toBe(`/project/src/sub-project/package.json`)
    expect(result.data).toEqual({ filename: `/project/src/sub-project/package.json` })
  })

  it('should get the config from within .babelrc in /project/src/sub-project/src', () => {
    const result = closestFileData(`${PROJECT_ROOT}/src/sub-project/src`, babelReaders)
    expect(rootify(result.path)).toBe(`/project/src/sub-project/src/.babelrc`)
    expect(result.data).toEqual({ filename: `/project/src/sub-project/src/.babelrc` })
  })
})
