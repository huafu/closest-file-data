import * as fs from './__mocks__/fs'
import * as path from './__mocks__/path'
import subject, { IClosestDataResult, IDataReader } from './index'

/*
 * In these tests the fs tree is faked using `makeTree` as a JSON tree.
 * Values can be used in the reader(s) then for expectations.
 * The config reader used in most tests will return an object with `file`
 * being the path to the file it received and `val` being the (fake) content
 * of the file as mocked in the tree.
 * Having the full path to the file will allow us to test the cache.
 *
 * We have a makeTest helper so that they could be more readable
 */

// for some reason auto-mocking does not work
jest.mock('fs', () => require('./__mocks__/fs'))
jest.mock('path', () => require('./__mocks__/path'))

const callAndExpect = (from: any, readers: IDataReader | IDataReader[], expected: IClosestDataResult | null) => {
  const result = subject(from, readers)
  if (expected) {
    expect(result).toHaveProperty('path', expected.path)
    expect(result).toHaveProperty('data', expected.data)
  } else {
    expect(subject(from, readers)).toBe(undefined)
  }
}

const makeResult = (filePath: string, data: any) => ({ path: filePath, data })

const makeTest = (from: any, readers: IDataReader | IDataReader[], expected: IClosestDataResult | null) => {
  test(`looking around ${from} should get ${expected ? expected.path : 'nothing'}`, () => {
    callAndExpect(from, readers, expected)
  })
}

// some constants, easier for expectations later
const CONF_YML = 'config.yml'
const CONF_RC = '.configrc'
const CONF_JSON = 'config.json'
const CONF_XML = 'config.yml'
const CONF_PKG = 'package.json'

// to make strict equality (testing cache)
const DATA_A = fs.__d({ v: 'data a' })
const DATA_B = fs.__d({ v: 'data b' })
const DATA_C = fs.__d({ v: 'data c' })
const DATA_D = fs.__d({ v: 'data d' })
const DATA_E = fs.__d({ v: 'data e' })
const DATA_F = fs.__d({ v: 'data f' })
const DATA_G = fs.__d({ v: 'data g' })
const DATA_H = fs.__d({ v: 'data h' })
const DATA_I = fs.__d({ v: 'data i' })
const DATA_J = fs.__d({ v: 'data j' })
const DATA_K = fs.__d({ v: 'data k' })

beforeEach(() => {
  subject.cache.clear()
  jest.clearAllMocks()
})

describe('with one reader', () => {
  const readers: IDataReader = { basename: CONF_YML, read: f => fs.__files[f] }
  beforeAll(() => {
    fs.__setupTree({
      '/project/path': {
        [CONF_YML]: DATA_A,
        child1: {
          'file1.js': 'foo',
          [CONF_YML]: DATA_B,
        },
        child2: {
          'file2.ts': 'bar',
          [CONF_YML]: DATA_C,
        },
      },
    })
  })

  makeTest('/', readers, null)
  makeTest('/project', readers, null)
  makeTest('/project/path', readers, makeResult(`/project/path/${CONF_YML}`, DATA_A))
  makeTest('/project/path/stuff.js', readers, makeResult(`/project/path/${CONF_YML}`, DATA_A))
  makeTest('/project/path/child1', readers, makeResult(`/project/path/child1/${CONF_YML}`, DATA_B))
  makeTest('/project/path/child1/dummy.js', readers, makeResult(`/project/path/child1/${CONF_YML}`, DATA_B))
  makeTest('/project/path/child2/dummy.js', readers, makeResult(`/project/path/child2/${CONF_YML}`, DATA_C))
  makeTest('/project/path/child3/dummy.js', readers, makeResult(`/project/path/${CONF_YML}`, DATA_A))
})

describe('with many readers', () => {
  const readers: IDataReader[] = [
    { basename: CONF_PKG, read: f => fs.__files[f] },
    { basename: CONF_JSON, read: f => fs.__files[f] },
    { basename: CONF_XML, read: f => fs.__files[f] },
  ]
  beforeAll(() => {
    fs.__setupTree({
      '/a/path': {
        a: {
          [CONF_XML]: DATA_H,
          b: {
            [CONF_XML]: DATA_I,
            c: {
              [CONF_XML]: DATA_J,
            },
          },
        },
        [CONF_PKG]: DATA_A,
        child1: {
          'file1.js': 'foo',
          [CONF_PKG]: DATA_B,
          sub: {
            [CONF_RC]: DATA_C,
          },
        },
        child2: {
          'file2.ts': 'bar',
          [CONF_RC]: DATA_D,
          [CONF_JSON]: DATA_E,
          [CONF_PKG]: DATA_F,
          [CONF_XML]: DATA_G,
        },
      },
    })
  })

  makeTest('/a/path', readers, makeResult(`/a/path/${CONF_PKG}`, DATA_A))
  makeTest('/a/path/child1', readers, makeResult(`/a/path/child1/${CONF_PKG}`, DATA_B))
  makeTest('/a/path/child1/sub', readers, makeResult(`/a/path/child1/${CONF_PKG}`, DATA_B))
  makeTest('/a/path/child2/dummy', readers, makeResult(`/a/path/child2/${CONF_PKG}`, DATA_F)) // the first in the list
  makeTest('/a/path/a', readers, makeResult(`/a/path/a/${CONF_XML}`, DATA_H))
  makeTest('/a/path/a/b', readers, makeResult(`/a/path/a/b/${CONF_XML}`, DATA_I))
  makeTest('/a/path/a/b/c', readers, makeResult(`/a/path/a/b/c/${CONF_XML}`, DATA_J))
  makeTest('/a/path/a/b/c/d', readers, makeResult(`/a/path/a/b/c/${CONF_XML}`, DATA_J))
  makeTest('/a', readers, null)
  makeTest('/out', readers, null)
})

