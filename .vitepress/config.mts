import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type MarkdownRenderer } from 'vitepress'
import { checkinsPlugin } from './checkins-plugin'
import { buildSidebar, findAnchor, loadSiteData, ROADMAP_FILE } from './site-data.node'
import type { SiteData } from './site-data'

/**
 * 站点直接以仓库根目录为源目录：Markdown 留在原处，既是 GitHub 上的原文，也是网站的页面。
 * 站点相关的东西只有：index.md（首页）、.vitepress/（配置与主题）、.github/workflows/deploy.yml（自动发布）。
 */
const root = fileURLToPath(new URL('..', import.meta.url))
const REPO = 'https://github.com/shaoxiaofeng03/ai-roadmap'

const data = loadSiteData(root)
const VIRTUAL_ID = 'virtual:site-data'

/**
 * 站点上的链接改写（不影响 GitHub 上的原文链接）：
 * 1. 指向源码的相对链接（如 [hello_llm.py](./hello_llm.py)）→ 跳到 GitHub 源文件
 * 2. ./README.md、./solutions/README.md → 目录地址（配合下方 rewrites，README.md 是目录首页）
 */
function rewriteLinks(md: MarkdownRenderer) {
  const STAY = /\.(md|html?|vue|[ap]?png|jpe?g|gif|svg|webp|avif|ico|woff2?|css|js|mjs|json)$/i
  const defaultOpen =
    md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const href = token.attrGet('href') ?? ''
    if (href.startsWith('.')) {
      const [file, hash = ''] = href.split(/(?=#)/)
      const dir = `${env.relativePath}`.split('/').slice(0, -1).join('/')
      const relative = dir ? `${dir}/${file.replace(/^\.\//, '')}` : file.replace(/^\.\//, '')
      if (/README\.md$/.test(file)) {
        // README.md 的链接改写成站点 URL（不含 base）：
        // 顶层周包 projects/w1-chatbot/README.md → /projects/w1-chatbot/（rewrites 的产物）
        // 嵌套 solutions/README.md → /projects/w1-chatbot/solutions/README
        token.attrSet(
          'href',
          /^projects\/[^/]+\/README\.md$/.test(relative)
            ? `/${relative.slice(0, -'README.md'.length)}${hash}`
            : `/${relative.replace(/\.md$/, '')}${hash}`
        )
      } else if (!STAY.test(file)) {
        token.attrSet('href', `${REPO}/blob/main/${relative}`)
      }
    }
    return defaultOpen(tokens, idx, options, env, self)
  }
}

export default defineConfig({
  lang: 'zh-CN',
  title: 'AI Roadmap',
  description: 'Java 后端 → AI 应用 / Agent 开发：20 周转型路线图、学习包与进度追踪',
  base: '/ai-roadmap/',

  // 以仓库根目录为源目录，只发布 Markdown；代码、虚拟环境、站点配置不进入产物
  srcDir: '.',
  srcExclude: [
    '.git/**',
    '.github/**',
    '.vitepress/**',
    'node_modules/**',
    'package.json',
    'pnpm-lock.yaml',
    '.gitignore',
    '.DS_Store',
    'projects/**/.venv/**',
    'projects/**/node_modules/**',
    'projects/**/__pycache__/**',
    'projects/**/.env*',
    'projects/**/*.{py,toml,lock,example,sh,bat,java,sql,txt,csv,yaml,yml}'
  ],

  cleanUrls: true,
  // 每周学习包的 README.md 映射为目录首页：/projects/w1-chatbot/
  rewrites: {
    'projects/:pkg/README.md': 'projects/:pkg/index.md'
  },
  lastUpdated: true,
  sitemap: { hostname: 'https://shaoxiaofeng03.github.io/ai-roadmap/' },

  // 打卡记录源文件在仓库根目录；构建时复制到 dist，线上以静态 JSON 读取
  buildEnd(siteConfig) {
    const src = path.join(root, 'checkins.json')
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(siteConfig.outDir, 'checkins.json'))
  },

  markdown: {
    config: rewriteLinks
  },

  transformPageData(pageData) {
    if (pageData.relativePath !== 'index.md') return
    const fm = pageData.frontmatter
    const current = data.weeks[data.currentWeek - 1]
    const pkg = current.pkg ?? data.weeks.find((x) => x.pkg)?.pkg ?? '/ROADMAP'

    // 首页主按钮与「学习包」卡片始终指向当前周（当前周读自 PROGRESS.md）
    const action = fm.hero?.actions?.[0]
    if (action) {
      action.text = `开始本周学习（W${data.currentWeek}）`
      action.link = pkg
    }
    const features: any[] = fm.features ?? []
    const byTitle = (t: string) => features.find((f) => f.title === t)
    const pit = byTitle('避坑指南')
    if (pit) pit.link = findAnchor(root, ROADMAP_FILE, '避坑指南')
    const coach = byTitle('陪学机制')
    if (coach) coach.link = findAnchor(root, ROADMAP_FILE, '陪学机制')
    const box = features.find((f) => /^W\d+ 学习包$/.test(f.title))
    if (box) {
      box.title = `W${data.currentWeek} 学习包`
      box.link = pkg
      box.details = `本周主题：${current.title || current.dates}`
    }
  },

  vite: {
    plugins: [
      // 本地开发时读写仓库根目录的 checkins.json，并支持 git push
      checkinsPlugin(root),
      {
        name: 'site-data',
        resolveId: (id) => (id === VIRTUAL_ID ? `\0${VIRTUAL_ID}` : undefined),
        load: (id) => (id === `\0${VIRTUAL_ID}` ? `export default ${JSON.stringify(data)}` : undefined)
      }
    ],
    server: { watch: { ignored: ['**/.venv/**', '**/node_modules/**'] } }
  },

  themeConfig: {
    nav: [
      { text: '路线图', link: '/ROADMAP' },
      { text: '学习进度', link: '/PROGRESS' },
      { text: '视频资源', link: '/RESOURCES-VIDEOS' }
    ],

    sidebar: buildSidebar(root, data),

    outline: { level: [2, 4], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '最后更新' },
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
    langMenuLabel: '切换语言',
    externalLinkIcon: true,

    editLink: {
      pattern: `${REPO}/edit/main/:path`,
      text: '在 GitHub 上编辑此页'
    },

    socialLinks: [{ icon: 'github', link: REPO }],

    footer: {
      message: '个人学习路线图 · 内容随每周学习包持续更新'
    },

    // 本地全文搜索（无需服务端）。默认分词器不切分中文，这里按「单个汉字 / 英文单词」切分
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '没有找到相关内容',
            resetButtonTitle: '清除查询条件',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
          }
        },
        miniSearch: {
          options: {
            tokenize: (text: string) => text.match(/\p{Script=Han}|[\p{L}\p{N}_]+/gu) ?? []
          }
        }
      }
    }
  }
})
