import { CATEGORY_ORDER } from '../data/normalize.js'
import { Icon } from './Icons.jsx'

export default function FilterBar({ filters, onChange, onReset, resultCount }) {
  const update = (key) => (event) => onChange(key, event.target.type === 'checkbox' ? event.target.checked : event.target.value)
  return (
    <section className="filter-bar" aria-label="筛选条件">
      <div className="mobile-filter-label"><Icon name="filter" size={20} />筛选</div>
      <label>主分类
        <select value={filters.category} onChange={update('category')}>
          <option value="all">全部（16）</option>
          {CATEGORY_ORDER.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </label>
      <label className="video-filter"><input type="checkbox" checked={filters.hasVideo} onChange={update('hasVideo')} />仅有视频</label>
      <button className="reset-button" type="button" onClick={onReset}>重置</button>
      <div className="result-count">共 <strong>{resultCount}</strong> 家供应商</div>
    </section>
  )
}
