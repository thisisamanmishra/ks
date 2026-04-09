'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import { useCallback, useEffect, useRef, useState } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
]

const HIGHLIGHT_COLORS = [
  '#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa', '#e9d5ff', '#fecaca', '#a5f3fc',
]

const CHART_TYPES = [
  { id: 'bar', icon: '📊', label: 'Bar Chart' },
  { id: 'line', icon: '📈', label: 'Line Chart' },
  { id: 'pie', icon: '🥧', label: 'Pie Chart' },
]

interface ChartData {
  type: 'bar' | 'line' | 'pie'
  title: string
  labels: string
  datasets: { label: string; values: string; color: string }[]
}

const DEFAULT_CHART: ChartData = {
  type: 'bar',
  title: 'Chart Title',
  labels: 'Jan, Feb, Mar, Apr, May, Jun',
  datasets: [{ label: 'Series 1', values: '12, 19, 8, 15, 25, 11', color: '#1B3A6B' }],
}

function ChartCanvas({ data }: { data: ChartData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const labels = data.labels.split(',').map(s => s.trim())
    const datasets = data.datasets.map(ds => ({
      label: ds.label,
      values: ds.values.split(',').map(v => parseFloat(v.trim()) || 0),
      color: ds.color,
    }))

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const W = canvas.width, H = canvas.height
    const pad = { top: 40, right: 20, bottom: 50, left: 50 }
    const chartW = W - pad.left - pad.right
    const chartH = H - pad.top - pad.bottom

    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    // Title
    ctx.fillStyle = '#1B3A6B'
    ctx.font = 'bold 14px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(data.title, W / 2, 22)

    if (data.type === 'pie') {
      // Pie chart
      const allVals = datasets[0]?.values || []
      const total = allVals.reduce((a, b) => a + b, 0)
      const cx = W / 2, cy = H / 2 + 10
      const r = Math.min(chartW, chartH) / 2 - 20
      const pieColors = ['#1B3A6B', '#FF6B35', '#10B981', '#8B5CF6', '#F59E0B', '#3B82F6', '#EF4444']
      let angle = -Math.PI / 2
      allVals.forEach((val, i) => {
        const slice = (val / total) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, r, angle, angle + slice)
        ctx.closePath()
        ctx.fillStyle = pieColors[i % pieColors.length]
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
        // Label
        const midAngle = angle + slice / 2
        const lx = cx + (r * 0.65) * Math.cos(midAngle)
        const ly = cy + (r * 0.65) * Math.sin(midAngle)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 11px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(labels[i] || `${i + 1}`, lx, ly)
        angle += slice
      })
    } else {
      // Bar or Line chart
      const allVals = datasets.flatMap(ds => ds.values)
      const maxVal = Math.max(...allVals, 1)
      const minVal = 0

      // Grid lines
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1
      for (let i = 0; i <= 5; i++) {
        const y = pad.top + chartH - (i / 5) * chartH
        ctx.beginPath()
        ctx.moveTo(pad.left, y)
        ctx.lineTo(pad.left + chartW, y)
        ctx.stroke()
        ctx.fillStyle = '#94a3b8'
        ctx.font = '10px Inter, sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(((maxVal * i) / 5).toFixed(0), pad.left - 5, y + 3)
      }

      // X labels
      const barGroupW = chartW / labels.length
      labels.forEach((lbl, i) => {
        const x = pad.left + i * barGroupW + barGroupW / 2
        ctx.fillStyle = '#64748b'
        ctx.font = '10px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(lbl, x, H - 10)
      })

      if (data.type === 'bar') {
        const barW = (barGroupW * 0.7) / datasets.length
        datasets.forEach((ds, di) => {
          ds.values.forEach((val, i) => {
            const x = pad.left + i * barGroupW + (di * barW) + (barGroupW * 0.15)
            const barH = ((val - minVal) / (maxVal - minVal)) * chartH
            const y = pad.top + chartH - barH

            // Gradient fill
            const grad = ctx.createLinearGradient(x, y, x, y + barH)
            grad.addColorStop(0, ds.color)
            grad.addColorStop(1, ds.color + '88')
            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.roundRect(x, y, barW - 2, barH, [3, 3, 0, 0])
            ctx.fill()
          })
        })
      } else {
        // Line chart
        datasets.forEach(ds => {
          ctx.beginPath()
          ctx.strokeStyle = ds.color
          ctx.lineWidth = 2.5
          ctx.lineJoin = 'round'
          ds.values.forEach((val, i) => {
            const x = pad.left + i * barGroupW + barGroupW / 2
            const y = pad.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          })
          ctx.stroke()

          // Fill area
          ctx.globalAlpha = 0.1
          ds.values.forEach((val, i) => {
            const x = pad.left + i * barGroupW + barGroupW / 2
            const y = pad.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          })
          const lastX = pad.left + (ds.values.length - 1) * barGroupW + barGroupW / 2
          ctx.lineTo(lastX, pad.top + chartH)
          ctx.lineTo(pad.left + barGroupW / 2, pad.top + chartH)
          ctx.closePath()
          ctx.fillStyle = ds.color
          ctx.fill()
          ctx.globalAlpha = 1

          // Dots
          ds.values.forEach((val, i) => {
            const x = pad.left + i * barGroupW + barGroupW / 2
            const y = pad.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH
            ctx.beginPath()
            ctx.arc(x, y, 4, 0, Math.PI * 2)
            ctx.fillStyle = '#fff'
            ctx.fill()
            ctx.strokeStyle = ds.color
            ctx.lineWidth = 2
            ctx.stroke()
          })
        })
      }

      // Legend
      if (datasets.length > 1) {
        let lx = pad.left
        datasets.forEach(ds => {
          ctx.fillStyle = ds.color
          ctx.fillRect(lx, H - 30, 12, 10)
          ctx.fillStyle = '#64748b'
          ctx.font = '10px Inter, sans-serif'
          ctx.textAlign = 'left'
          ctx.fillText(ds.label, lx + 16, H - 22)
          lx += ctx.measureText(ds.label).width + 30
        })
      }
    }
  }, [data])

  return <canvas ref={canvasRef} width={600} height={300} className="w-full rounded-lg border border-slate-200" />
}

