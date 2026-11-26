/**
 * 构建时读取仓库文件，生成站点数据（site-data）与侧边栏。
 * 新增一周（projects/wN-xxx/）或修改周标题后无需改任何站点配置，推送即自动更新。
 */
import fs from 'node:fs'
import path from 'node:path'
import type { DefaultTheme } from 'vitepress'
import {
  TOTAL_WEEKS,
  formatDateUTC,
  inferYear,
  parseCurrentWeek,
  parseHeadings,
  parseStartDate,
  parseWeekTitle,
  slugify,
  stripParens,
  weekdayCN,
  type DailyTask,
  type DayPlan,
  type SiteData,
  type Week
} from './site-data'

export const ROADMAP_FILE = 'ROADMAP.md'
export const RESOURCES_FILE = 'RESOURCES-VIDEOS.md'
export const PROGRESS_FILE = 'PROGRESS.md'

/** 根目录文档在侧边栏里的短名称（按此顺序排列） */
const OVERVIEW_LABELS: Record<string, string> = {
  [ROADMAP_FILE]: '路线图',
  [PROGRESS_FILE]: '学习进度',
  [RESOURCES_FILE]: '视频与课程资源'
}

function read(root: string, file: string): string {
  try {
    return fs.readFileSync(path.join(root, file), 'utf8')
  } catch {
    return ''
  }
}

