import ImageWithFallback from './ImageWithFallback.jsx'
import { Icon } from './Icons.jsx'

function Tags({ tags }) {
  return <div className="tag-row">{tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
}

function websiteLabel(value) {
  if (!value) return '官网待核验'
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return value
  }
}

export default function ExhibitorList({ companies, selectedId, onSelect }) {
  return (
    <div className="exhibitor-region">
      <div className="table-head" aria-hidden="true"><span>公司 / 主营产品</span><span>标签</span><span>公司官网</span></div>
      <ul className="exhibitor-list" role="list" aria-label="供应商结果">
        {companies.map((company) => (
          <li className={`exhibitor-item ${selectedId === company.id ? 'selected' : ''}`} key={company.id}>
            <button className="exhibitor-row" type="button" onClick={(event) => onSelect(company.id, event.currentTarget)} aria-label={`查看 ${company.name} 完整资料`} />
            <span className="company-cell row-content-cell">
              <ImageWithFallback className="row-logo" src={company.logo?.url} publicSrc={company.logo?.sourceUrl} alt={`${company.name} Logo`} />
              <span><strong>{company.name}</strong><small>{company.products.slice(0, 3).join('、') || company.summary}</small></span>
            </span>
            <span className="tags-cell row-content-cell"><Tags tags={company.tags} /></span>
            {company.officialWebsite?.url ? (
              <a className="website-link" href={company.officialWebsite.url} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>
                {websiteLabel(company.officialWebsite.url)}<Icon name="external" size={14} />
              </a>
            ) : <span className="website-missing row-content-cell">{websiteLabel(null)}</span>}
            <Icon className="mobile-row-chevron" name="chevron" size={18} />
          </li>
        ))}
      </ul>
    </div>
  )
}
