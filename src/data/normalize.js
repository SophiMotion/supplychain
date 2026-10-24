export const CATEGORY_ORDER = Object.freeze([
  '电机', '传感器', '摄像头', '视觉', '整体方案', 'C 端项目', 'B 端项目', '驱动与控制',
  '减速器与传动', '编码器', '芯片与算力', '末端执行器', '机器人本体', '软件与仿真', '教育科研', '其他',
])

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function utcCalendarTimestamp(value) {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime())
      ? Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
      : Number.NaN
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(String(value || ''))
  if (!match) return Number.NaN
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const timestamp = Date.UTC(year, month - 1, day)
  const parsed = new Date(timestamp)
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
    ? timestamp
    : Number.NaN
}

function isRecentNewsDate(value, now) {
  const timestamp = utcCalendarTimestamp(value)
  const today = utcCalendarTimestamp(now)
  if (!Number.isFinite(timestamp) || !Number.isFinite(today)) return false
  const cutoff = new Date(today)
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 3)
  return timestamp >= utcCalendarTimestamp(cutoff) && timestamp <= today
}

function pathParts(value) {
  return String(value).replaceAll('\\', '/').split('/').filter(Boolean)
}

export function normalizeHallLabel(value) {
  const hall = String(value || '').trim()
  if (/^世博展览馆H\d+$/i.test(hall)) return hall.match(/H\d+/i)[0].toUpperCase()
  if (hall.includes('张江科学会堂-')) return hall.split('-').at(-1)
  if (hall === '世博展览馆中厅') return '世博中厅'
  if (hall === '西岸国际会展中心') return '西岸会展'
  return hall
}

