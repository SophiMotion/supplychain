import assert from 'node:assert/strict'
import test from 'node:test'

import { canRunOwnerResearch, fetchJsonWithRetry, initialSelection, mergeOverlayRecords, resolveResearchTarget } from '../src/data/selection.js'

const exhibitors = [{ id: '001' }, { id: '002' }]

test('opens the first detail on desktop but leaves the mobile list unobstructed', () => {
  assert.equal(initialSelection(exhibitors, false), '001')
  assert.equal(initialSelection(exhibitors, true), null)
  assert.equal(initialSelection([], false), null)
})

test('overlay evidence extends catalog review notes without erasing or duplicating them', () => {
  const original = { type: 'review', field: 'identity', reason: 'legacy_note', detail: '原始注释' }
  const warning = { type: 'review', field: 'research', reason: 'field_evidence_rejected', detail: '官网待核验' }
  const catalog = {
    exhibitors: [{ id: '001', name: '示例企业', reviewNotes: [original], summary: '原简介' }],
    counts: { companies: 1 },
  }
  const merged = mergeOverlayRecords(catalog, [{ id: '001', reviewNotes: [original, warning], summary: '新简介' }])

  assert.equal(merged.exhibitors[0].summary, '新简介')
  assert.deepEqual(merged.exhibitors[0].reviewNotes, [original, warning])
  assert.equal(merged.counts.companies, 1)
})

test('missing-company research never reuses the previously selected catalog id', () => {
  assert.deepEqual(resolveResearchTarget({
    appliedQuery: '新供应商有限公司',
    queryMatches: [],
    selected: { id: 'existing-001', name: '现有供应商有限公司' },
    draftQuery: '新供应商有限公司',
  }), {
    companyName: '新供应商有限公司',
    catalogId: null,
  })
})

test('existing-company research keeps the selected company identity', () => {
  assert.deepEqual(resolveResearchTarget({
    appliedQuery: '',
    queryMatches: [],
    selected: { id: 'existing-001', name: '现有供应商有限公司' },
    draftQuery: '',
  }), {
    companyName: '现有供应商有限公司',
    catalogId: 'existing-001',
  })
})

test('an existing query keeps its catalog identity even when another filter hides the row', () => {
  assert.deepEqual(resolveResearchTarget({
    appliedQuery: '蓝海传感',
    queryMatches: [{ id: 'sensor-001', name: '蓝海传感科技有限公司' }],
    selected: null,
    draftQuery: '蓝海传感',
  }), {
    companyName: '蓝海传感科技有限公司',
    catalogId: 'sensor-001',
  })
})

test('owner research is enabled only with owner access, a configured service and a target', () => {
  const target = { companyName: '现有供应商有限公司', catalogId: 'existing-001' }

  assert.equal(canRunOwnerResearch({ isOwner: true, deepseekConfigured: true }, target, false), true)
  assert.equal(canRunOwnerResearch({ isOwner: true, deepseekConfigured: false }, target, false), false)
  assert.equal(canRunOwnerResearch({ isOwner: false, deepseekConfigured: true }, target, false), false)
  assert.equal(canRunOwnerResearch({ isOwner: true, deepseekConfigured: true }, null, false), false)
  assert.equal(canRunOwnerResearch({ isOwner: true, deepseekConfigured: true }, target, true), false)
})

test('catalog loading retries a transient network failure before showing an error', async () => {
  let attempts = 0
  const fetchImpl = async () => {
    attempts += 1
    if (attempts === 1) throw new TypeError('Failed to fetch')
    return { ok: true, json: async () => ({ exhibitors: [{ id: '001' }] }) }
  }

  const catalog = await fetchJsonWithRetry('./data/exhibitors.json', {
    attempts: 3,
    fetchImpl,
    wait: async () => {},
  })

  assert.equal(attempts, 2)
  assert.deepEqual(catalog, { exhibitors: [{ id: '001' }] })
})
