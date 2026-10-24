import { Icon } from './Icons.jsx'

export default function Header({ query, onQueryChange, onSubmit, mobileSearchOpen, onToggleMobileSearch }) {
  return (
    <header className="site-header">
      <div className="brand-block">
        <h1><Icon name="shield" size={24} weight="duotone" />供应商库</h1>
      </div>
      <form className={`search-form ${mobileSearchOpen ? 'is-open' : ''}`} onSubmit={onSubmit} role="search">
        <label className="sr-only" htmlFor="global-search">搜索供应商资料</label>
        <Icon className="search-leading-icon" name="search" size={19} />
        <input id="global-search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="搜索供应商、产品、技术、标签" />
        <button type="submit"><Icon name="search" size={18} />搜索</button>
      </form>
      <button className="mobile-search-button" type="button" onClick={onToggleMobileSearch} aria-expanded={mobileSearchOpen} aria-controls="global-search">
        <Icon name="search" size={25} /><span>搜索</span>
      </button>
      <div className="header-actions">
        <span title="资料为静态快照，不会自动更新">静态资料库</span>
        <a className="ai-research-button" href="https://github.com/SophiMotion/supplychain#readme" target="_blank" rel="noopener noreferrer">使用说明</a>
      </div>
    </header>
  )
}
