import { Icon } from './Icons.jsx'

export default function Pagination({ page, pageCount, total, onPageChange }) {
  const visible = [...new Set([1, page - 1, page, page + 1, pageCount].filter((value) => value >= 1 && value <= pageCount))]
  return (
    <nav className="pagination" aria-label="结果分页">
      <span>共 {total} 条结果</span>
      <div>
        <button disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label="上一页"><Icon name="chevron" size={16} className="previous-icon" /></button>
        {visible.map((number, index) => (
          <span className="page-cluster" key={number}>{index > 0 && number - visible[index - 1] > 1 ? <i>…</i> : null}<button className={page === number ? 'active' : ''} onClick={() => onPageChange(number)}>{number}</button></span>
        ))}
        <button disabled={page === pageCount} onClick={() => onPageChange(page + 1)} aria-label="下一页"><Icon name="chevron" size={16} /></button>
      </div>
      <span>每页 20 条</span>
    </nav>
  )
}
