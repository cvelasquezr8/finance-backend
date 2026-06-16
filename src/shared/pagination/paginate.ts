export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface PaginateOptions {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  order?: 'asc' | 'desc'
  /** Keys searched (case-insensitive substring) when `search` is provided. */
  searchableKeys?: string[]
}

/**
 * In-memory pagination/search/sort over an already-fetched array. Suitable for
 * small collections (admin users, notifications). Mirrors the frontend's
 * PaginatedResponseDTO shape: { data, total, page, pageSize, hasMore }.
 */
export function paginate<T extends Record<string, unknown>>(
  rows: T[],
  opts: PaginateOptions
): PaginatedResult<T> {
  const search = opts.search?.toLowerCase().trim()
  let filtered = rows
  if (search && opts.searchableKeys?.length) {
    filtered = rows.filter((r) =>
      opts.searchableKeys!.some((k) => {
        const v = r[k]
        const s = typeof v === 'string' ? v : typeof v === 'number' ? String(v) : ''
        return s.toLowerCase().includes(search)
      })
    )
  }

  if (opts.sortBy) {
    const key = opts.sortBy
    const dir = opts.order === 'asc' ? 1 : -1
    filtered = [...filtered].sort((a, b) => {
      const av = a[key] as string | number
      const bv = b[key] as string | number
      if (av === bv) return 0
      return (av > bv ? 1 : -1) * dir
    })
  }

  const page = Math.max(1, opts.page ?? 1)
  const pageSize = Math.max(1, opts.limit ?? 20)
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)
  return {
    data,
    total: filtered.length,
    page,
    pageSize,
    hasMore: start + data.length < filtered.length,
  }
}
