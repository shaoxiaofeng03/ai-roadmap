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
  /** 该周第一天（YYYY-MM-DD，由 dates 推断年份） */
  startDate?: string
  /** 该周最后一天（YYYY-MM-DD） */
  endDate?: string
  /** 跳转到 ROADMAP 对应周的链接 */
  plan?: string
  /** 该周的视频/课程资源 */
  resource?: { title: string; link: string }
  /** 本周学习包（projects/wN-xxx/）的链接 */
  pkg?: string
}

/** 每日任务：主任务（学习包 README 的「周计划」表）+ 当日练习（docs/05-exercises.md） */
export interface DailyTask {
  /** 稳定 id，用于打卡记录；格式 w1-D2-main / w1-D2-Ex2.1 */
  id: string
  text: string
  kind: 'main' | 'exercise'
  /** 完成标志 / 验收标准（仅主任务有） */
  acceptance?: string
}

export interface DayPlan {
  /** 所属周 */
  week: number
  /** D1 / D2 … */
  label: string
  /** YYYY-MM-DD */
  date: string
  /** 周二 / 周三 …（由日期算出） */
  weekday: string
  /** 教材 */
  textbook: string
  /** 当日主任务 */
  task: string
  /** 完成标志 */
  acceptance: string
  /** 勾选清单：主任务 + 练习 */
  tasks: DailyTask[]
}

export interface SiteData {
  currentWeek: number
  weeks: Week[]
  /** 从各周学习包解析出的每日计划，按日期升序 */
  days: DayPlan[]
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

/** PROGRESS.md 里的「起始：2026-11-24」，用于给周计划里的 11/24 补年份 */
export function parseStartDate(progressMd: string): { year: number; month: number; day: number } | null {
  const m = /起始[：:]\s*(\d{4})-(\d{2})-(\d{2})/.exec(progressMd)
  return m ? { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) } : null
}

/** 周计划的日期只写了 11/24，按起始日期推断年份（跨年：1 月 < 11 月 → 下一年） */
export function inferYear(month: number, start: { year: number; month: number } | null): number {
  if (!start) return new Date().getFullYear()
  return month < start.month ? start.year + 1 : start.year
}

const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** YYYY-MM-DD（用 UTC 计算，避免本地时区把日期算偏） */
export function formatDateUTC(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** 某天的中文星期 */
export function weekdayCN(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return WEEKDAY_CN[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] ?? ''
}
