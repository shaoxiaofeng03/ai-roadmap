/**
 * 打卡文件的本地读写（只在 `pnpm dev` 时生效）
 *
 * - GET  /__checkins       读取仓库根目录的 checkins.json
 * - POST /__checkins       写入 checkins.json（浏览器打卡）
 * - POST /__checkins/push  git add → commit → push，触发 GitHub Pages 自动部署
 *
 * 线上（GitHub Pages）是纯静态站点，没有这个接口，只读取构建时复制进 dist 的 checkins.json。
 * 因此全程不需要在浏览器里保存 GitHub token。
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

const execFileAsync = promisify(execFile)

export const CHECKINS_FILE = 'checkins.json'

type DayRecord = { done: string[]; note?: string; submittedAt?: string; updatedAt: string }
type CheckinData = { version: 1; days: Record<string, DayRecord> }

const emptyData = (): CheckinData => ({ version: 1, days: {} })

function sanitize(input: unknown): CheckinData {
  const out = emptyData()
  if (!input || typeof input !== 'object') return out
  const days = (input as any).days
  if (!days || typeof days !== 'object') return out

  for (const [key, value] of Object.entries<any>(days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !value || typeof value !== 'object') continue
    const rec: DayRecord = {
      done: Array.isArray(value.done)
        ? value.done.filter((x: unknown) => typeof x === 'string').slice(0, 500)
        : [],
      note: typeof value.note === 'string' ? value.note.slice(0, 5000) : '',
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString()
    }
    if (typeof value.submittedAt === 'string') rec.submittedAt = value.submittedAt
    out.days[key] = rec
  }
  return out
}

function readFile(root: string): CheckinData {
  try {
    return sanitize(JSON.parse(fs.readFileSync(path.join(root, CHECKINS_FILE), 'utf8')))
  } catch {
    return emptyData()
  }
}

function writeFile(root: string, data: CheckinData) {
  const file = path.join(root, CHECKINS_FILE)
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  fs.renameSync(tmp, file)
}

function send(res: ServerResponse, code: number, payload: unknown) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(payload))
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > 2_000_000) {
        reject(new Error('请求体过大'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch {
        reject(new Error('JSON 解析失败'))
      }
    })
    req.on('error', reject)
  })
}

function isLocal(req: IncomingMessage): boolean {
  const ip = req.socket.remoteAddress ?? ''
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
}

async function git(root: string, args: string[]): Promise<string> {
  const { stdout, stderr } = await execFileAsync('git', args, {
    cwd: root,
    timeout: 120_000,
    windowsHide: true,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
  })
  return `${stdout}${stderr}`.trim()
}

export function checkinsPlugin(root: string): Plugin {
  return {
    name: 'checkins-local-file',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0]
        const marker = '/__checkins'
        const at = pathname.indexOf(marker)
        if (at < 0) return next()

        // 只允许本机访问，避免局域网里别人写入/推送
        if (!isLocal(req)) return send(res, 403, { error: '仅允许本机访问' })

        const action = pathname.slice(at + marker.length).replace(/\/+$/, '')

        try {
          if (req.method === 'GET' && action === '') {
            return send(res, 200, { writable: true, file: CHECKINS_FILE, data: readFile(root) })
          }

          if (req.method === 'POST' && action === '') {
            const data = sanitize(await readBody(req))
            writeFile(root, data)
            return send(res, 200, { ok: true, file: CHECKINS_FILE, days: Object.keys(data.days).length })
          }

          if (req.method === 'POST' && action === '/push') {
            const steps: Array<{ name: string; ok: boolean; out: string }> = []

            steps.push({ name: 'git add', ok: true, out: (await git(root, ['add', '--', CHECKINS_FILE])) || '已暂存' })

            const status = await git(root, ['status', '--porcelain', '--', CHECKINS_FILE])
            if (status) {
              const message = `chore(checkin): ${new Date().toISOString().slice(0, 10)} 打卡`
              const out = await git(root, ['commit', '-m', message, '--', CHECKINS_FILE])
              steps.push({ name: 'git commit', ok: true, out })
            } else {
              steps.push({ name: 'git commit', ok: true, out: '没有新的改动，跳过 commit' })
            }

            const branch = await git(root, ['rev-parse', '--abbrev-ref', 'HEAD'])
            steps.push({ name: `git push (${branch})`, ok: true, out: (await git(root, ['push'])) || '已是最新' })

            return send(res, 200, { ok: true, steps })
          }

          return send(res, 404, { error: '未知接口' })
        } catch (e: any) {
          const out = [e?.stdout, e?.stderr, e?.message].filter(Boolean).join('\n').trim()
          return send(res, 500, { ok: false, error: out || String(e) })
        }
      })
    }
  }
}
