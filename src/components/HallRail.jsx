import { Icon } from './Icons.jsx'

export default function HallRail({ halls, selected, counts, onSelect }) {
  return (
    <aside className="hall-rail" aria-label="展馆坐标筛选">
      <div className="rail-title"><Icon name="pin" size={18} />展馆坐标</div>
      <button className={selected === 'all' ? 'active' : ''} onClick={() => onSelect('all')}>全部展馆</button>
      {halls.map((hall) => (
        <button className={`hall-button ${selected === hall ? 'active' : ''}`} key={hall} onClick={() => onSelect(hall)}>
          <strong>{hall}</strong><span>{hall.length <= 4 ? `${hall} 馆` : hall}</span><small>{counts[hall] || 0} 家</small>
        </button>
      ))}
    </aside>
  )
}
