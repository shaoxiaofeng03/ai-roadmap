/**
 * 站点数据层：只做纯文本解析，不依赖 Node API（构建与浏览器端都可引用）。
 *
 * 数据全部来自仓库里已有的 Markdown，不单独维护一份副本：
 * - 周计划：ROADMAP.md 第 5 节的周标题（#### W1（11/24–11/30）环境 + LLM API 入门）
 * - 视频资源：RESOURCES-VIDEOS.md 里以 W 开头的二级标题
 * - 当前周：PROGRESS.md 的「当前周：W1」
 * - 学习包：projects/wN-xxx/ 目录是否存在
 */

export interface Week {
  n: number
  /** 主题（来自 ROADMAP） */
  title: string
  /** 日期区间（来自 ROADMAP） */
  dates: string
  /** 跳转到 ROADMAP 对应周的链接 */
  plan?: string
  /** 该周的视频/课程资源 */
  resource?: { title: string; link: string }
  /** 本周学习包（projects/wN-xxx/）的链接 */
  pkg?: string
}

export interface SiteData {
  currentWeek: number
  weeks: Week[]
}

export const TOTAL_WEEKS = 20

/** 与 VitePress 标题锚点保持一致的 slugify（同 @mdit-vue/shared） */
export const slugify = (str: string): string =>
  str
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()

/** 去掉标题里的括号补充说明：07 · 资料地址（本周内容…） → 07 · 资料地址 */
export function stripParens(text: string): string {
  return text
    .replace(/^[a-zA-Z]+ · /, '')
    .replace(/（[^）]*）/g, '')
    .trim()
}

export interface ParsedWeekTitle {
  from: number
  to: number
  dates: string
  title: string
}

/** 解析 "W1（11/24–11/30）环境 + LLM API 入门" / "W17–W18（3/16–3/29）面试循环" / "W1–W2 LLM API + Prompt 工程" */
export function parseWeekTitle(text: string): ParsedWeekTitle | null {
  const m = /^W(\d+)(?:[–-]W?(\d+))?\s*(?:（([^）]*)）)?\s*(.*)$/.exec(text)
  if (!m) return null
  const from = Number(m[1])
  const to = m[2] ? Number(m[2]) : from
  const paren = m[3] ?? ''
  return {
    from,
    to,
    dates: /^\d{1,2}\/\d{1,2}/.test(paren) ? paren : '',
    title: m[4].trim()
  }
}

interface Heading {
  level: number
  text: string
  /** 标题上方 3 行内的 <a id="xxx"></a>，没有则为 undefined */
  anchor?: string
}

export function parseHeadings(md: string): Heading[] {
  const lines = md.split(/\r?\n/)
  const out: Heading[] = []
  for (let i = 0; i < lines.length; i++) {
    const m = /^(#{2,4})\s+(.+?)\s*$/.exec(lines[i])
    if (!m) continue
    let anchor: string | undefined
    for (let j = i - 1; j >= 0 && j >= i - 3; j--) {
      const a = /^<a[^>]*\bid="([^"]+)"[^>]*><\/a>$/.exec(lines[j].trim())
      if (a) {
        anchor = a[1]
        break
      }
      if (lines[j].trim() !== '') break
    }
    out.push({ level: m[1].length, text: m[2].replace(/\s+#+\s*$/, '').trim(), anchor })
  }
  return out
}

/** PROGRESS.md 里的「当前周：W1」 */
export function parseCurrentWeek(progressMd: string): number {
  const m = /当前周：W(\d+)/.exec(progressMd)
  return m ? Number(m[1]) : 1
}
