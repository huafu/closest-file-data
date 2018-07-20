// tslint:disable:variable-name
import flat from 'flat'

// this is so that `flat()` won't flatten our data
class Data extends Array {
  constructor(props = {}) {
    super()
    Object.assign(this, props)
  }
}

export let __files = Object.create(null)
export const __setupTree = (tree: object): void => {
  __files = flat(tree, { delimiter: '/', safe: true })
}
export const __d = (props: {[key: string]: any}) => new Data(props)

export const existsSync = jest.fn((file: string) => file in __files)