function firstH1(md: string): string {
  return (/^#\s+(.+)$/m.exec(md) ?? [])[1] ?? ''
}

export function toUrl(mdPath: string): string {
  // 顶层周包 README.md 配合 config 的 rewrites 映射为目录首页：/projects/w1-chatbot/
  if (/^projects\/[^/]+\/README\.md$/.test(mdPath)) return '/' + mdPath.slice(0, -'README.md'.length)
  // 其余文件（含 solutions/README.md）按普通页面 URL 处理
  return '/' + mdPath.replace(/\.md$/, '')
}

/** 按标题里的关键词找页内锚点，例如 findAnchor(root, ROADMAP_FILE, '避坑指南') → '/ROADMAP#…' */
export function findAnchor(root: string, file: string, keyword: string): string {
  const page = '/' + file.replace(/\.md$/, '')
  const h = parseHeadings(read(root, file)).find((x) => x.text.includes(keyword))
  return h ? `${page}#${h.anchor ?? slugify(h.text)}` : page
}

/** 学习包 README 里的「周计划」表：| 二 D1 | 教材 | 任务 | 完成标志 | */
function parseDailyRows(md: string): Array<{ label: string; textbook: string; task: string; acceptance: string }> {
  const out: Array<{ label: string; textbook: string; task: string; acceptance: string }> = []
  for (const line of md.split(/\r?\n/)) {
    const m = /^\|\s*(?:[一二三四五六日天]\s*)?(D\d+)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|/.exec(line)
    if (!m) continue
    out.push({ label: m[1], textbook: m[2], task: m[3], acceptance: m[4] })
  }
  return out
}

/** docs/05-exercises.md：## D2 … 小节里的 **Ex2.1 …** 练习 */
function parseExercises(md: string): Map<string, Array<{ label: string; text: string }>> {
  const out = new Map<string, Array<{ label: string; text: string }>>()
  let current = ''
  for (const line of md.split(/\r?\n/)) {
    const h = /^##\s*(D\d+)/.exec(line)
    if (h) {
      current = h[1]
      continue
    }
    if (!current) continue
    const e = /^\*\*(Ex[0-9.]+)\s*(.*?)\*\*/.exec(line)
    if (!e) continue
    const rest = e[2].trim()
    const arr = out.get(current) ?? []
    arr.push({ label: e[1], text: rest ? `${e[1]} ${rest}` : e[1] })
    out.set(current, arr)
  }
  return out
}

/** 把各周学习包的每日计划展开成日期 → 任务，供打卡组件使用 */
function buildDays(root: string, weeks: Week[], start: { year: number; month: number; day: number } | null): DayPlan[] {
  const days: DayPlan[] = []
  for (const w of weeks) {
    if (!w.pkg) continue
    const dir = w.pkg.replace(/^\/projects\//, '').replace(/\/$/, '')
    const rows = parseDailyRows(read(root, `projects/${dir}/README.md`))
    if (!rows.length) continue
    const dm = /(\d{1,2})\/(\d{1,2})/.exec(w.dates)
    if (!dm) continue
    const month = Number(dm[1])
    const day = Number(dm[2])
    const base = Date.UTC(inferYear(month, start), month - 1, day)
    const exercises = parseExercises(read(root, `projects/${dir}/docs/05-exercises.md`))

    for (const row of rows) {
      const offset = Math.max(0, Number(row.label.slice(1)) - 1)
      const date = formatDateUTC(base + offset * 86_400_000)
      const tasks: DailyTask[] = [
        { id: `w${w.n}-${row.label}-main`, text: row.task, kind: 'main', acceptance: row.acceptance }
      ]
      for (const e of exercises.get(row.label) ?? []) {
        tasks.push({ id: `w${w.n}-${row.label}-${e.label}`, text: e.text, kind: 'exercise' })
      }
      days.push({
        week: w.n,
        label: row.label,
        date,
        weekday: weekdayCN(date),
        textbook: row.textbook,
        task: row.task,
        acceptance: row.acceptance,
        tasks
      })
    }
  }
  return days.sort((a, b) => a.date.localeCompare(b.date))
}

export function loadSiteData(root: string): SiteData {
  const weeks: Week[] = Array.from({ length: TOTAL_WEEKS }, (_, i) => ({ n: i + 1, title: '', dates: '' }))
  const at = (n: number) => weeks[n - 1]
  const progress = read(root, PROGRESS_FILE)
  const start = parseStartDate(progress)

  // 1) 周计划：ROADMAP.md
  for (const h of parseHeadings(read(root, ROADMAP_FILE))) {
    const w = parseWeekTitle(h.text)
    if (!w) continue
    for (let n = w.from; n <= w.to; n++) {
      const it = at(n)
      if (!it) continue
      it.title = it.title || w.title
      it.dates = it.dates || w.dates
      it.plan = `/${ROADMAP_FILE.replace('.md', '')}#${h.anchor ?? slugify(h.text)}`
    }
  }

  // 1.1) 周起止日期：给热力图提供完整时间轴（即使该周还没有学习包）
  for (const w of weeks) {
    const m = /(\d{1,2})\/(\d{1,2})\s*[–-]\s*(\d{1,2})\/(\d{1,2})/.exec(w.dates)
    if (!m) continue
    const [m1, d1, m2, d2] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]
    const y1 = inferYear(m1, start)
    const y2 = m2 < m1 ? y1 + 1 : y1
    w.startDate = formatDateUTC(Date.UTC(y1, m1 - 1, d1))
    w.endDate = formatDateUTC(Date.UTC(y2, m2 - 1, d2))
  }

  // 2) 视频资源：RESOURCES-VIDEOS.md
  for (const h of parseHeadings(read(root, RESOURCES_FILE))) {
    const w = parseWeekTitle(h.text)
    if (!w) continue
    for (let n = w.from; n <= w.to; n++) {
      // 同一周命中多个标题时取第一个（W1 Python 速成 优先于 W1–W2 LLM API）
      at(n).resource ??= { title: h.text, link: `/${RESOURCES_FILE.replace('.md', '')}#${h.anchor ?? slugify(h.text)}` }
    }
  }

  // 3) 学习包：projects/wN-xxx/
  const projectsDir = path.join(root, 'projects')
  if (fs.existsSync(projectsDir)) {
    for (const dir of fs.readdirSync(projectsDir)) {
      const m = /^w(\d+)-/.exec(dir)
      if (!m || !fs.existsSync(path.join(projectsDir, dir, 'README.md'))) continue
      at(Number(m[1])).pkg = `/projects/${dir}/`
    }
  }

  return {
    currentWeek: parseCurrentWeek(progress),
    weeks,
    days: buildDays(root, weeks, start)
  }
}

/** 列出某目录下（含子目录）的 Markdown，排除目录自身的 README.md */
function listMarkdown(root: string, dir: string): string[] {
  const base = path.join(root, dir)
  if (!fs.existsSync(base)) return []
  const out: string[] = []
  const walk = (rel: string) => {
    for (const ent of fs.readdirSync(path.join(base, rel), { withFileTypes: true })) {
      if (ent.name.startsWith('.') || ent.name === 'node_modules') continue
      const child = rel ? `${rel}/${ent.name}` : ent.name
      if (ent.isDirectory()) walk(child)
      else if (ent.name.endsWith('.md') && child !== 'README.md') out.push(child)
    }
  }
  walk('')
  return out.sort()
}

export function buildSidebar(root: string, data: SiteData): DefaultTheme.SidebarItem[] {
  // 总览
  const overview: DefaultTheme.SidebarItem[] = []
  for (const [file, text] of Object.entries(OVERVIEW_LABELS)) {
    if (fs.existsSync(path.join(root, file))) overview.push({ text, link: toUrl(file) })
  }
  // 根目录其它 Markdown（新增的总结/笔记文件会自动出现在这里）
  for (const f of fs.readdirSync(root).sort()) {
    if (!f.endsWith('.md') || f in OVERVIEW_LABELS || f === 'index.md') continue
    overview.push({ text: firstH1(read(root, f)) || f.replace(/\.md$/, ''), link: toUrl(f) })
  }

  // 每周学习包
  const groups: DefaultTheme.SidebarItem[] = []
  for (const w of data.weeks) {
    if (!w.pkg) continue
    const dir = w.pkg.replace(/^\/projects\//, '').replace(/\/$/, '')
    const items: DefaultTheme.SidebarItem[] = [{ text: '本周导览', link: w.pkg }]
    for (const rel of listMarkdown(root, `projects/${dir}`)) {
      items.push({ text: stripParens(firstH1(read(root, `projects/${dir}/${rel}`))) || rel, link: toUrl(`projects/${dir}/${rel}`) })
    }
    groups.push({
      text: `W${w.n} · ${w.title || dir}`,
      collapsed: w.n !== data.currentWeek,
      items
    })
  }

  return [
    { items: [{ text: '首页', link: '/' }] },
    { text: '总览', items: overview },
    ...groups
  ]
}
