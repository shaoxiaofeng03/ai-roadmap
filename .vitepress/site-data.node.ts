/**
 * 构建时读取仓库文件，生成站点数据（site-data）与侧边栏。
 * 新增一周（projects/wN-xxx/）或修改周标题后无需改任何站点配置，推送即自动更新。
 */
import fs from 'node:fs'
import path from 'node:path'
import type { DefaultTheme } from 'vitepress'
import {
  TOTAL_WEEKS,
  parseCurrentWeek,
  parseHeadings,
  parseWeekTitle,
  slugify,
  stripParens,
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

export function loadSiteData(root: string): SiteData {
  const weeks: Week[] = Array.from({ length: TOTAL_WEEKS }, (_, i) => ({ n: i + 1, title: '', dates: '' }))
  const at = (n: number) => weeks[n - 1]

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

  return { currentWeek: parseCurrentWeek(read(root, PROGRESS_FILE)), weeks }
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
