import { paginate } from '../../src/shared/pagination/paginate'

interface Row extends Record<string, unknown> {
  id: number
  name: string
}

const rows: Row[] = [
  { id: 1, name: 'Ana' },
  { id: 2, name: 'Beto' },
  { id: 3, name: 'Carlos' },
  { id: 4, name: 'ana maria' },
]

describe('paginate', () => {
  it('returns the first page with hasMore when more rows remain', () => {
    const res = paginate(rows, { page: 1, limit: 2 })
    expect(res.data).toHaveLength(2)
    expect(res.total).toBe(4)
    expect(res.page).toBe(1)
    expect(res.pageSize).toBe(2)
    expect(res.hasMore).toBe(true)
  })

  it('marks hasMore false on the last page', () => {
    const res = paginate(rows, { page: 2, limit: 2 })
    expect(res.data).toHaveLength(2)
    expect(res.hasMore).toBe(false)
  })

  it('filters case-insensitively over searchableKeys', () => {
    const res = paginate(rows, { search: 'ana', searchableKeys: ['name'] })
    expect(res.total).toBe(2)
    expect(res.data.map((r) => r.id).sort()).toEqual([1, 4])
  })

  it('sorts by key ascending and descending', () => {
    const asc = paginate(rows, { sortBy: 'id', order: 'asc' })
    expect(asc.data[0].id).toBe(1)
    const desc = paginate(rows, { sortBy: 'id', order: 'desc' })
    expect(desc.data[0].id).toBe(4)
  })

  it('defaults page=1 and a sane pageSize', () => {
    const res = paginate(rows, {})
    expect(res.page).toBe(1)
    expect(res.data).toHaveLength(4)
    expect(res.hasMore).toBe(false)
  })
})
