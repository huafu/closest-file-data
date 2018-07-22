import { existsSync } from 'fs'
import { dirname, join } from 'path'

// a data reader
// examples: fs.readFileSync, require, ...
export interface IDataReader<T = any> {
  // basename of the file to match
  basename: string
  // Function responsible to return either void or the config data for given file
  // We allow to return void so that we can handle cases where the data might
  // be inside a file at some specific location. The reader can then return void
  // if the basename's file exists but read() couldn't find relevant data inside
  read: (file: string) => T | void
}

export interface IClosestDataResult {
  // full path to the found file
  readonly path: string
  // config returned by the reader (or cached)
  readonly data: any
}

let caches: { [key: string]: { [path: string]: IClosestDataResult | void } } = Object.create(null)

function closestFileData(
  relPath: string,
  oneOrMoreReader: IDataReader | IDataReader[],
): IClosestDataResult | void {
  const paths = []
  const readers = Array.isArray(oneOrMoreReader) ? oneOrMoreReader : [oneOrMoreReader]
  if (readers.length < 1) {
    throw new RangeError(`At least one reader must be given.`)
  }
  // cache key is based on the ordered list of basenames
  const cacheKey = readers.map(r => r.basename).join('::')
  if (!(cacheKey in caches)) {
    caches[cacheKey] = Object.create(null)
  }
  const cache = caches[cacheKey]
  let result: IClosestDataResult | void
  let directory = relPath

  do {
    if (directory in cache) {
      result = cache[directory]
      break
    }

    paths.push(directory)
    // look for a config using readers (config file must exists and reader must not return null)
    readers.find(({ basename, read }) => {
      const path = join(directory, basename)
      if (existsSync(path)) {
        const config = read(path)
        if (typeof config !== 'undefined') {
          result = Object.freeze({ path, data: config })
          return true
        }
      }
      return false
    })
    // continue while we don't have a config and there is a parent directory
  } while (!result && directory !== (directory = dirname(directory))) // tslint:disable-line

  // each directory will resolve to the same config
  paths.forEach(d => (cache[d] = result))
  return result
}

export default Object.assign(closestFileData, {
  cache: {
    clear: () => (caches = Object.create(null)),
  },
})
