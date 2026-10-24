import { CATEGORY_ORDER } from '../data/normalize.js'
import { Icon } from './Icons.jsx'

const CATEGORY_ICONS = {
  电机: 'motor', 传感器: 'sensor', 摄像头: 'camera', 视觉: 'vision', 整体方案: 'solution',
  'C 端项目': 'robot', 'B 端项目': 'factory', 驱动与控制: 'control', 减速器与传动: 'transmission',
  编码器: 'sensor', 芯片与算力: 'chip', 末端执行器: 'robot', 机器人本体: 'robot',
  软件与仿真: 'software', 教育科研: 'education', 其他: 'other',
}

export default function CategoryRail({ selected, counts, onSelect, onReset }) {
  return (
    <aside className="category-rail" aria-label="主分类筛选">
      <div className="rail-title">主营分类 <span>{CATEGORY_ORDER.length}</span></div>
      <div className="category-list">
        <button className={selected === 'all' ? 'active' : ''} onClick={() => onSelect('all')}>
          <Icon name="solution" size={18} /><span>全部供应商</span><small>{Object.values(counts).reduce((sum, value) => sum + value, 0)}</small>
        </button>
        {CATEGORY_ORDER.map((category) => (
          <button className={selected === category ? 'active' : ''} key={category} onClick={() => onSelect(category)}>
            <Icon name={CATEGORY_ICONS[category]} size={18} />
            <span>{category}</span><small>{counts[category] || 0}</small>
          </button>
        ))}
      </div>
      <button className="reset-rail" type="button" onClick={onReset}><Icon name="reset" size={16} />重置分类筛选</button>
    </aside>
  )
}
