import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import CategoryRail from './components/CategoryRail.jsx'
import DetailPanel from './components/DetailPanel.jsx'
import ExhibitorList from './components/ExhibitorList.jsx'
import FilterBar from './components/FilterBar.jsx'
import Header from './components/Header.jsx'
import { Icon } from './components/Icons.jsx'
import { applyFilters, DEFAULT_FILTERS } from './data/filter.js'
import { fetchJsonWithRetry, initialSelection } from './data/selection.js'

function countBy(companies, key, values) {
  return Object.fromEntries(values.map((value) => [value, companies.reduce((sum, company) => sum + Number(company[key] === value), 0)]))
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])
  return matches
}

export default function App() {
  const [catalog, setCatalog] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [draftQuery, setDraftQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const detailTriggerRef = useRef(null)
  const isMobile = useMediaQuery('(max-width: 780px)')
  const deferredQuery = useDeferredValue(filters.query)

  useEffect(() => {
    let active = true
    fetchJsonWithRetry('./data/exhibitors.json')
      .then((data) => {
        if (!active) return
        if (!Array.isArray(data.exhibitors) || !Array.isArray(data.categories)) throw new Error('资料格式无效')
        setCatalog(data)
        setSelectedId(initialSelection(data.exhibitors, window.matchMedia('(max-width: 780px)').matches))
      })
      .catch((error) => active && setLoadError(`资料载入失败：${error.message}`))
    return () => { active = false }
  }, [])

  const companies = catalog?.exhibitors || []
  const categoryCounts = useMemo(() => countBy(companies, 'primaryCategory', catalog?.categories || []), [companies, catalog?.categories])
  const filtered = useMemo(() => applyFilters(companies, { ...filters, query: deferredQuery }), [companies, filters, deferredQuery])
  const selected = useMemo(() => companies.find((company) => company.id === selectedId) || null, [companies, selectedId])

  useEffect(() => {
    if (isMobile) return
    if (!filtered.length && selectedId) setSelectedId(null)
    else if (selectedId && filtered.length && !filtered.some((company) => company.id === selectedId)) setSelectedId(filtered[0].id)
  }, [filtered, isMobile, selectedId])

  const changeFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))
  const resetFilters = () => {
    setDraftQuery('')
    setFilters(DEFAULT_FILTERS)
  }
  const submitSearch = (event) => {
    event.preventDefault()
    changeFilter('query', draftQuery)
    setMobileSearchOpen(false)
  }
  const selectCompany = (id, trigger) => {
    if (isMobile) detailTriggerRef.current = trigger
    setSelectedId(id)
  }
  const closeDetail = () => {
    const trigger = isMobile ? detailTriggerRef.current : null
    setSelectedId(null)
    if (trigger) window.requestAnimationFrame(() => trigger.focus())
  }

  if (loadError) return <main className="load-state"><Icon name="info" size={34} weight="duotone" /><h1>资料库暂时载入失败</h1><p>{loadError}</p><p>请检查网络，或按照仓库说明启动本地服务后再次载入。</p><button type="button" onClick={() => window.location.reload()}>重新加载资料库</button></main>
  if (!catalog) return <main className="load-state"><Icon className="loading-icon" name="search" size={34} /><p>正在载入供应商资料…</p></main>

  return (
    <div className="app-shell">
      <div className="app-background" inert={isMobile && Boolean(selected)}>
        <Header query={draftQuery} onQueryChange={setDraftQuery} onSubmit={submitSearch} mobileSearchOpen={mobileSearchOpen} onToggleMobileSearch={() => setMobileSearchOpen((value) => !value)} />
        <CategoryRail selected={filters.category} counts={categoryCounts} onSelect={(value) => changeFilter('category', value)} onReset={() => changeFilter('category', 'all')} />
        <main className="results-panel">
          <FilterBar filters={filters} onChange={changeFilter} onReset={resetFilters} resultCount={filtered.length} />
          <div className="mobile-results-head"><strong>共 {filtered.length} 家供应商</strong></div>
          {filtered.length ? <ExhibitorList companies={filtered} selectedId={selectedId} onSelect={selectCompany} /> : null}
          {!filtered.length ? <section className="research-empty"><Icon name="search" size={28} /><strong>当前快照中没有匹配结果</strong><p>请尝试公司简称、产品或技术关键词，或清除分类和视频条件。此站点不提供联网新增企业。</p><button type="button" onClick={resetFilters}>清除全部筛选</button></section> : null}
        </main>
      </div>
      {selected ? <button className="mobile-scrim" aria-label="关闭展商详情" onClick={closeDetail} tabIndex={isMobile ? -1 : undefined} /> : null}
      <DetailPanel company={selected} isMobile={isMobile} onClose={closeDetail} />
    </div>
  )
}
