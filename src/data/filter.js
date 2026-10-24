export const DEFAULT_FILTERS = Object.freeze({
  query: '',
  category: 'all',
  hasVideo: false,
})

function searchableText(exhibitor) {
  return exhibitor.searchText || [
    exhibitor.name,
    ...(exhibitor.products || []),
    ...(exhibitor.technologies || []),
    ...(exhibitor.applications || []),
    ...(exhibitor.tags || []),
    exhibitor.officialWebsite?.url,
    ...(exhibitor.news || []).flatMap((item) => [item.title, item.source]),
    ...(exhibitor.patents || []).flatMap((item) => [item.title, item.number, item.source]),
  ].filter(Boolean).join('\n').toLocaleLowerCase('zh-CN')
}

export function applyFilters(exhibitors, filters) {
  const terms = String(filters.query || '').trim().toLocaleLowerCase('zh-CN').split(/\s+/).filter(Boolean)
  return exhibitors.filter((exhibitor) => {
    if (filters.category !== 'all' && exhibitor.primaryCategory !== filters.category) return false
    if (filters.hasVideo && !exhibitor.hasVideo) return false
    if (terms.length && !terms.every((term) => searchableText(exhibitor).includes(term))) return false
    return true
  })
}
