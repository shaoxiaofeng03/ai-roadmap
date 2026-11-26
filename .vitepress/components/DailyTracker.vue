<script setup lang="ts">
/**
 * 每日打卡 + 热力图
 *
 * - 任务：构建时从各周学习包 README 的「周计划」表和 docs/05-exercises.md 解析。
 * - 记录：写入仓库根目录的 checkins.json（仅本地 `pnpm dev` 可写）。
 * - 发布：点「打卡并提交」后，本地开发服务器执行 git add → commit → push，
 *   GitHub Actions 自动更新 Pages；线上站点只读展示已提交的记录，不需要 GitHub token。
 */
import { computed, onMounted, ref, watch } from 'vue'
import siteData from 'virtual:site-data'
import type { DayPlan, DailyTask } from '../site-data'

type DayRecord = {
  done: string[]
  note?: string
  submittedAt?: string
  updatedAt: string
}
type CheckinData = { version: 1; days: Record<string, DayRecord> }

const plans: DayPlan[] = siteData.days ?? []
const BASE = String((import.meta as any).env?.BASE_URL ?? '/').replace(/\/?$/, '/')
const DEV = Boolean((import.meta as any).env?.DEV)
const LS_KEY = 'ai-roadmap:checkins:v1'
const AUTOPUSH_KEY = 'ai-roadmap:autopush'

const pad2 = (n: number) => String(n).padStart(2, '0')
const keyOf = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const dateOf = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
const mondayOf = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return addDays(x, -((x.getDay() + 6) % 7))
}

const today = ref(keyOf(new Date()))
const selectedKey = ref(today.value)
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined

const writable = ref(false)
const loading = ref(false)
const saving = ref(false)
const pushing = ref(false)
const autoPush = ref(true)
const fileStatus = ref('')
const lastPush = ref('')

const emptyData = (): CheckinData => ({ version: 1, days: {} })
const data = ref<CheckinData>(emptyData())

/* ---------------- 记录合并 / 本地草稿 ---------------- */

function normalize(input: unknown): CheckinData {
  const out = emptyData()
  if (!input || typeof input !== 'object') return out
  const days = (input as any).days
  if (!days || typeof days !== 'object') return out
  for (const [key, value] of Object.entries<any>(days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !value || typeof value !== 'object') continue
    out.days[key] = {
      done: Array.isArray(value.done) ? value.done.filter((x: unknown) => typeof x === 'string') : [],
      note: typeof value.note === 'string' ? value.note : '',
      submittedAt: typeof value.submittedAt === 'string' ? value.submittedAt : undefined,
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date(0).toISOString()
    }
  }
  return out
}

/** 同一天以 updatedAt 更新的一方为准 */
function merge(a: CheckinData, b: CheckinData): CheckinData {
  const days = { ...a.days }
  for (const [key, rec] of Object.entries(b.days)) {
    const prev = days[key]
    if (!prev || (rec.updatedAt || '') > (prev.updatedAt || '')) days[key] = rec
  }
  return { version: 1, days }
}

function saveLocal() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data.value))
  } catch {
    /* 隐私模式下 localStorage 可能不可用，忽略 */
  }
}

/* ---------------- 本地文件接口（pnpm dev） ---------------- */

async function loadLocalFile(verbose: boolean) {
  loading.value = true
  try {
    // 1) 本地开发服务器：可读写仓库根目录的 checkins.json
    //    生产构建里 DEV=false，不探测接口，避免线上控制台出现 404
    if (DEV) {
      try {
        const res = await fetch(`${BASE}__checkins?ts=${Date.now()}`, { cache: 'no-store' })
        const type = res.headers.get('content-type') ?? ''
        if (res.ok && type.includes('application/json')) {
          const json = await res.json()
          if (json?.writable) {
            writable.value = true
            data.value = merge(data.value, normalize(json.data))
            saveLocal()
            fileStatus.value = `已读取 checkins.json · ${fmtTime(new Date().toISOString())}`
            if (verbose) status('已读取本地 checkins.json')
            return
          }
        }
      } catch {
        /* 接口不可用时继续读静态文件 */
      }
    }

    // 2) 线上：读取构建时复制进 dist 的 checkins.json
    writable.value = false
    try {
      const res = await fetch(`${BASE}checkins.json?ts=${Date.now()}`, { cache: 'no-store' })
      if (res.ok) data.value = merge(data.value, normalize(await res.json()))
    } catch {
      /* 首次部署时可能还没有文件 */
    }
    saveLocal()
    if (verbose) status('线上只读：已加载已提交的打卡记录')
  } finally {
    loading.value = false
  }
}

