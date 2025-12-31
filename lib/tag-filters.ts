export type TagFilterSelection = {
  include: string[]
  exclude: string[]
}

export const createEmptyTagFilterSelection = (): TagFilterSelection => ({
  include: [],
  exclude: [],
})

export const hasActiveTagFilters = (selection: TagFilterSelection) =>
  selection.include.length > 0 || selection.exclude.length > 0
