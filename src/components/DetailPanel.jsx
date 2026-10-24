import { useEffect, useRef } from 'react'

import { trapDialogFocus } from '../data/focus.js'
import ImageWithFallback from './ImageWithFallback.jsx'
import { Icon } from './Icons.jsx'

const DETAIL_TITLE_ID = 'exhibitor-detail-title'

function ChipList({ items, empty = '暂无公开信息' }) {
  if (!items?.length) return <p className="muted-copy">{empty}</p>
  return <div className="detail-chips">{items.map((item) => <span key={item}>{item}</span>)}</div>
}

function ExternalLink({ href, children, className = '' }) {
  return <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}<Icon name="external" size={15} /></a>
}

function isVerifiedStatus(status) {
  return status === 'verified' || status === 'ai_verified'
}

function EvidenceList({ items, type, researchStatus }) {
  if (!items?.length) {
    const copy = researchStatus === 'evidence_insufficient'
      ? '二次筛选已完成，公开证据不足'
      : researchStatus === 'identity_unresolved'
        ? '企业身份待核验，未公开研究结果'
        : researchStatus === 'retryable_error'
          ? '联网筛选暂时失败，可稍后重试'
          : researchStatus === 'ai_verified'
            ? '二次筛选未找到可公开展示的结果'
            : isVerifiedStatus(researchStatus) ? '已核验，未找到可靠公开结果' : '尚未完成联网筛选'
    return <p className="evidence-empty"><Icon name="info" size={17} />{copy}</p>
  }
  return (
    <ol className="evidence-list">
      {items.map((item) => (
        <li key={item.number || item.url || item.title}>
          <div className="evidence-date">{item.date || '日期未公开'}</div>
          <div className="evidence-copy">
            {item.url ? <ExternalLink href={item.url}>{item.title}</ExternalLink> : <strong>{item.title}</strong>}
            <span>{type === 'patent' && item.number ? `${item.number} · ` : ''}{item.source || '公开来源'}</span>
            {type === 'news' && item.summary ? <p className="evidence-summary"><b>摘要：</b>{item.summary}</p> : null}
          </div>
          {item.status === 'ai_verified' ? null : <span className={`evidence-status ${isVerifiedStatus(item.status) ? 'verified' : ''}`}><Icon name={isVerifiedStatus(item.status) ? 'verified' : 'warning'} size={14} />{isVerifiedStatus(item.status) ? '已核验' : '待复核'}</span>}
        </li>
      ))}
    </ol>
  )
}

function formatDate(value) {
  if (!value) return '未记录'
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function DetailPanel({ company, isMobile, onClose }) {
  const panelRef = useRef(null)
  const closeRef = useRef(null)

  useEffect(() => {
    if (company && isMobile) closeRef.current?.focus()
  }, [company?.id, isMobile])

  if (!company) return <aside className="detail-panel detail-empty"><p>选择一家公司查看完整资料</p></aside>
  const companyVerified = isVerifiedStatus(company.researchStatus)
  const showCompanyStatus = company.researchStatus !== 'ai_verified'

  const handleKeyDown = (event) => {
    if (!isMobile) return
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    trapDialogFocus(event, panelRef.current)
  }

  return (
    <aside
      className="detail-panel"
      ref={panelRef}
      role={isMobile ? 'dialog' : undefined}
      aria-modal={isMobile ? 'true' : undefined}
      aria-labelledby={isMobile ? DETAIL_TITLE_ID : undefined}
      aria-label={isMobile ? undefined : '展商详情'}
      aria-live="polite"
      onKeyDown={handleKeyDown}
      tabIndex={isMobile ? -1 : undefined}
    >
      <div className="sheet-handle" />
      <div className="detail-titlebar"><strong id={DETAIL_TITLE_ID}>供应商证据档案</strong><button ref={closeRef} type="button" onClick={onClose} aria-label="关闭展商详情"><Icon name="close" size={20} /></button></div>
      <div className="detail-scroll">
        <section className={`company-identity ${showCompanyStatus ? 'has-detail-source' : ''}`}>
          <ImageWithFallback className="detail-logo" src={company.logo?.url} publicSrc={company.logo?.sourceUrl} alt={`${company.name} Logo`} />
          <div className="identity-copy">
            <h2>{company.name}{companyVerified ? <Icon name="verified" size={19} /> : null}</h2>
            {company.officialWebsite?.url ? <ExternalLink className="identity-website" href={company.officialWebsite.url}>{company.officialWebsite.url}</ExternalLink> : <p className="identity-website muted-copy">官网待核验</p>}
            <p>主分类：{company.primaryCategory}</p>
            <p>大会记录：{company.conferenceNames.join(' / ')}</p>
          </div>
          {showCompanyStatus ? <div className={`detail-source ${companyVerified ? 'verified' : ''}`}>{company.researchStatus === 'evidence_insufficient' ? '证据不足' : company.researchStatus === 'identity_unresolved' ? '身份待核验' : company.researchStatus === 'retryable_error' ? '可重试' : companyVerified ? '已核验' : '待筛选'}</div> : null}
        </section>
        <section className="detail-section"><div className="section-heading"><h3>公司简介</h3>{company.summaryStatus === 'ai_generated' ? <span className="section-source-label">整理</span> : null}</div><p className="summary-copy">{company.summary}</p></section>
        {company.images.length ? <section className="detail-section media-section"><div className="section-heading"><h3>产品与应用图片 <span>({company.images.length})</span></h3></div><div className="media-strip">{company.images.map((image) => <figure key={image.url}><ImageWithFallback src={image.url} publicSrc={image.sourceUrl} alt={image.caption} /><figcaption>{image.caption}</figcaption></figure>)}</div></section> : null}
        <section className="detail-section"><h3>产品线</h3><ChipList items={company.products} /></section>
        <section className="detail-section evidence-section"><div className="section-heading"><h3>最近 3 年新闻 <span>（最多 3 条）</span></h3><span className="section-source-label">来源可追溯</span></div><EvidenceList items={company.news} type="news" researchStatus={company.researchStatus} /></section>
        <section className="detail-section evidence-section"><div className="section-heading"><h3>专利 <span>（最多 5 条）</span></h3><span className="section-source-label">保留原始链接</span></div><EvidenceList items={company.patents} type="patent" researchStatus={company.researchStatus} /></section>
        <section className="detail-section"><h3>分类标签</h3><ChipList items={company.tags} /></section>
        <section className="detail-section detail-lines">
          {company.videos.map((video) => <div key={video.url}><strong>相关视频</strong><ExternalLink href={video.url}><Icon name="play" size={18} />{video.title}</ExternalLink></div>)}
        </section>
        <section className="detail-section"><h3>资料来源</h3><div className="source-links">{company.sources.map((source, index) => <ExternalLink href={source.url} key={`${source.url}-${index}`}>{source.type === 'conference' ? '大会展商页' : source.type === 'conference_brochure' ? '大会展商手册' : source.type === 'official_site' ? '公司官网' : '外部公开来源'}</ExternalLink>)}</div></section>
        <section className="detail-section data-notes"><h3>缺失与复核说明</h3>{company.reviewNotes.length ? <ul>{company.reviewNotes.map((note, index) => <li key={`${note.field}-${note.reason}-${index}`}><strong>{note.reason}</strong><span>{note.detail || note.field}</span></li>)}</ul> : <p><span className="status-dot" />未记录额外复核项</p>}</section>
        <footer className="detail-footer"><span>最后核验</span><strong>{formatDate(company.researchVerifiedAt || company.collectedAt)}</strong><Icon name="info" size={17} /></footer>
      </div>
    </aside>
  )
}
