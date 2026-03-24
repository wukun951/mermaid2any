const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink'

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function serializeSvg(svgElement: SVGSVGElement) {
  const clone = svgElement.cloneNode(true) as SVGSVGElement
  const serializer = new XMLSerializer()
  const viewBox = clone.getAttribute('viewBox')
  const width =
    Number.parseFloat(clone.getAttribute('width')?.replace('px', '') ?? '') ||
    svgElement.viewBox.baseVal.width ||
    svgElement.getBoundingClientRect().width ||
    1200
  const height =
    Number.parseFloat(clone.getAttribute('height')?.replace('px', '') ?? '') ||
    svgElement.viewBox.baseVal.height ||
    svgElement.getBoundingClientRect().height ||
    720

  clone.setAttribute('xmlns', SVG_NAMESPACE)
  clone.setAttribute('xmlns:xlink', XLINK_NAMESPACE)
  clone.setAttribute('width', String(Math.ceil(width)))
  clone.setAttribute('height', String(Math.ceil(height)))

  if (!viewBox) {
    clone.setAttribute('viewBox', `0 0 ${Math.ceil(width)} ${Math.ceil(height)}`)
  }

  return serializer.serializeToString(clone)
}

export function downloadSvgFile(svgElement: SVGSVGElement, fileName: string) {
  const markup = serializeSvg(svgElement)
  const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
  triggerDownload(blob, fileName)
}

export async function downloadPngFile(
  svgElement: SVGSVGElement,
  fileName: string,
  scale = 2,
) {
  const markup = serializeSvg(svgElement)
  const { height, width } = svgElement.viewBox.baseVal.height
    ? svgElement.viewBox.baseVal
    : svgElement.getBoundingClientRect()
  const svgBlob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  const image = new Image()
  image.decoding = 'async'

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('PNG 导出失败，请稍后重试。'))
    image.src = svgUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.ceil(width * scale))
  canvas.height = Math.max(1, Math.ceil(height * scale))

  const context = canvas.getContext('2d')
  if (!context) {
    URL.revokeObjectURL(svgUrl)
    throw new Error('当前浏览器不支持 Canvas 导出。')
  }

  context.fillStyle = '#fffaf2'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.scale(scale, scale)
  context.drawImage(image, 0, 0, width, height)
  URL.revokeObjectURL(svgUrl)

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
        return
      }

      reject(new Error('PNG 导出失败，请稍后重试。'))
    }, 'image/png')
  })

  triggerDownload(pngBlob, fileName)
}

export async function copyTextToClipboard(text: string) {
  if (!navigator.clipboard) {
    throw new Error('当前环境不支持剪贴板能力。')
  }

  await navigator.clipboard.writeText(text)
}
