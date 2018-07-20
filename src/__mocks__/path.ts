// we do this so that it uses `/` even on windows
export const dirname = jest.fn((p: string) =>
  p
    .split('/')
    .slice(0, -1)
    .join('/'),
)
export const join = jest.fn((...s: string[]) => s.join('/'))