describe('with readers based on content', () => {
  const readers: IDataReader = {
    basename: CONF_JSON,
    read(f) {
      const data = fs.__files[f]
      if (data.val) return data.val // tslint:disable-line
    },
  }
  beforeAll(() => {
    fs.__setupTree({
      '/project/path': {
        [CONF_JSON]: fs.__d({ dummy: 'foo' }),
        child1: {
          [CONF_JSON]: fs.__d({ val: 'bar' }),
          sub: {
            [CONF_JSON]: fs.__d({ val: 'yay!' }),
          },
        },
        child2: {
          'file2.ts': 'bar',
          [CONF_JSON]: fs.__d({ val: 'hit!' }),
        },
      },
    })
  })

  makeTest('/', readers, null)
  makeTest('/project', readers, null)
  makeTest('/project/path', readers, null)
  makeTest('/project/path/child1', readers, makeResult(`/project/path/child1/${CONF_JSON}`, 'bar'))
  makeTest('/project/path/child1/file.js', readers, makeResult(`/project/path/child1/${CONF_JSON}`, 'bar'))
  makeTest('/project/path/child1/sub', readers, makeResult(`/project/path/child1/sub/${CONF_JSON}`, 'yay!'))
  makeTest('/project/path/child2', readers, makeResult(`/project/path/child2/${CONF_JSON}`, 'hit!'))
  makeTest('/project/path/child2/sub', readers, makeResult(`/project/path/child2/${CONF_JSON}`, 'hit!'))
})

describe('caches data', () => {
  const readers: IDataReader[] = [
    { basename: CONF_PKG, read: jest.fn(f => fs.__files[f]) },
    { basename: CONF_JSON, read: jest.fn(f => fs.__files[f]) },
    { basename: CONF_XML, read: jest.fn(f => fs.__files[f]) },
  ]
  const readersIndex = {
    [CONF_PKG]: readers[0].read,
    [CONF_JSON]: readers[1].read,
    [CONF_XML]: readers[0].read,
  }
  beforeAll(() => {
    fs.__setupTree({
      '/a/path': {
        [CONF_PKG]: DATA_A,
        a: {
          [CONF_XML]: DATA_H,
          b: {
            [CONF_XML]: DATA_I,
            c: {
              [CONF_XML]: DATA_J,
            },
          },
        },
      },
    })
  })

  test('calling twice', () => {
    const result = makeResult(`/a/path/${CONF_PKG}`, DATA_A)

    callAndExpect('/a/path/file1.me', readers, result)
    expect(readersIndex[CONF_PKG]).toHaveBeenCalledTimes(1)
    expect(path.dirname).toHaveBeenCalledTimes(1)
    expect(path.join).toHaveBeenCalled()
    jest.clearAllMocks()

    callAndExpect('/a/path/file1.me', readers, result)
    expect(readersIndex[CONF_PKG]).not.toHaveBeenCalled()
    expect(path.dirname).not.toHaveBeenCalled()
    expect(path.join).not.toHaveBeenCalled()
  })

  test('parents', () => {
    const result = makeResult(`/a/path/${CONF_PKG}`, DATA_A)

    callAndExpect('/a/path/deep/level/file.ts', readers, result)
    expect(readersIndex[CONF_PKG]).toHaveBeenCalledTimes(1)
    expect(fs.existsSync).toHaveBeenCalled()
    expect(path.dirname).toHaveBeenCalled()
    expect(path.join).toHaveBeenCalled()
    jest.clearAllMocks()

    callAndExpect('/a/path/deep/level', readers, result)
    expect(readersIndex[CONF_PKG]).not.toHaveBeenCalled()
    expect(fs.existsSync).not.toHaveBeenCalled()
    expect(path.dirname).not.toHaveBeenCalled()
    expect(path.join).not.toHaveBeenCalled()

    callAndExpect('/a/path/deep', readers, result)
    expect(readersIndex[CONF_PKG]).not.toHaveBeenCalled()
    expect(fs.existsSync).not.toHaveBeenCalled()
    expect(path.dirname).not.toHaveBeenCalled()
    expect(path.join).not.toHaveBeenCalled()

    callAndExpect('/a/path', readers, result)
    expect(readersIndex[CONF_PKG]).not.toHaveBeenCalled()
    expect(fs.existsSync).not.toHaveBeenCalled()
    expect(path.dirname).not.toHaveBeenCalled()
    expect(path.join).not.toHaveBeenCalled()
  })
})
