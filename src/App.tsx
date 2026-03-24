import { useEffect, useEffectEvent, useRef, useState } from 'react'
import './App.css'
import {
  DEFAULT_TEMPLATE_ID,
  diagramTemplates,
  editorThemes,
  type GraphThemeValue,
  graphThemes,
} from './data/templates'
import {
  copyTextToClipboard,
  downloadPngFile,
  downloadSvgFile,
} from './lib/download'
import {
  extractGraphKind,
  formatMermaidError,
  renderMermaidDiagram,
} from './lib/mermaid'

type RenderState = 'idle' | 'rendering' | 'ready' | 'error'

const STORAGE_KEYS = {
  autoRender: 'mermaid-renderer:auto-render',
  editorTheme: 'mermaid-renderer:editor-theme',
  graphTheme: 'mermaid-renderer:graph-theme',
  source: 'mermaid-renderer:source',
}

function loadStoredValue(key: string) {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(key)
}

function App() {
  const defaultTemplate =
    diagramTemplates.find((template) => template.id === DEFAULT_TEMPLATE_ID) ??
    diagramTemplates[0]

  const [source, setSource] = useState(
    () => loadStoredValue(STORAGE_KEYS.source) ?? defaultTemplate.code,
  )
  const [graphTheme, setGraphTheme] = useState(
    () =>
      (loadStoredValue(STORAGE_KEYS.graphTheme) as GraphThemeValue | null) ??
      graphThemes[0].value,
  )
  const [editorTheme, setEditorTheme] = useState(
    () => loadStoredValue(STORAGE_KEYS.editorTheme) ?? editorThemes[0].value,
  )
  const [autoRender, setAutoRender] = useState(
    () => loadStoredValue(STORAGE_KEYS.autoRender) !== 'false',
  )
  const [activeTemplateId, setActiveTemplateId] = useState(defaultTemplate.id)
  const [renderState, setRenderState] = useState<RenderState>('idle')
  const [renderedSvg, setRenderedSvg] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('MVP scaffold ready')
  const [lastRenderedAt, setLastRenderedAt] = useState('')
  const [zoom, setZoom] = useState(1)
  const [editorScrollTop, setEditorScrollTop] = useState(0)

  const renderSequenceRef = useRef(0)
  const previewViewportRef = useRef<HTMLDivElement | null>(null)
  const previewCanvasRef = useRef<HTMLDivElement | null>(null)

  const lineCount = source.split('\n').length
  const graphKind = extractGraphKind(source)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.source, source)
  }, [source])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.graphTheme, graphTheme)
  }, [graphTheme])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.editorTheme, editorTheme)
  }, [editorTheme])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.autoRender, String(autoRender))
  }, [autoRender])

  useEffect(() => {
    if (!previewCanvasRef.current) {
      return
    }

    previewCanvasRef.current.innerHTML = renderedSvg
  }, [renderedSvg])

  useEffect(() => {
    if (!statusMessage) {
      return
    }

    const timeout = window.setTimeout(() => {
      setStatusMessage('')
    }, 2800)

    return () => window.clearTimeout(timeout)
  }, [statusMessage])

  async function renderDiagramNow() {
    const trimmedSource = source.trim()

    if (!trimmedSource) {
      setRenderedSvg('')
      setErrorMessage('请输入 Mermaid 源码后再开始渲染。')
      setRenderState('idle')
      return
    }

    const sequence = renderSequenceRef.current + 1
    renderSequenceRef.current = sequence
    setRenderState('rendering')
    setErrorMessage(null)

    try {
      const { svg } = await renderMermaidDiagram(
        trimmedSource,
        graphTheme,
        `mermaid-preview-${sequence}`,
      )

      if (sequence !== renderSequenceRef.current) {
        return
      }

      setRenderedSvg(svg)
      setRenderState('ready')
      setLastRenderedAt(
        new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      )
    } catch (error) {
      if (sequence !== renderSequenceRef.current) {
        return
      }

      setRenderState('error')
      setErrorMessage(formatMermaidError(error))
    }
  }

  const scheduleAutoRender = useEffectEvent(() => {
    void renderDiagramNow()
  })

  useEffect(() => {
    if (!autoRender) {
      return
    }

    const timeout = window.setTimeout(() => {
      scheduleAutoRender()
    }, 400)

    return () => window.clearTimeout(timeout)
  }, [autoRender, graphTheme, source])

  function updateSource(nextSource: string) {
    setSource(nextSource)
  }

  function handleTemplateSelect(templateId: string) {
    const template = diagramTemplates.find((item) => item.id === templateId)

    if (!template) {
      return
    }

    setActiveTemplateId(template.id)
    setSource(template.code)
    setStatusMessage(`已载入模板：${template.title}`)
  }

  function adjustZoom(nextZoom: number) {
    const clamped = Math.min(2.5, Math.max(0.4, nextZoom))
    setZoom(Number(clamped.toFixed(2)))
  }

  function getSvgElement() {
    return previewCanvasRef.current?.querySelector('svg') ?? null
  }

  function getSvgNaturalSize(svg: SVGSVGElement) {
    const viewBox = svg.viewBox.baseVal
    const width =
      viewBox?.width ||
      Number.parseFloat(svg.getAttribute('width')?.replace('px', '') ?? '') ||
      svg.getBoundingClientRect().width
    const height =
      viewBox?.height ||
      Number.parseFloat(svg.getAttribute('height')?.replace('px', '') ?? '') ||
      svg.getBoundingClientRect().height

    return { height, width }
  }

  function fitToViewport(mode: 'page' | 'width') {
    const svg = getSvgElement()
    const viewport = previewViewportRef.current

    if (!svg || !viewport) {
      return
    }

    const { height, width } = getSvgNaturalSize(svg)
    if (!width || !height) {
      return
    }

    const widthScale = (viewport.clientWidth - 48) / width
    const heightScale = (viewport.clientHeight - 48) / height
    const nextZoom = mode === 'width' ? widthScale : Math.min(widthScale, heightScale)

    adjustZoom(nextZoom)
  }

  async function handleDownloadSvg() {
    const svg = getSvgElement()

    if (!svg) {
      setStatusMessage('当前没有可导出的预览结果')
      return
    }

    downloadSvgFile(svg, 'mermaid-diagram.svg')
    setStatusMessage('SVG 已开始下载')
  }

  async function handleDownloadPng() {
    const svg = getSvgElement()

    if (!svg) {
      setStatusMessage('当前没有可导出的预览结果')
      return
    }

    try {
      await downloadPngFile(svg, 'mermaid-diagram.png')
      setStatusMessage('PNG 已开始下载')
    } catch (error) {
      setStatusMessage(formatMermaidError(error))
    }
  }

  async function handleCopySvg() {
    const svg = getSvgElement()

    if (!svg) {
      setStatusMessage('当前没有可复制的 SVG')
      return
    }

    await copyTextToClipboard(svg.outerHTML)
    setStatusMessage('SVG 源码已复制')
  }

  async function handleCopySource() {
    await copyTextToClipboard(source)
    setStatusMessage('Mermaid 源码已复制')
  }

  function handleEditorKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Tab') {
      return
    }

    event.preventDefault()
    const textarea = event.currentTarget
    const { selectionEnd, selectionStart, value } = textarea
    const nextValue = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`
    updateSource(nextValue)

    requestAnimationFrame(() => {
      textarea.selectionStart = selectionStart + 2
      textarea.selectionEnd = selectionStart + 2
    })
  }

  return (
    <div className={`app theme-${editorTheme}`}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Mermaid Renderer MVP</p>
          <h1>把 Mermaid 源码快速变成稳定可导出的流程图</h1>
        </div>
        <div className="toolbar">
          <button className="ghost-button" onClick={() => void renderDiagramNow()}>
            立即渲染
          </button>
          <button className="primary-button" onClick={handleDownloadSvg}>
            导出 SVG
          </button>
          <button className="ghost-button" onClick={handleDownloadPng}>
            导出 PNG
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="control-panel card">
          <section className="panel-block">
            <div className="section-heading">
              <h2>模板启动</h2>
              <span>{diagramTemplates.length} 个样例</span>
            </div>
            <div className="template-list">
              {diagramTemplates.map((template) => (
                <button
                  key={template.id}
                  className={template.id === activeTemplateId ? 'template active' : 'template'}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <strong>{template.title}</strong>
                  <span>{template.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel-block">
            <div className="section-heading">
              <h2>视图设置</h2>
              <span>本地自动保存</span>
            </div>
            <label className="field">
              图表主题
              <select
                value={graphTheme}
                onChange={(event) =>
                  setGraphTheme(event.target.value as GraphThemeValue)
                }
              >
                {graphThemes.map((theme) => (
                  <option key={theme.value} value={theme.value}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              编辑器主题
              <select
                value={editorTheme}
                onChange={(event) => setEditorTheme(event.target.value)}
              >
                {editorThemes.map((theme) => (
                  <option key={theme.value} value={theme.value}>
                    {theme.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="toggle">
              <input
                checked={autoRender}
                type="checkbox"
                onChange={(event) => setAutoRender(event.target.checked)}
              />
              <span>自动渲染（输入停止 400ms 后刷新）</span>
            </label>
          </section>

          <section className="panel-block">
            <div className="section-heading">
              <h2>快速操作</h2>
              <span>常用输出</span>
            </div>
            <div className="action-grid">
              <button className="ghost-button" onClick={handleCopySource}>
                复制源码
              </button>
              <button className="ghost-button" onClick={() => void handleCopySvg()}>
                复制 SVG
              </button>
              <button className="ghost-button" onClick={() => fitToViewport('width')}>
                适应宽度
              </button>
              <button className="ghost-button" onClick={() => fitToViewport('page')}>
                适应页面
              </button>
            </div>
          </section>
        </aside>

        <section className="editor-panel card">
          <div className="section-heading">
            <div>
              <h2>Mermaid 编辑器</h2>
              <p>支持 Tab 缩进，草稿会自动恢复。</p>
            </div>
            <span>{lineCount} 行</span>
          </div>

          <div className="editor-shell">
            <div className="line-gutter" aria-hidden="true">
              <div
                className="line-gutter-inner"
                style={{ transform: `translateY(-${editorScrollTop}px)` }}
              >
                {Array.from({ length: lineCount }, (_, index) => (
                  <span key={index + 1}>{index + 1}</span>
                ))}
              </div>
            </div>
            <textarea
              className="code-editor"
              spellCheck={false}
              value={source}
              onChange={(event) => updateSource(event.target.value)}
              onKeyDown={handleEditorKeyDown}
              onScroll={(event) => setEditorScrollTop(event.currentTarget.scrollTop)}
            />
          </div>

          <div className="editor-hint">
            <span>推荐先用模板修改，再逐步扩展节点和连线。</span>
            <span>当前识别图类型：{graphKind}</span>
          </div>
        </section>

        <section className="preview-panel card">
          <div className="section-heading">
            <div>
              <h2>实时预览</h2>
              <p>错误时保留上一次成功渲染结果，避免预览白屏。</p>
            </div>
            <div className="zoom-controls">
              <button className="zoom-button" onClick={() => adjustZoom(zoom - 0.1)}>
                -
              </button>
              <button className="zoom-badge" onClick={() => adjustZoom(1)}>
                {Math.round(zoom * 100)}%
              </button>
              <button className="zoom-button" onClick={() => adjustZoom(zoom + 0.1)}>
                +
              </button>
            </div>
          </div>

          {errorMessage ? (
            <div className="error-banner" role="alert">
              <strong>渲染未更新</strong>
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <div className="preview-viewport" ref={previewViewportRef}>
            <div className="preview-stage" style={{ transform: `scale(${zoom})` }}>
              <div ref={previewCanvasRef} />
              {!renderedSvg ? (
                <div className="empty-state">
                  <strong>等待首张图表</strong>
                  <span>从左侧模板开始，或者直接粘贴 Mermaid 源码。</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="status-strip">
            <span>状态：{renderState}</span>
            <span>图类型：{graphKind}</span>
            <span>最后渲染：{lastRenderedAt || '尚未成功渲染'}</span>
            <span>{statusMessage || '系统稳定运行中'}</span>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