async function saveToFile(verbose: boolean): Promise<boolean> {
  if (!writable.value) {
    if (verbose) status('当前是线上只读模式，请本地运行 pnpm dev 后打卡', true)
    return false
  }
  saving.value = true
  try {
    const res = await fetch(`${BASE}__checkins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.value)
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`)
    fileStatus.value = `checkins.json 已更新 · ${fmtTime(new Date().toISOString())}`
    if (verbose) status('已写入 checkins.json')
    return true
  } catch (e: any) {
    status(e?.message || String(e), true)
    return false
  } finally {
    saving.value = false
  }
}

async function pushToGit(verbose: boolean): Promise<boolean> {
  if (!writable.value) {
    if (verbose) status('当前是线上只读模式，请本地运行 pnpm dev 后推送', true)
    return false
  }
  pushing.value = true
  try {
    const res = await fetch(`${BASE}__checkins/push`, { method: 'POST' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`)
    lastPush.value = (json.steps ?? []).map((s: any) => `${s.name}\n${s.out}`).join('\n\n')
    status('已 push，GitHub Pages 会自动更新')
    return true
  } catch (e: any) {
    status(e?.message || String(e), true)
    return false
  } finally {
    pushing.value = false
  }
}

/* ---------------- 选中日期 / 任务 ---------------- */

const planByDate = computed(() => {
  const map = new Map<string, DayPlan>()
  for (const p of plans) map.set(p.date, p)
  return map
})

const selectedPlan = computed(() => planByDate.value.get(selectedKey.value))
const selectedRecord = computed(() => data.value.days[selectedKey.value])

function ensureRecord(key: string): DayRecord {
  if (!data.value.days[key]) {
    data.value.days[key] = { done: [], note: '', updatedAt: new Date().toISOString() }
  }
  return data.value.days[key]
}

const selectedDone = computed(() => {
  const rec = selectedRecord.value
  const plan = selectedPlan.value
  if (!rec) return new Set<string>()
  if (!plan) return new Set(rec.done)
  return new Set(rec.done.filter((id) => plan.tasks.some((t) => t.id === id)))
})

const allDone = computed(() => Boolean(selectedPlan.value) && selectedDone.value.size >= selectedPlan.value!.tasks.length)
const submitted = computed(() => Boolean(selectedRecord.value?.submittedAt))
const dirty = computed(() => {
  const rec = selectedRecord.value
  return Boolean(rec?.submittedAt) && (rec?.updatedAt ?? '') > (rec?.submittedAt ?? '')
})

const pct = computed(() => {
  const plan = selectedPlan.value
  if (!plan?.tasks.length) return 0
  return Math.round((selectedDone.value.size / plan.tasks.length) * 100)
})

const submitLabel = computed(() => {
  if (saving.value) return '保存中…'
  if (pushing.value) return '推送中…'
  if (submitted.value) return dirty.value ? '更新并重新提交' : '已提交'
  return autoPush.value ? '打卡并提交（写入 + push）' : '打卡并提交（写入文件）'
})

function toggle(task: DailyTask) {
  const rec = ensureRecord(selectedKey.value)
  const i = rec.done.indexOf(task.id)
  if (i >= 0) rec.done.splice(i, 1)
  else rec.done.push(task.id)
  rec.updatedAt = new Date().toISOString()
  saveLocal()
}

function onNote(e: Event) {
  const rec = ensureRecord(selectedKey.value)
  rec.note = (e.target as HTMLTextAreaElement).value
  rec.updatedAt = new Date().toISOString()
  saveLocal()
}

async function submitDay() {
  const rec = ensureRecord(selectedKey.value)
  rec.submittedAt = new Date().toISOString()
  rec.updatedAt = rec.submittedAt
  saveLocal()

  if (!writable.value) {
    status('线上只读：已保存在本机浏览器；请本地 pnpm dev 打卡并推送', true)
    return
  }

  const saved = await saveToFile(false)
  if (!saved) return
  if (autoPush.value) await pushToGit(false)
  else status('已写入 checkins.json（未 push）')
}

async function saveOnly() {
  await saveToFile(true)
}

async function pushOnly() {
  const saved = await saveToFile(false)
  if (saved) await pushToGit(true)
}

async function reloadFile() {
  await loadLocalFile(true)
}

async function undoSubmit() {
  const rec = data.value.days[selectedKey.value]
  if (!rec) return
  rec.submittedAt = undefined
  rec.updatedAt = new Date().toISOString()
  saveLocal()

  if (!writable.value) {
    status('已撤销打卡（仅本机）')
    return
  }
  const saved = await saveToFile(false)
  if (!saved) return
  if (autoPush.value) await pushToGit(false)
  else status('已撤销打卡，checkins.json 已更新（未 push）')
}

/* ---------------- 热力图 ---------------- */

interface Cell {
  key: string
  weekIndex: number
  row: number
  level: number
  plan?: DayPlan
  record?: DayRecord
  future: boolean
  submitted: boolean
}

function levelOf(plan?: DayPlan, rec?: DayRecord): number {
  if (!rec) return 0
  const total = plan?.tasks.length ?? 0
  if (!total) return rec.submittedAt ? 1 : 0
  const done = rec.done.filter((id) => plan!.tasks.some((t) => t.id === id)).length
  const ratio = done / total
  if (ratio <= 0) return rec.submittedAt ? 1 : 0
  if (ratio < 0.34) return 1
  if (ratio < 0.67) return 2
  if (ratio < 1) return 3
  return 4
}

const heat = computed(() => {
  // 时间轴覆盖整条路线图（含还没生成学习包的周），再并上已有记录和今天
  const timeline = [
    ...siteData.weeks.flatMap((w) => [w.startDate, w.endDate]),
    ...plans.map((p) => p.date),
    today.value,
    ...Object.keys(data.value.days)
  ]
    .filter((x): x is string => Boolean(x))
    .sort()
  const first = timeline[0] ?? today.value
  const last = timeline[timeline.length - 1] ?? today.value
  const start = mondayOf(dateOf(first))
  const end = addDays(dateOf(last), 6 - ((dateOf(last).getDay() + 6) % 7))

  const weekStarts: Date[] = []
  const cells: Cell[] = []
  let cursor = new Date(start)
  let weekIndex = 0

  while (cursor <= end) {
    weekStarts.push(new Date(cursor))
    for (let row = 0; row < 7; row++) {
      const d = addDays(cursor, row)
      const key = keyOf(d)
      const plan = planByDate.value.get(key)
      const record = data.value.days[key]
      cells.push({
        key,
        weekIndex,
        row,
        level: levelOf(plan, record),
        plan,
        record,
        future: key > today.value,
        submitted: Boolean(record?.submittedAt)
      })
    }
    cursor = addDays(cursor, 7)
    weekIndex++
  }

  const months: Array<{ index: number; label: string }> = []
  let lastMonth = -1
  weekStarts.forEach((d, i) => {
    const m = d.getMonth()
    if (m !== lastMonth) {
      months.push({ index: i, label: `${m + 1}月` })
      lastMonth = m
    }
  })

  return { cells, months, weekCount: weekStarts.length }
})

function cellTitle(cell: Cell): string {
  const parts = [`${cell.key} ${cell.plan?.weekday ?? ''}`.trim()]
  if (cell.plan) parts.push(`W${cell.plan.week} ${cell.plan.label}`)
  if (cell.plan) {
    const done = cell.record?.done.filter((id) => cell.plan!.tasks.some((t) => t.id === id)).length ?? 0
    parts.push(`${done}/${cell.plan.tasks.length} 项`)
  }
  if (cell.submitted) parts.push('已打卡')
  else if (cell.future) parts.push('未到')
  else if (cell.plan) parts.push('未打卡')
  return parts.join(' · ')
}

/* ---------------- 统计 / 导出 ---------------- */

const stats = computed(() => {
  let totalDone = 0
  let totalTasks = 0
  for (const p of plans) {
    if (p.date > today.value) continue
    totalTasks += p.tasks.length
    const rec = data.value.days[p.date]
    totalDone += rec ? rec.done.filter((id) => p.tasks.some((t) => t.id === id)).length : 0
  }

  let streak = 0
  let cursor = dateOf(today.value)
  if (!data.value.days[today.value]?.submittedAt) cursor = addDays(cursor, -1)
  while (data.value.days[keyOf(cursor)]?.submittedAt) {
    streak++
    cursor = addDays(cursor, -1)
  }

  const weekPlans = plans.filter((p) => p.week === siteData.currentWeek)
  const weekTasks = weekPlans.reduce((n, p) => n + p.tasks.length, 0)
  const weekDone = weekPlans.reduce((n, p) => {
    const rec = data.value.days[p.date]
    return n + (rec ? rec.done.filter((id) => p.tasks.some((t) => t.id === id)).length : 0)
  }, 0)

  return {
    submittedDays: Object.values(data.value.days).filter((r) => r.submittedAt).length,
    totalDone,
    totalTasks,
    streak,
    weekDone,
    weekTasks,
    weekPct: weekTasks ? Math.round((weekDone / weekTasks) * 100) : 0
  }
})

const markdown = computed(() => {
  const entries = Object.entries(data.value.days)
    .filter(([, rec]) => rec.submittedAt)
    .sort(([a], [b]) => a.localeCompare(b))
  if (!entries.length) return '（暂无打卡记录）'

  const lines = ['## 打卡记录', '', '| 日期 | 周 | 完成任务 | 笔记 |', '|---|---|---|---|']
  for (const [key, rec] of entries) {
    const plan = planByDate.value.get(key)
    const done = plan ? rec.done.filter((id) => plan.tasks.some((t) => t.id === id)).length : rec.done.length
    const total = plan?.tasks.length ?? 0
    const note = (rec.note ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
    lines.push(`| ${key} | ${plan ? `W${plan.week} ${plan.label}` : '—'} | ${done}/${total} | ${note} |`)
  }
  return lines.join('\n')
})

const dayMarkdown = computed(() => {
  const plan = selectedPlan.value
  const rec = selectedRecord.value
  const lines = [`### ${selectedKey.value} ${plan?.weekday ?? ''}${plan ? ` · W${plan.week} ${plan.label}` : ''}`]
  if (plan) {
    for (const t of plan.tasks) lines.push(`- [${selectedDone.value.has(t.id) ? 'x' : ' '}] ${t.text}`)
  }
  if (rec?.note) lines.push('', `笔记：${rec.note}`)
  if (rec?.submittedAt) lines.push('', `打卡时间：${fmtTime(rec.submittedAt)}`)
  return lines.join('\n')
})

function fmtTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function status(msg: string, isError = false) {
  toast.value = `${isError ? '⚠️ ' : '✅ '}${msg}`
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 5000)
}

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    status(label)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
    status(label)
  }
}