export function toAssetUrl(directoryName, localPath, assetRoot = '展商资料') {
  if (!localPath || /^https?:\/\//i.test(localPath)) return null
  const root = assetRoot === '展商资料' ? ['展商资料'] : pathParts(assetRoot).map((part) => encodeURIComponent(part))
  const encoded = [directoryName, ...pathParts(localPath)].map((part) => encodeURIComponent(part))
  return `/${[...root, ...encoded].join('/')}`
}

function normalizeMedia(item, directoryName, assetRoot) {
  if (!item || item.status !== 'downloaded') return null
  const url = toAssetUrl(directoryName, item.local_path, assetRoot)
  if (!url) return null
  return {
    caption: item.caption || '展商图片',
    kind: item.kind || 'product',
    url,
    width: item.width ?? null,
    height: item.height ?? null,
    sourceUrl: item.source_url || item.source_page_url || null,
  }
}

function priceState(price) {
  if (price?.amount != null) return 'current'
  if (price?.historical_prices?.length) return 'historical'
  return 'inquiry'
}

function conferenceFields(raw) {
  const evidence = raw.conference_evidence || {}
  const isLegacy = raw.schema_version === '1.0'
  const booths = unique(isLegacy ? [evidence.booth] : (evidence.booths || []))
  const halls = unique((isLegacy ? booths.map((booth) => booth.match(/^[A-D]/i)?.[0]?.toUpperCase()) : (evidence.halls || [])).map(normalizeHallLabel))
  const detailUrls = unique(isLegacy ? [evidence.exhibitor_url] : (evidence.detail_urls || []))
  const brochureUrls = unique(isLegacy ? [evidence.brochure_url] : (evidence.brochure_urls || []))
  return { evidence, booths, halls, detailUrls, brochureUrls }
}

function reviewNotes(raw) {
  return [
    ...(raw.missing_items || []).map((item) => ({
      type: 'missing', field: item.field_path || '', reason: item.reason_code || 'missing', detail: item.detail || '',
    })),
    ...(raw.manual_review || []).map((item) => ({
      type: 'review', field: item.field_path || '', reason: item.reason_code || 'needs_review', detail: item.detail || '',
    })),
  ]
}

function normalizeSources(raw, detailUrls, brochureUrls) {
  const explicit = (raw.sources || []).map((source) => ({
    url: source.url,
    type: source.source_type || 'source',
    identityStatus: source.identity_status || null,
  }))
  const known = [
    ...detailUrls.map((url) => ({ url, type: 'conference', identityStatus: 'verified' })),
    ...brochureUrls.map((url) => ({ url, type: 'conference_brochure', identityStatus: 'verified' })),
    ...explicit,
  ]
  const seen = new Set()
  return known.filter((source) => {
    if (!source.url || seen.has(source.url)) return false
    seen.add(source.url)
    return true
  })
}

function normalizeEvidenceItems(items, limit, identity, predicate = () => true) {
  const seen = new Set()
  return (items || []).filter((item) => {
    const key = identity(item)
    if (!item?.title || !key || seen.has(key) || !predicate(item)) return false
    seen.add(key)
    return true
  }).map((item) => ({
    title: item.title,
    url: item.url || null,
    date: item.date || null,
    source: item.source || '公开来源',
    status: item.status || 'verified',
    verifiedAt: item.verified_at || item.verifiedAt || null,
    summary: item.summary || null,
    summaryStatus: item.summary_status || item.summaryStatus || null,
    ...(item.number ? { number: item.number } : {}),
    ...(item.applicant ? { applicant: item.applicant } : {}),
  })).slice(0, limit)
}

function normalizeOfficialWebsite(raw, research) {
  const officialPages = raw.official_pages || {}
  const researched = research.official_website || research.officialWebsite || {}
  const url = researched.url || officialPages.home_url || officialPages.website || officialPages.homepage || null
  if (!url) return null
  return {
    url,
    status: researched.status || 'verified',
    verifiedAt: researched.verified_at || researched.verifiedAt || research.verified_at || research.verifiedAt || null,
  }
}

export function normalizeExhibitor(raw, directoryName, options = {}) {
  const rawCompanyName = String(raw.company_name || '').trim()
  const directoryLabel = String(directoryName || '').replace(/^\d+_/, '').trim()
  const companyName = rawCompanyName || (directoryLabel && !/^未命名企业/.test(directoryLabel) ? directoryLabel : '企业名称待核验')
  const aliases = unique((raw.company_aliases || []).map((value) => String(value || '').trim()))
    .filter((value) => value !== companyName)
  const { evidence, booths, halls, detailUrls, brochureUrls } = conferenceFields(raw)
  const profile = raw.profile || {}
  const products = unique(profile.products || evidence.product_refs?.map((item) => item.title) || [])
  const technologies = unique(profile.technologies || [])
  const applications = unique(profile.applications || [])
  const classification = raw.classification || {}
  const tags = unique(classification.tags || [])
  const assetRoot = raw.asset_root || '展商资料'
  const conferenceNames = unique(raw.conference_names || ['2026世界机器人大会'])
  const logo = normalizeMedia(raw.media?.logo, directoryName, assetRoot)
  const images = (raw.media?.images || []).map((item) => normalizeMedia(item, directoryName, assetRoot)).filter(Boolean).slice(0, 5)
  const videos = (raw.media?.video_links || []).filter((item) => item.url).map((item) => ({
    title: item.title || '相关视频',
    url: item.url,
    sourcePageUrl: item.source_page_url || null,
  }))
  const price = raw.price || {}
  const research = raw.research || {}
  const enrichment = raw.owner_enrichment || {}
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now())
  const officialWebsite = normalizeOfficialWebsite(raw, research)
  const news = normalizeEvidenceItems(
    research.news, 3, (item) => item?.url || item?.title, (item) => isRecentNewsDate(item?.date, now),
  )
  const patents = normalizeEvidenceItems(research.patents, 5, (item) => item?.number || item?.url || item?.title)
  const enrichmentStatus = enrichment.mode === 'deepseek_owner_batch' ? {
    approved: 'ai_verified',
    failed_verification: 'evidence_insufficient',
    blocked_identity: 'identity_unresolved',
    retryable_error: 'retryable_error',
  }[enrichment.status] : null
  const researchStatus = research.status || enrichmentStatus || (officialWebsite || news.length || patents.length ? 'verified' : 'not_started')
  const notes = reviewNotes(raw)
  const searchText = [
    companyName, ...aliases, ...booths, ...halls, classification.primary_category, ...tags,
    ...conferenceNames, profile.summary, ...products, ...technologies, ...applications,
    ...(evidence.product_refs || []).flatMap((item) => [item.title, item.summary]),
    officialWebsite?.url,
    ...news.flatMap((item) => [item.title, item.source]),
    ...patents.flatMap((item) => [item.title, item.number, item.source]),
  ].filter(Boolean).join('\n').toLocaleLowerCase('zh-CN')

  return {
    id: raw.company_id,
    name: companyName,
    aliases,
    directoryName,
    assetRoot,
    conferenceNames,
    schemaVersion: raw.schema_version,
    collectedAt: raw.collected_at,
    collectionStatus: raw.collection_status || 'unknown',
    halls,
    booths,
    detailUrls,
    brochureUrls,
    summary: profile.summary || evidence.introductions?.join('\n\n') || '暂无公开简介',
    products,
    technologies,
    applications,
    primaryCategory: classification.primary_category || '其他',
    tags,
    classificationConfidence: classification.confidence || (raw.schema_version === '1.0' ? 'legacy' : null),
    price: {
      status: price.status || '价格未公开／需询价',
      amount: price.amount ?? null,
      currency: price.currency ?? null,
      sourceUrl: price.source_url || null,
      historicalPrices: price.historical_prices || [],
    },
    priceState: priceState(price),
    logo,
    images,
    videos,
    hasVideo: videos.length > 0,
    sources: normalizeSources(raw, detailUrls, brochureUrls),
    officialPages: raw.official_pages || {},
    officialWebsite,
    news,
    patents,
    researchStatus,
    researchVerifiedAt: research.verified_at || research.verifiedAt || enrichment.attempted_at || null,
    contacts: raw.contacts || [],
    reviewNotes: notes,
    searchText,
  }
}