export default function RichTextEditor({ content, onChange, placeholder = 'Start writing your blog content...' }: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Chart wizard state
  const [showChartWizard, setShowChartWizard] = useState(false)
  const [chartData, setChartData] = useState<ChartData>({ ...DEFAULT_CHART })

  // Fullscreen + preview
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        horizontalRule: false,
      }),
      Image.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 underline cursor-pointer' } }),
      Highlight.configure({ multicolor: true }),
      Color,
      TextStyle,
      Placeholder.configure({ placeholder }),
      CharacterCount,
      Typography,
      HorizontalRule,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[400px] px-5 py-4',
      },
    },
  })

  // Handle ESC to exit fullscreen
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isFullscreen])

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/blogs/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.url) {
        editor.chain().focus().setImage({ src: data.url }).run()
      } else {
        alert(data.error || 'Upload failed')
      }
    } catch {
      alert('Image upload failed')
    } finally {
      setUploading(false)
    }
  }, [editor])

  const handleImageInsert = useCallback(() => {
    if (!editor || !imageUrl.trim()) return
    editor.chain().focus().setImage({ src: imageUrl.trim() }).run()
    setImageUrl('')
    setShowImageInput(false)
  }, [editor, imageUrl])

  const setLink = useCallback(() => {
    if (!editor) return
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setShowLinkInput(false)
      return
    }
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    setLinkUrl('')
    setShowLinkInput(false)
  }, [editor, linkUrl])

  // Insert chart as image via canvas toDataURL
  const insertChart = useCallback(() => {
    if (!editor) return
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 300
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const labels = chartData.labels.split(',').map(s => s.trim())
    const datasets = chartData.datasets.map(ds => ({
      label: ds.label,
      values: ds.values.split(',').map(v => parseFloat(v.trim()) || 0),
      color: ds.color,
    }))

    const W = 600, H = 300
    const pad = { top: 40, right: 20, bottom: 50, left: 50 }
    const chartW = W - pad.left - pad.right
    const chartH = H - pad.top - pad.bottom

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    ctx.fillStyle = '#1B3A6B'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(chartData.title, W / 2, 22)

    if (chartData.type === 'pie') {
      const allVals = datasets[0]?.values || []
      const total = allVals.reduce((a, b) => a + b, 0)
      const cx = W / 2, cy = H / 2 + 10
      const r = Math.min(chartW, chartH) / 2 - 20
      const pieColors = ['#1B3A6B', '#FF6B35', '#10B981', '#8B5CF6', '#F59E0B', '#3B82F6', '#EF4444']
      let angle = -Math.PI / 2
      allVals.forEach((val, i) => {
        const slice = (val / total) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, r, angle, angle + slice)
        ctx.closePath()
        ctx.fillStyle = pieColors[i % pieColors.length]
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
        const midAngle = angle + slice / 2
        const lx = cx + (r * 0.65) * Math.cos(midAngle)
        const ly = cy + (r * 0.65) * Math.sin(midAngle)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(labels[i] || `${i + 1}`, lx, ly)
        angle += slice
      })
    } else {
      const allVals = datasets.flatMap(ds => ds.values)
      const maxVal = Math.max(...allVals, 1)
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1
      for (let i = 0; i <= 5; i++) {
        const y = pad.top + chartH - (i / 5) * chartH
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke()
        ctx.fillStyle = '#94a3b8'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right'
        ctx.fillText(((maxVal * i) / 5).toFixed(0), pad.left - 5, y + 3)
      }
      const barGroupW = chartW / labels.length
      labels.forEach((lbl, i) => {
        const x = pad.left + i * barGroupW + barGroupW / 2
        ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(lbl, x, H - 10)
      })
      if (chartData.type === 'bar') {
        const barW = (barGroupW * 0.7) / datasets.length
        datasets.forEach((ds, di) => {
          ds.values.forEach((val, i) => {
            const x = pad.left + i * barGroupW + (di * barW) + (barGroupW * 0.15)
            const barH = (val / maxVal) * chartH
            const y = pad.top + chartH - barH
            ctx.fillStyle = ds.color
            ctx.fillRect(x, y, barW - 2, barH)
          })
        })
      } else {
        datasets.forEach(ds => {
          ctx.beginPath(); ctx.strokeStyle = ds.color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'
          ds.values.forEach((val, i) => {
            const x = pad.left + i * barGroupW + barGroupW / 2
            const y = pad.top + chartH - (val / maxVal) * chartH
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          })
          ctx.stroke()
          ds.values.forEach((val, i) => {
            const x = pad.left + i * barGroupW + barGroupW / 2
            const y = pad.top + chartH - (val / maxVal) * chartH
            ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2)
            ctx.fillStyle = '#fff'; ctx.fill()
            ctx.strokeStyle = ds.color; ctx.lineWidth = 2; ctx.stroke()
          })
        })
      }
    }

    const dataUrl = canvas.toDataURL('image/png')
    editor.chain().focus().setImage({ src: dataUrl, alt: chartData.title, title: chartData.title }).run()
    setShowChartWizard(false)
    setChartData({ ...DEFAULT_CHART })
  }, [editor, chartData])

  if (!editor) return null

  const readingTime = Math.ceil(editor.storage.characterCount.words() / 200)

  const ToolButton = ({ onClick, active, title, children, disabled, className = '' }: {
    onClick: () => void; active?: boolean; title: string; children: React.ReactNode; disabled?: boolean; className?: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg text-sm transition-all cursor-pointer disabled:opacity-30 ${
        active ? 'bg-navy text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-navy'
      } ${className}`}
    >
      {children}
    </button>
  )

  const Toolbar = () => (
    <div className="border-b border-slate-200 bg-slate-50/80 px-2 py-1.5 flex flex-wrap gap-0.5 items-center">
      {/* Undo / Redo */}
      <ToolButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">↩</ToolButton>
      <ToolButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">↪</ToolButton>
      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Headings */}
      <select
        onChange={(e) => {
          const val = e.target.value
          if (val === 'p') editor.chain().focus().setParagraph().run()
          else editor.chain().focus().toggleHeading({ level: parseInt(val) as 1|2|3|4|5|6 }).run()
        }}
        value={
          editor.isActive('heading', { level: 1 }) ? '1' :
          editor.isActive('heading', { level: 2 }) ? '2' :
          editor.isActive('heading', { level: 3 }) ? '3' :
          editor.isActive('heading', { level: 4 }) ? '4' :
          editor.isActive('heading', { level: 5 }) ? '5' :
          editor.isActive('heading', { level: 6 }) ? '6' : 'p'
        }
        className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none cursor-pointer"
      >
        <option value="p">Paragraph</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
        <option value="4">Heading 4</option>
        <option value="5">Heading 5</option>
        <option value="6">Heading 6</option>
      </select>
      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Text formatting */}
      <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><b>B</b></ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><i>I</i></ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><u>U</u></ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><s>S</s></ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">{'<>'}</ToolButton>
      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Text Color */}
      <div className="relative">
        <ToolButton onClick={() => { setShowColorPicker(!showColorPicker); setShowHighlightPicker(false) }} title="Text Color">
          <span className="flex flex-col items-center leading-none">
            <span className="text-xs font-bold">A</span>
            <span className="w-4 h-1 rounded-full mt-0.5" style={{ background: editor.getAttributes('textStyle').color || '#000' }} />
          </span>
        </ToolButton>
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-2 grid grid-cols-10 gap-1 w-[220px]">
            {COLORS.map(color => (
              <button key={color} type="button" onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false) }}
                className="w-5 h-5 rounded cursor-pointer border border-slate-200 hover:scale-125 transition-transform"
                style={{ background: color }} title={color} />
            ))}
            <button type="button" onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false) }}
              className="col-span-10 text-xs text-slate-500 hover:text-navy mt-1 cursor-pointer">Remove color</button>
          </div>
        )}
      </div>

      {/* Highlight */}
      <div className="relative">
        <ToolButton onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false) }} active={editor.isActive('highlight')} title="Highlight">
          <span className="px-0.5 bg-yellow-200 rounded text-xs font-bold">H</span>
        </ToolButton>
        {showHighlightPicker && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-2 grid grid-cols-4 gap-1 w-[120px]">
            {HIGHLIGHT_COLORS.map(color => (
              <button key={color} type="button" onClick={() => { editor.chain().focus().toggleHighlight({ color }).run(); setShowHighlightPicker(false) }}
                className="w-6 h-6 rounded cursor-pointer border border-slate-200 hover:scale-125 transition-transform"
                style={{ background: color }} title={color} />
            ))}
            <button type="button" onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false) }}
              className="col-span-4 text-xs text-slate-500 hover:text-navy mt-1 cursor-pointer">Remove</button>
          </div>
        )}
      </div>
      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Alignment */}
      <ToolButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">≡</ToolButton>
      <ToolButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">≡</ToolButton>
      <ToolButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">≡</ToolButton>
      <ToolButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">☰</ToolButton>
      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Lists */}
      <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">•≡</ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">1≡</ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">❝</ToolButton>
      <ToolButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">{'{ }'}</ToolButton>
      <ToolButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">─</ToolButton>
      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Link */}
      <div className="relative">
        <ToolButton onClick={() => {
          if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run()
          } else {
            setShowLinkInput(!showLinkInput)
            setLinkUrl(editor.getAttributes('link').href || '')
          }
        }} active={editor.isActive('link')} title="Link">🔗</ToolButton>
        {showLinkInput && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-3 flex gap-2 w-[320px]">
            <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com"
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-navy"
              onKeyDown={e => e.key === 'Enter' && setLink()} />
            <button type="button" onClick={setLink} className="px-3 py-1.5 text-sm bg-navy text-white rounded-lg cursor-pointer">Set</button>
            <button type="button" onClick={() => setShowLinkInput(false)} className="px-2 py-1.5 text-sm text-slate-500 cursor-pointer">✕</button>
          </div>
        )}
      </div>

      {/* Image */}
      <div className="relative">
        <ToolButton onClick={() => setShowImageInput(!showImageInput)} title="Insert Image">🖼</ToolButton>
        {showImageInput && (
          <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-3 w-[340px] space-y-2">
            <p className="text-xs font-semibold text-slate-700">Insert Image</p>
            <div className="flex gap-2">
              <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL"
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-navy"
                onKeyDown={e => e.key === 'Enter' && handleImageInsert()} />
              <button type="button" onClick={handleImageInsert} className="px-3 py-1.5 text-sm bg-navy text-white rounded-lg cursor-pointer">Add</button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-200" /><span className="text-xs text-slate-400">or</span><div className="flex-1 h-px bg-slate-200" />
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="w-full py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50">
              {uploading ? '⏳ Uploading...' : '📁 Upload from Computer'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) { handleImageUpload(f); setShowImageInput(false) } }} />
            <button type="button" onClick={() => setShowImageInput(false)} className="w-full text-xs text-slate-400 hover:text-slate-600 cursor-pointer">Cancel</button>
          </div>
        )}
      </div>
      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Table */}
      <ToolButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table">▦</ToolButton>
      {editor.isActive('table') && (
        <>
          <ToolButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column">+Col</ToolButton>
          <ToolButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row">+Row</ToolButton>
          <ToolButton onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column">-Col</ToolButton>
          <ToolButton onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row">-Row</ToolButton>
          <ToolButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">✕Tbl</ToolButton>
        </>
      )}
      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Chart */}
      <ToolButton onClick={() => setShowChartWizard(true)} title="Insert Chart/Graph" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
        📊
      </ToolButton>
      <div className="w-px h-6 bg-slate-200 mx-1" />

      {/* Preview + Fullscreen */}
      <ToolButton onClick={() => setIsPreview(v => !v)} active={isPreview} title={isPreview ? 'Exit Preview' : 'Preview Mode'}>
        {isPreview ? '✏️' : '👁️'}
      </ToolButton>
      <ToolButton onClick={() => setIsFullscreen(v => !v)} title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen Mode'}>
        {isFullscreen ? '⊡' : '⛶'}
      </ToolButton>
    </div>
  )

  return (
    <>
      {/* Chart wizard modal */}
      {showChartWizard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-navy text-lg">📊 Insert Chart / Graph</h3>
              <button type="button" onClick={() => setShowChartWizard(false)} className="text-slate-400 hover:text-slate-600 text-xl cursor-pointer">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {/* Chart type */}
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Chart Type</p>
                <div className="flex gap-2">
                  {CHART_TYPES.map(ct => (
                    <button key={ct.id} type="button" onClick={() => setChartData(d => ({ ...d, type: ct.id as 'bar' | 'line' | 'pie' }))}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border-2 ${chartData.type === ct.id ? 'border-navy bg-navy text-white' : 'border-slate-200 text-slate-600 hover:border-navy'}`}>
                      {ct.icon} {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block uppercase tracking-wide">Chart Title</label>
                <input value={chartData.title} onChange={e => setChartData(d => ({ ...d, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy" placeholder="My Chart" />
              </div>

              {/* Labels */}
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block uppercase tracking-wide">
                  {chartData.type === 'pie' ? 'Slice Labels' : 'X-Axis Labels'} <span className="text-slate-400 font-normal">(comma separated)</span>
                </label>
                <input value={chartData.labels} onChange={e => setChartData(d => ({ ...d, labels: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-navy"
                  placeholder="Jan, Feb, Mar, Apr, May, Jun" />
              </div>

              {/* Datasets */}
              {chartData.datasets.map((ds, di) => (
                <div key={di} className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-600">Data Series {di + 1}</p>
                    {di > 0 && (
                      <button type="button" onClick={() => setChartData(d => ({ ...d, datasets: d.datasets.filter((_, i) => i !== di) }))}
                        className="text-red-400 hover:text-red-600 text-xs cursor-pointer">Remove</button>
                    )}
                  </div>
                  <input value={ds.label} onChange={e => setChartData(d => ({ ...d, datasets: d.datasets.map((s, i) => i === di ? { ...s, label: e.target.value } : s) }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none"
                    placeholder="Series name" />
                  <input value={ds.values} onChange={e => setChartData(d => ({ ...d, datasets: d.datasets.map((s, i) => i === di ? { ...s, values: e.target.value } : s) }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none"
                    placeholder="12, 19, 8, 15, 25, 11" />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500">Color:</label>
                    <input type="color" value={ds.color} onChange={e => setChartData(d => ({ ...d, datasets: d.datasets.map((s, i) => i === di ? { ...s, color: e.target.value } : s) }))}
                      className="w-8 h-8 rounded cursor-pointer border border-slate-200" />
                    <span className="text-xs text-slate-500">{ds.color}</span>
                  </div>
                </div>
              ))}

              {chartData.type !== 'pie' && (
                <button type="button" onClick={() => setChartData(d => ({ ...d, datasets: [...d.datasets, { label: `Series ${d.datasets.length + 1}`, values: '5, 10, 15, 8, 12, 18', color: '#FF6B35' }] }))}
                  className="text-sm text-navy font-bold hover:underline cursor-pointer">+ Add Data Series</button>
              )}

              {/* Live Preview */}
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Live Preview</p>
                <ChartCanvas data={chartData} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={insertChart}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm cursor-pointer hover:opacity-90" style={{ background: '#1B3A6B' }}>
                  📊 Insert Chart into Blog
                </button>
                <button type="button" onClick={() => setShowChartWizard(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer hover:bg-slate-200">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close dropdowns on click outside */}
      {(showColorPicker || showHighlightPicker || showLinkInput || showImageInput) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowColorPicker(false); setShowHighlightPicker(false); setShowLinkInput(false); setShowImageInput(false) }} />
      )}

      {/* Editor wrapper — fullscreen or normal */}
      <div
        ref={containerRef}
        className={`border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none flex flex-col' : ''
        }`}
      >
        <Toolbar />

        {isPreview ? (
          /* Preview mode */
          <div className={`${isFullscreen ? 'flex-1 overflow-y-auto' : ''}`}>
            <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
              <span className="text-amber-600 text-xs font-bold">👁️ PREVIEW MODE</span>
              <span className="text-amber-500 text-xs">— This is how your blog will appear. Click ✏️ to resume editing.</span>
            </div>
            <div
              className="prose prose-sm sm:prose lg:prose-lg max-w-none px-8 py-6"
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
          </div>
        ) : (
          <div className={`${isFullscreen ? 'flex-1 overflow-y-auto' : ''}`}>
            <EditorContent editor={editor} />
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 px-4 py-2 flex justify-between items-center text-xs text-slate-400 bg-slate-50/50">
          <span>
            {editor.storage.characterCount.characters().toLocaleString()} chars ·{' '}
            {editor.storage.characterCount.words().toLocaleString()} words ·{' '}
            <span className="text-navy font-semibold">~{readingTime} min read</span>
          </span>
          <div className="flex items-center gap-3">
            {isPreview && <span className="text-amber-500 font-semibold">Preview</span>}
            {isFullscreen && <span className="text-navy font-semibold">Fullscreen · Press Esc to exit</span>}
            <span className="text-slate-300">Rich Text Editor</span>
          </div>
        </div>
      </div>

      {/* Editor styles */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 400px;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #94a3b8;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .ProseMirror img.ProseMirror-selectednode {
          outline: 3px solid #1B3A6B;
          border-radius: 8px;
        }
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        .ProseMirror table td,
        .ProseMirror table th {
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          min-width: 80px;
          vertical-align: top;
        }
        .ProseMirror table th {
          background: #f1f5f9;
          font-weight: 600;
          color: #1B3A6B;
        }
        .ProseMirror table .selectedCell {
          background: #dbeafe;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #FF6B35;
          padding-left: 1rem;
          color: #64748b;
          margin: 1rem 0;
          font-style: italic;
        }
        .ProseMirror pre {
          background: #1e293b;
          color: #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.875rem;
          overflow-x: auto;
        }
        .ProseMirror code {
          background: #f1f5f9;
          color: #e11d48;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.875em;
        }
        .ProseMirror pre code {
          background: none;
          color: inherit;
          padding: 0;
        }
        .ProseMirror hr {
          border: none;
          border-top: 2px solid #e2e8f0;
          margin: 1.5rem 0;
        }
        .ProseMirror h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0; color: #1B3A6B; }
        .ProseMirror h2 { font-size: 1.5em; font-weight: 600; margin: 0.5em 0; color: #1B3A6B; }
        .ProseMirror h3 { font-size: 1.25em; font-weight: 600; margin: 0.5em 0; color: #334155; }
        .ProseMirror h4 { font-size: 1.1em; font-weight: 600; margin: 0.5em 0; color: #334155; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; margin: 0.5rem 0; }
        .ProseMirror ul { list-style-type: disc; }
        .ProseMirror ol { list-style-type: decimal; }
        .ProseMirror li { margin: 0.25rem 0; }
        .ProseMirror a { color: #2563eb; text-decoration: underline; }
        .ProseMirror p { margin: 0.5rem 0; }
        .prose img { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; }
        .prose table { border-collapse: collapse; width: 100%; }
        .prose table td, .prose table th { border: 1px solid #e2e8f0; padding: 8px 12px; }
        .prose table th { background: #f1f5f9; font-weight: 600; }
        .prose blockquote { border-left: 3px solid #FF6B35; padding-left: 1rem; color: #64748b; font-style: italic; }
        .prose pre { background: #1e293b; color: #e2e8f0; border-radius: 8px; padding: 1rem; }
        .prose code { background: #f1f5f9; color: #e11d48; padding: 2px 6px; border-radius: 4px; font-size: 0.875em; }
      `}</style>
    </>
  )
}