function download() {
  const blob = new Blob([`${JSON.stringify(data.value, null, 2)}\n`], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `checkins-${today.value}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

async function importFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const parsed = normalize(JSON.parse(await file.text()))
    data.value = merge(data.value, parsed)
    saveLocal()
    if (writable.value) await saveToFile(false)
    status(`已导入 ${Object.keys(parsed.days).length} 天记录`)
  } catch {
    status('导入失败：不是合法的打卡 JSON', true)
  }
  input.value = ''
}

watch(autoPush, (value) => {
  try {
    localStorage.setItem(AUTOPUSH_KEY, value ? '1' : '0')
  } catch {
    /* ignore */
  }
})

onMounted(() => {
  try {
    const saved = localStorage.getItem(AUTOPUSH_KEY)
    if (saved !== null) autoPush.value = saved === '1'
    const raw = localStorage.getItem(LS_KEY)
    if (raw) data.value = normalize(JSON.parse(raw))
  } catch {
    /* ignore */
  }

  // 今天没有学习包任务时，默认选中最近一个有任务的日子
  if (!planByDate.value.has(selectedKey.value)) {
    const upcoming = plans.find((p) => p.date >= today.value)
    selectedKey.value = upcoming?.date ?? plans[plans.length - 1]?.date ?? selectedKey.value
  }

  loadLocalFile(false)
})
</script>

<template>
  <section class="dt">
    <div class="dt-stats">
      <div class="dt-stat">
        <b>{{ stats.streak }}</b>
        <span>连续打卡（天）</span>
      </div>
      <div class="dt-stat">
        <b>{{ stats.submittedDays }}</b>
        <span>累计打卡（天）</span>
      </div>
      <div class="dt-stat">
        <b>{{ stats.totalDone }}/{{ stats.totalTasks }}</b>
        <span>累计完成任务</span>
      </div>
      <div class="dt-stat">
        <b>{{ stats.weekPct }}%</b>
        <span>W{{ siteData.currentWeek }} 完成度</span>
      </div>
    </div>

    <p v-if="!writable" class="dt-readonly">
      线上只读：这里展示的是仓库里已提交的打卡记录。要打卡，请在本地运行
      <code>pnpm dev</code>，提交并 push 后 GitHub Pages 会自动更新。
    </p>

    <div class="dt-heat">
      <div class="dt-heat-scroll">
        <div class="dt-heat-inner">
          <div class="dt-months">
            <span class="dt-spacer"></span>
            <div class="dt-months-grid" :style="{ gridTemplateColumns: `repeat(${heat.weekCount}, var(--dt-cell))` }">
              <span v-for="m in heat.months" :key="m.index" :style="{ gridColumn: m.index + 1 }">{{ m.label }}</span>
            </div>
          </div>
          <div class="dt-heat-main">
            <div class="dt-weekdays">
              <span>一</span>
              <span></span>
              <span>三</span>
              <span></span>
              <span>五</span>
              <span></span>
              <span>日</span>
            </div>
            <div
              class="dt-grid"
              :style="{
                gridTemplateColumns: `repeat(${heat.weekCount}, var(--dt-cell))`,
                gridTemplateRows: `repeat(7, var(--dt-cell))`
              }"
            >
              <button
                v-for="cell in heat.cells"
                :key="cell.key"
                type="button"
                class="dt-cell"
                :class="[
                  `l${cell.level}`,
                  {
                    future: cell.future,
                    today: cell.key === today,
                    selected: cell.key === selectedKey,
                    submitted: cell.submitted
                  }
                ]"
                :style="{ gridColumn: cell.weekIndex + 1, gridRow: cell.row + 1 }"
                :title="cellTitle(cell)"
                :aria-label="cellTitle(cell)"
                @click="selectedKey = cell.key"
              ></button>
            </div>
          </div>
        </div>
      </div>
      <div class="dt-legend">
        <span>少</span>
        <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i>
        <span>多</span>
        <span class="dt-legend-tip">点击格子查看当天任务 · 有描边 = 已打卡</span>
      </div>
    </div>

    <div class="dt-day">
      <div class="dt-day-head">
        <div>
          <div class="dt-day-date">
            {{ selectedKey }}
            <span v-if="selectedPlan" class="dt-weekday">{{ selectedPlan.weekday }}</span>
            <span v-if="selectedKey === today" class="dt-today">今天</span>
          </div>
          <div v-if="selectedPlan" class="dt-day-sub">
            W{{ selectedPlan.week }} · {{ selectedPlan.label }} · 教材 {{ selectedPlan.textbook }}
          </div>
          <div v-else class="dt-day-sub">这一天没有学习包任务，可以在备注里记录自由学习后再打卡。</div>
        </div>
        <span class="dt-badge" :class="{ ok: submitted }">{{ submitted ? '已打卡' : '未打卡' }}</span>
      </div>

      <div v-if="selectedPlan" class="dt-tasks">
        <label
          v-for="t in selectedPlan.tasks"
          :key="t.id"
          class="dt-task"
          :class="{ done: selectedDone.has(t.id), main: t.kind === 'main', readonly: !writable }"
        >
          <input type="checkbox" :checked="selectedDone.has(t.id)" :disabled="!writable" @change="toggle(t)" />
          <span class="dt-task-text">
            <span>{{ t.text }}</span>
            <span v-if="t.acceptance" class="dt-task-accept">验收：{{ t.acceptance }}</span>
          </span>
        </label>
      </div>

      <label class="dt-note-label">
        今日笔记 / 产出链接
        <textarea
          :value="selectedRecord?.note ?? ''"
          :disabled="!writable"
          rows="3"
          placeholder="例如：跑通 hello_llm.py，输出 token 用量 128；TTFT 实验数据见 README…"
          @input="onNote"
        ></textarea>
      </label>

      <div v-if="selectedPlan" class="dt-progress">
        <div class="dt-bar"><span :style="{ width: `${pct}%` }"></span></div>
        <span>{{ selectedDone.size }}/{{ selectedPlan.tasks.length }}</span>
      </div>

      <div class="dt-actions">
        <button
          class="dt-btn primary"
          :disabled="!writable || saving || pushing || (submitted && !dirty)"
          @click="submitDay"
        >
          {{ submitLabel }}
        </button>
        <button v-if="submitted" class="dt-btn ghost" :disabled="saving || pushing" @click="undoSubmit">撤销打卡</button>
        <button class="dt-btn" @click="copy(dayMarkdown, '已复制今日记录')">复制今日记录</button>
      </div>

      <p v-if="submitted" class="dt-hint">
        提交于 {{ fmtTime(selectedRecord?.submittedAt) }}<span v-if="dirty"> · 有新的修改尚未提交</span>
      </p>
      <p v-else-if="selectedPlan && !allDone" class="dt-hint">
        还有 {{ selectedPlan.tasks.length - selectedDone.size }} 项未完成，也可以先提交（会记录当前进度）。
      </p>
    </div>

    <details class="dt-panel" open>
      <summary>本地文件与发布（不需要 GitHub token）</summary>
      <p class="dt-note">
        打卡记录直接写入仓库根目录的 <code>checkins.json</code>。点「打卡并提交」会依次执行：写入文件 →
        <code>git add</code> → <code>git commit</code> → <code>git push</code> → GitHub Actions 自动发布 Pages。
        线上页面只读，展示已提交的记录。
      </p>
      <div class="dt-mode" :class="{ ok: writable }">
        {{ writable ? '本地开发模式：可以写入 checkins.json' : '线上只读模式：请本地运行 pnpm dev' }}
      </div>
      <label class="dt-check"><input v-model="autoPush" type="checkbox" /> 打卡后自动 git commit & push</label>
      <div class="dt-actions">
        <button class="dt-btn" :disabled="saving || !writable" @click="saveOnly">仅保存文件</button>
        <button class="dt-btn" :disabled="pushing || !writable" @click="pushOnly">提交并推送</button>
        <button class="dt-btn ghost" :disabled="loading" @click="reloadFile">重新读取文件</button>
      </div>
      <p class="dt-hint">{{ fileStatus || '尚未写入 checkins.json' }}</p>
      <pre v-if="lastPush" class="dt-md">{{ lastPush }}</pre>
    </details>

    <details class="dt-panel">
      <summary>数据与备份</summary>
      <div class="dt-actions">
        <button class="dt-btn" @click="copy(markdown, '已复制 Markdown 打卡记录')">复制 Markdown</button>
        <button class="dt-btn" @click="download">下载 JSON</button>
        <label class="dt-btn">
          导入 JSON
          <input type="file" accept="application/json" hidden @change="importFile" />
        </label>
      </div>
      <pre class="dt-md">{{ markdown }}</pre>
    </details>

    <div v-if="toast" class="dt-toast">{{ toast }}</div>
  </section>
</template>

<style scoped src="./daily-tracker.css"></style>
