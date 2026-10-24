import assert from 'node:assert/strict'
import test from 'node:test'

import { applyFilters, DEFAULT_FILTERS } from '../src/data/filter.js'

const exhibitors = [
  {
    id: '001', name: '星海电机', halls: ['A'], primaryCategory: '电机', tags: ['无框电机'],
    products: ['关节电机'], technologies: ['闭环控制'], applications: ['人形机器人'], booths: ['A101'],
    officialWebsite: { url: 'https://xinghai.example.com', status: 'verified' },
    news: [{ title: '发布新一代关节电机', source: '企业官网' }],
    patents: [{ title: '一种无框电机结构', number: 'CN10001' }],
    priceState: 'current', hasVideo: true,
  },
  {
    id: '002', name: '蓝图视觉', halls: ['B'], primaryCategory: '视觉', tags: ['机器视觉'],
    products: ['工业相机'], technologies: ['三维重建'], applications: ['质量检测'], booths: ['B205'],
    priceState: 'historical', hasVideo: false,
  },
  {
    id: '003', name: '远行机器人', halls: ['A', 'C'], primaryCategory: '机器人本体', tags: ['巡检'],
    products: ['四足机器人'], technologies: ['自主导航'], applications: ['电力巡检'], booths: ['A301', 'C208'],
    priceState: 'inquiry', hasVideo: true,
  },
]

test('searches supplier, product and evidence text without relying on exhibition coordinates', () => {
  for (const query of ['星海', '关节电机', '闭环控制', '人形机器人', '无框电机', 'xinghai.example.com', '发布新一代', 'CN10001']) {
    assert.deepEqual(applyFilters(exhibitors, { ...DEFAULT_FILTERS, query }).map((item) => item.id), ['001'])
  }
})

test('combines supplier category and video filters', () => {
  const result = applyFilters(exhibitors, {
    ...DEFAULT_FILTERS,
    category: '机器人本体',
    hasVideo: true,
  })
  assert.deepEqual(result.map((item) => item.id), ['003'])
})

test('default filters preserve all exhibitors and represent a reset state', () => {
  assert.deepEqual(DEFAULT_FILTERS, { query: '', category: 'all', hasVideo: false })
  assert.equal(applyFilters(exhibitors, DEFAULT_FILTERS).length, exhibitors.length)
})
