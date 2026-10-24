import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import test from 'node:test'
import { CATEGORY_ORDER } from '../src/data/normalize.js'
import { applyFilters, DEFAULT_FILTERS } from '../src/data/filter.js'

const raw = readFileSync(new URL('../public/data/exhibitors.json', import.meta.url), 'utf8')
const catalog = JSON.parse(raw)

test('published snapshot has consistent IDs, categories and counts', () => {
  assert.equal(catalog.exhibitors.length, 1236)
  assert.equal(catalog.counts.companies, catalog.exhibitors.length)
  assert.equal(catalog.counts.sourceRecords, 1332)
  assert.equal(new Set(catalog.exhibitors.map(x => x.id)).size, catalog.exhibitors.length)
  assert.deepEqual(catalog.categories, CATEGORY_ORDER)
  assert.equal(catalog.exhibitors.filter(x => !x.officialWebsite?.url).length, 143)
  for (const company of catalog.exhibitors) {
    assert.ok(company.name && CATEGORY_ORDER.includes(company.primaryCategory))
    for (const key of ['products', 'tags', 'images', 'videos', 'sources', 'reviewNotes', 'conferenceNames']) assert.ok(Array.isArray(company[key]), key)
    assert.ok(Number.isFinite(Date.parse(company.researchVerifiedAt || company.collectedAt)))
  }
})

test('all 2610 media references stay in the public assets directory and exist', () => {
  const paths = new Set()
  for (const company of catalog.exhibitors) {
    for (const media of [company.logo, ...company.images].filter(Boolean)) {
      assert.match(media.url, /^assets\/light-image-\d+\.(webp|png|jpe?g|gif)$/)
      paths.add(media.url)
      const info = statSync(new URL(`../public/${media.url}`, import.meta.url))
      assert.ok(info.size > 0 && info.size < 100 * 1024 * 1024)
    }
  }
  assert.equal(paths.size, 2610)
})

test('public catalog excludes contact fields, credentials and dangerous displayed links', () => {
  assert.doesNotMatch(raw, /"contacts"\s*:/)
  assert.doesNotMatch(raw, /sk-[a-zA-Z0-9]{20,}|gh[pousr]_[a-zA-Z0-9]{20,}|-----BEGIN.*PRIVATE KEY-----/)
  for (const company of catalog.exhibitors) {
    const links = [company.officialWebsite, ...company.sources, ...(company.news || []), ...(company.patents || []), ...company.videos]
    for (const item of links.filter(x => x?.url)) assert.ok(['https:', 'http:'].includes(new URL(item.url).protocol))
  }
})

test('real catalog supports text AND search and category intersection', () => {
  const both = applyFilters(catalog.exhibitors, { ...DEFAULT_FILTERS, query: '无框 电机', category: '电机' })
  assert.ok(both.length > 0)
  assert.ok(both.every(x => x.primaryCategory === '电机' && x.searchText.includes('无框') && x.searchText.includes('电机')))
  assert.equal(applyFilters(catalog.exhibitors, { ...DEFAULT_FILTERS, query: '___nonexistent_supplier_zzz___' }).length, 0)
})
