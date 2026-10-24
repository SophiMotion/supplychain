export function initialSelection(exhibitors, isMobile) {
  if (isMobile || exhibitors.length === 0) return null
  return exhibitors[0].id
}

function mergedReviewNotes(...groups) {
  const notes = []
  const seen = new Set()
  for (const note of groups.flat()) {
    if (!note || typeof note !== 'object') continue
    const key = [note.type, note.field, note.reason, note.detail].map((value) => String(value || '')).join('|')
    if (seen.has(key)) continue
    seen.add(key)
    notes.push(note)
  }
  return notes
}

export function mergeOverlayRecords(catalog, records = []) {
  if (!records.length) return catalog
  const companies = new Map(catalog.exhibitors.map((company) => [company.id, company]))
  for (const record of records) {
    const current = companies.get(record.id)
    companies.set(record.id, current ? {
      ...current,
      ...record,
      reviewNotes: mergedReviewNotes(current.reviewNotes || [], record.reviewNotes || []),
    } : record)
  }
  const exhibitors = [...companies.values()].sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'zh-CN'))
  return { ...catalog, exhibitors, counts: { ...catalog.counts, companies: exhibitors.length } }
}

export async function fetchJsonWithRetry(url, options = {}) {
  const attempts = Math.max(1, Number(options.attempts || 4))
  const fetchImpl = options.fetchImpl || globalThis.fetch
  const wait = options.wait || ((delay) => new Promise((resolve) => setTimeout(resolve, delay)))
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url)
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`)
        error.retryable = response.status === 408 || response.status === 429 || response.status >= 500
        throw error
      }
      return await response.json()
    } catch (error) {
      lastError = error
      if (attempt === attempts || error?.retryable === false) throw error
      await wait(Math.min(2400, 400 * (2 ** (attempt - 1))))
    }
  }

  throw lastError
}

export function resolveResearchTarget({ appliedQuery, queryMatches = [], selected, draftQuery }) {
  const appliedName = String(appliedQuery || '').trim()
  if (appliedName) {
    const matchedCompany = queryMatches[0]
    if (!matchedCompany) return { companyName: appliedName, catalogId: null }
    return { companyName: String(matchedCompany.name || appliedName).trim(), catalogId: matchedCompany.id || null }
  }

  const selectedName = String(selected?.name || '').trim()
  if (selectedName) return { companyName: selectedName, catalogId: selected?.id || null }

  const fallbackName = String(draftQuery || '').trim()
  return fallbackName ? { companyName: fallbackName, catalogId: null } : null
}

export function canRunOwnerResearch(ownerState, target, researchBusy) {
  return Boolean(ownerState?.isOwner && ownerState?.deepseekConfigured && target?.companyName && !researchBusy)
}
