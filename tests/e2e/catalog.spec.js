import { expect, test } from '@playwright/test'

async function search(page, query, mobile) {
  if (mobile) await page.locator('.mobile-search-button').click()
  await page.getByLabel('搜索供应商资料').fill(query)
  await page.locator('form[role="search"]').getByRole('button', { name: '搜索', exact: true }).click()
}

test('subpath catalog, search, category, detail and external links', async ({ page, isMobile }, testInfo) => {
  const errors = []
  const requests = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => requests.push(request.url()))
  await page.goto('./')
  await expect(page.locator('.exhibitor-item')).toHaveCount(1236)
  await expect(page.locator('.row-logo').first()).toBeVisible()
  if (isMobile) {
    const searchText = await page.locator('.mobile-search-button span').boundingBox()
    expect(searchText.height, 'mobile search label stays on one line').toBeLessThanOrEqual(20)
  }
  await expect.poll(() => page.locator('img.row-logo').first().evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('catalog.png'), fullPage: true })

  await search(page, '3M中国有限公司', isMobile)
  await expect(page.locator('.exhibitor-item')).toHaveCount(1)
  await page.getByRole('button', { name: '查看 3M中国有限公司 完整资料' }).click()
  await expect(page.locator('.identity-copy h2')).toHaveText('3M中国有限公司')
  const website = page.locator('.identity-website')
  await expect(website).toHaveAttribute('href', /^https?:\/\//)
  await expect(website).toHaveAttribute('rel', /noopener/)
  if (isMobile) {
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.locator('.app-background')).toHaveAttribute('inert', '')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('button', { name: '查看 3M中国有限公司 完整资料' })).toBeFocused()
  } else {
    await page.locator('.detail-titlebar').getByRole('button', { name: '关闭展商详情' }).click()
    await expect(page.getByText('选择一家公司查看完整资料')).toBeVisible()
    await page.getByRole('button', { name: '查看 3M中国有限公司 完整资料' }).click()
    await expect(page.locator('.identity-copy h2')).toHaveText('3M中国有限公司')
  }

  await search(page, '无框 电机', isMobile)
  if (isMobile) await page.getByRole('combobox').selectOption('电机')
  else await page.locator('.category-list button').filter({ has: page.locator('span', { hasText: /^电机$/ }) }).click()
  await expect.poll(() => page.locator('.exhibitor-item').count()).toBeGreaterThan(0)
  await expect.poll(() => page.locator('.exhibitor-item').count()).toBeLessThan(30)
  await search(page, '___nonexistent_supplier_zzz___', isMobile)
  await expect(page.getByText('当前快照中没有匹配结果')).toBeVisible()
  await page.getByRole('button', { name: '清除全部筛选' }).click()
  await expect(page.locator('.exhibitor-item')).toHaveCount(1236)
  expect(errors).toEqual([])
  expect(requests.some(url => /\/api\/|signin-with-chatgpt/.test(url))).toBe(false)
  const base = new URL(page.url()).origin
  expect(requests.filter(url => new URL(url).origin !== base)).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('broken local image has an accessible placeholder', async ({ page }) => {
  await page.route('**/assets/light-image-0001.webp', route => route.abort())
  await page.goto('./')
  await expect(page.locator('.exhibitor-item')).toHaveCount(1236)
  await expect(page.locator('.exhibitor-item').first().getByRole('img', { name: /图片不可用/ })).toBeVisible()
})

test('medium desktop widths keep the website column inside the results area', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop layout only')
  for (const width of [1024, 1115, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('./')
    await expect(page.locator('.exhibitor-item')).toHaveCount(1236)
    const row = page.locator('.exhibitor-item').first()
    const link = row.locator('.website-link')
    const bounds = await link.boundingBox()
    const region = await page.locator('.results-panel').boundingBox()
    expect(bounds.x + bounds.width, `${width}px website should fit`).toBeLessThanOrEqual(region.x + region.width)
    expect(bounds.width).toBeGreaterThanOrEqual(120)
  }
})

test('data load failure shows retry and recovers', async ({ page }) => {
  await page.route('**/data/exhibitors.json', route => route.fulfill({ status: 404, body: '{}' }))
  await page.goto('./')
  await expect(page.getByRole('heading', { name: '资料库暂时载入失败' })).toBeVisible()
  await page.unroute('**/data/exhibitors.json')
  await page.getByRole('button', { name: '重新加载资料库' }).click()
  await expect(page.locator('.exhibitor-item')).toHaveCount(1236)
})
