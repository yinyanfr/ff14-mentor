import {
  dutyById,
  getDutyName,
  getDutyTags,
  type DutyTag,
} from '../data/duties'
import QRCode from 'qrcode'

import { getJobIconPath, getJobName } from '../data/jobs'
import type { DutyRecord, DutyType, Job, Locale } from '../types'
import { buildTypeStats, countCompletedRecords } from './stats'

const MIN_CANVAS_WIDTH = 720
const CANVAS_PADDING_X = 56
const GRID_TOP = 210
const GRID_GAP = 14
const CARD_SIZE = 300
const CHART_GAP = 32
const FOOTER_HEIGHT = 150
const SHARE_APP_URL = 'https://ff14-mentor.web.app/'
const chartColors = [
  '#7066e8',
  '#26a69a',
  '#e3a44b',
  '#dc6a86',
  '#5596d8',
  '#9c6bd6',
  '#78909c',
  '#c58b38',
]
const FONT_FAMILY =
  '"PingFang SC", "Hiragino Sans", "Noto Sans CJK SC", Arial, sans-serif'

interface ShareImageLabels {
  title: string
  date: string
  count: (count: number) => string
  categories: string
  incomplete: string
  joinedInProgress: string
  noJob: string
  dutyType: (type: DutyType) => string
  dutyTag: (tag: DutyTag) => string
}

interface ShareImageOptions {
  records: readonly DutyRecord[]
  locale: Locale
  labels: ShareImageLabels
  filename: string
}

export function calculateShareGrid(count: number) {
  if (count <= 0) return { columns: 0, rows: 0 }
  const columns = Math.floor(Math.sqrt(count))
  return { columns, rows: Math.ceil(count / columns) }
}

export function calculateShareLayout(count: number, categoryCount = 1) {
  const { columns, rows } = calculateShareGrid(count)
  if (!columns || !rows) {
    return {
      columns,
      rows,
      canvasWidth: 0,
      canvasHeight: 0,
      cardWidth: 0,
      cardHeight: 0,
      gap: 0,
      paddingX: 0,
      gridTop: 0,
      chartTop: 0,
      chartHeight: 0,
      legendColumns: 0,
      footerTop: 0,
    }
  }

  const cardWidth = CARD_SIZE
  const gridWidth = cardWidth * columns + GRID_GAP * (columns - 1)
  const canvasWidth = Math.max(
    MIN_CANVAS_WIDTH,
    gridWidth + CANVAS_PADDING_X * 2,
  )
  const paddingX = (canvasWidth - gridWidth) / 2
  const chartTop =
    GRID_TOP + CARD_SIZE * rows + GRID_GAP * (rows - 1) + CHART_GAP
  const legendColumns = Math.min(
    4,
    Math.max(2, Math.floor((canvasWidth - CANVAS_PADDING_X * 2) / 230)),
  )
  const chartHeight = 112 + Math.ceil(categoryCount / legendColumns) * 30
  const footerTop = chartTop + chartHeight + 22
  const canvasHeight = footerTop + FOOTER_HEIGHT

  return {
    columns,
    rows,
    canvasWidth,
    canvasHeight,
    cardWidth,
    cardHeight: CARD_SIZE,
    gap: GRID_GAP,
    paddingX,
    gridTop: GRID_TOP,
    chartTop,
    chartHeight,
    legendColumns,
    footerTop,
  }
}

type ShareBadgeTone =
  | 'neutral'
  | 'primary'
  | 'mainScenario'
  | 'crystalTower'
  | 'guildhest'
  | 'currentVersion'
  | 'incomplete'
  | 'joinedInProgress'

interface ShareBadge {
  text: string
  tone: ShareBadgeTone
}

const badgeColors: Record<
  ShareBadgeTone,
  { foreground: string; background: string }
> = {
  neutral: { foreground: '#686377', background: '#efedf5' },
  primary: { foreground: '#584dd5', background: '#eeecff' },
  mainScenario: { foreground: '#9a5a14', background: '#fff0d8' },
  crystalTower: { foreground: '#2b7895', background: '#e3f4fa' },
  guildhest: { foreground: '#4f7e42', background: '#e9f5e5' },
  currentVersion: { foreground: '#8b3f7f', background: '#f8e5f5' },
  incomplete: { foreground: '#a56116', background: '#fff1dc' },
  joinedInProgress: { foreground: '#287d72', background: '#e1f5f1' },
}

export function getShareRecordBadges(
  record: DutyRecord,
  locale: Locale,
  labels: ShareImageLabels,
): ShareBadge[] {
  const duty = dutyById.get(record.dutyId)
  return [
    ...(duty
      ? [
          { text: `Lv ${duty.level.required}`, tone: 'neutral' as const },
          ...(duty.type === 'guildhest'
            ? []
            : [
                {
                  text: labels.dutyType(duty.type),
                  tone: 'primary' as const,
                },
              ]),
          ...getDutyTags(record.dutyId).map((tag) => ({
            text: labels.dutyTag(tag),
            tone: tag,
          })),
        ]
      : []),
    {
      text: record.job ? getJobName(record.job, locale) : labels.noJob,
      tone: 'neutral',
    },
    ...(record.incomplete
      ? [{ text: labels.incomplete, tone: 'incomplete' as const }]
      : []),
    ...(record.joinedInProgress
      ? [
          {
            text: labels.joinedInProgress,
            tone: 'joinedInProgress' as const,
          },
        ]
      : []),
  ]
}

export function getShareCategoryStats(
  records: readonly DutyRecord[],
  labels: ShareImageLabels,
) {
  return buildTypeStats([...records])
    .map((item, index) => ({
      ...item,
      name:
        item.type === 'mainScenario'
          ? labels.dutyTag('mainScenario')
          : labels.dutyType(item.type),
      color: chartColors[index],
    }))
    .filter((item) => item.count > 0)
}

export function getShareSummary(
  records: readonly DutyRecord[],
  labels: ShareImageLabels,
) {
  return {
    countLabel: labels.count(countCompletedRecords([...records])),
    categories: getShareCategoryStats(records, labels),
  }
}

function setFont(
  context: CanvasRenderingContext2D,
  weight: number,
  size: number,
) {
  context.font = `${weight} ${size}px ${FONT_FAMILY}`
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.arcTo(x + width, y, x + width, y + height, safeRadius)
  context.arcTo(x + width, y + height, x, y + height, safeRadius)
  context.arcTo(x, y + height, x, y, safeRadius)
  context.arcTo(x, y, x + width, y, safeRadius)
  context.closePath()
}

function fitText(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
) {
  if (context.measureText(value).width <= maxWidth) return value
  const characters = Array.from(value)
  while (
    characters.length > 1 &&
    context.measureText(`${characters.join('')}…`).width > maxWidth
  ) {
    characters.pop()
  }
  return `${characters.join('')}…`
}

export function wrapShareTitle(
  value: string,
  maxWidth: number,
  measureText: (text: string) => number,
) {
  const characters = Array.from(value)
  const lines: string[] = []
  let line = ''

  for (const character of characters) {
    if (line && measureText(line + character) > maxWidth) {
      lines.push(line)
      line = character
    } else {
      line += character
    }
  }
  if (line) lines.push(line)

  return lines
}

export function layoutShareTitle(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
) {
  for (let fontSize = 18; fontSize >= 10; fontSize -= 1) {
    setFont(context, 750, fontSize)
    const lines = wrapShareTitle(
      value,
      maxWidth,
      (text) => context.measureText(text).width,
    )
    if (lines.length <= 2 || fontSize === 10) {
      return { lines, fontSize, lineHeight: fontSize + 3 }
    }
  }

  throw new Error('Could not lay out share title')
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = source
  })
}

async function loadJobIcons(records: readonly DutyRecord[]) {
  const jobs = [
    ...new Set(
      records
        .map((record) => record.job)
        .filter((job): job is Job => job !== null),
    ),
  ]
  const entries = await Promise.all(
    jobs.map(
      async (job) => [job, await loadImage(getJobIconPath(job))] as const,
    ),
  )
  return new Map<Job, HTMLImageElement | null>(entries)
}

function drawBadge(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  foreground: string,
  background: string,
) {
  setFont(context, 700, fontSize)
  const fitted = fitText(context, text, maxWidth - 16)
  const width = Math.min(maxWidth, context.measureText(fitted).width + 16)
  roundedRect(context, x, y, width, fontSize + 12, (fontSize + 12) / 2)
  context.fillStyle = background
  context.fill()
  context.fillStyle = foreground
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(fitted, x + width / 2, y + (fontSize + 12) / 2)
  return width
}

function layoutBadgeRows(
  context: CanvasRenderingContext2D,
  badges: readonly ShareBadge[],
  maxWidth: number,
  fontSize: number,
) {
  const gap = 3
  const rows: { badge: ShareBadge; width: number }[][] = [[]]
  let rowWidth = 0

  badges.forEach((badge) => {
    setFont(context, 700, fontSize)
    const width = Math.min(maxWidth, context.measureText(badge.text).width + 16)
    if (rowWidth && rowWidth + gap + width > maxWidth) {
      rows.push([])
      rowWidth = 0
    }
    rows[rows.length - 1].push({ badge, width })
    rowWidth += (rowWidth ? gap : 0) + width
  })

  return rows
}

function drawBadgeRows(
  context: CanvasRenderingContext2D,
  rows: ReturnType<typeof layoutBadgeRows>,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
) {
  const gap = 3
  const badgeHeight = fontSize + 12

  rows.forEach((row, rowIndex) => {
    const width =
      row.reduce((sum, item) => sum + item.width, 0) + gap * (row.length - 1)
    let cursorX = x + (maxWidth - width) / 2
    row.forEach(({ badge, width: badgeWidth }) => {
      const colors = badgeColors[badge.tone]
      drawBadge(
        context,
        badge.text,
        cursorX,
        y + rowIndex * (badgeHeight + gap),
        badgeWidth,
        fontSize,
        colors.foreground,
        colors.background,
      )
      cursorX += badgeWidth + gap
    })
  })
}

async function canvasToBlob(canvas: HTMLCanvasElement) {
  if (!canvas.toBlob) {
    return fetch(canvas.toDataURL('image/png')).then((response) =>
      response.blob(),
    )
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Could not create share image'))
    }, 'image/png')
  })
}

export async function createTodayShareImage({
  records,
  locale,
  labels,
}: Omit<ShareImageOptions, 'filename'>) {
  if (!records.length) throw new Error('No records to share')
  await document.fonts?.ready

  const sortedRecords = [...records].sort(
    (left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt),
  )
  const { countLabel, categories } = getShareSummary(sortedRecords, labels)
  const layout = calculateShareLayout(sortedRecords.length, categories.length)
  const qrCode = await loadImage(
    await QRCode.toDataURL(SHARE_APP_URL, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 116,
    }),
  )
  if (!qrCode) throw new Error('Could not create QR code')
  const canvas = document.createElement('canvas')
  canvas.width = layout.canvasWidth
  canvas.height = layout.canvasHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable')

  const background = context.createLinearGradient(
    0,
    0,
    layout.canvasWidth,
    layout.canvasHeight,
  )
  background.addColorStop(0, '#f4f2ff')
  background.addColorStop(0.5, '#f8f7fc')
  background.addColorStop(1, '#e8f6f4')
  context.fillStyle = background
  context.fillRect(0, 0, layout.canvasWidth, layout.canvasHeight)

  context.fillStyle = '#7066e8'
  roundedRect(context, CANVAS_PADDING_X, 48, 116, 10, 5)
  context.fill()
  context.fillStyle = '#252236'
  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'
  setFont(context, 800, 54)
  const availableTitleWidth =
    layout.canvasWidth -
    CANVAS_PADDING_X * 2 -
    context.measureText(countLabel).width -
    24
  let titleSize = 44
  setFont(context, 800, titleSize)
  while (
    context.measureText(labels.title).width > availableTitleWidth &&
    titleSize > 28
  ) {
    titleSize -= 2
    setFont(context, 800, titleSize)
  }
  context.fillText(
    fitText(context, labels.title, availableTitleWidth),
    CANVAS_PADDING_X,
    126,
  )
  context.fillStyle = '#69647c'
  setFont(context, 600, 23)
  context.fillText(labels.date, CANVAS_PADDING_X, 168)
  context.textAlign = 'right'
  context.fillStyle = '#7066e8'
  setFont(context, 800, 54)
  context.fillText(countLabel, layout.canvasWidth - CANVAS_PADDING_X, 132)

  const icons = await loadJobIcons(sortedRecords)
  const cardRadius = 18
  const cardPadding = 16
  const smallFont = 12
  const badgeFont = 10
  const iconSize = 60

  sortedRecords.forEach((record, index) => {
    const column = index % layout.columns
    const row = Math.floor(index / layout.columns)
    const x = layout.paddingX + column * (layout.cardWidth + layout.gap)
    const y = layout.gridTop + row * (layout.cardHeight + layout.gap)
    const duty = dutyById.get(record.dutyId)
    const dutyName = duty ? getDutyName(duty, locale) : `#${record.dutyId}`

    context.save()
    context.shadowColor = 'rgba(48, 42, 78, 0.09)'
    context.shadowBlur = 16
    context.shadowOffsetY = 6
    roundedRect(context, x, y, layout.cardWidth, layout.cardHeight, cardRadius)
    context.fillStyle = 'rgba(255, 255, 255, 0.92)'
    context.fill()
    context.restore()

    context.fillStyle = '#8b86a0'
    context.textBaseline = 'top'
    context.textAlign = 'left'
    setFont(context, 700, smallFont)
    context.fillText(`#${index + 1}`, x + cardPadding, y + cardPadding)
    context.textAlign = 'right'
    setFont(context, 650, smallFont)
    context.fillText(
      new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(record.occurredAt)),
      x + layout.cardWidth - cardPadding,
      y + cardPadding,
    )

    context.fillStyle = '#252236'
    context.textAlign = 'center'
    context.textBaseline = 'top'
    const title = layoutShareTitle(
      context,
      dutyName,
      layout.cardWidth - cardPadding * 2,
    )
    const badgeRows = layoutBadgeRows(
      context,
      getShareRecordBadges(record, locale, labels),
      layout.cardWidth - cardPadding * 2,
      badgeFont,
    )
    const badgeHeight =
      badgeRows.length * (badgeFont + 12) + (badgeRows.length - 1) * 3
    const contentHeight =
      iconSize + 14 + title.lines.length * title.lineHeight + 8 + badgeHeight
    const iconX = x + (layout.cardWidth - iconSize) / 2
    const iconY = y + Math.max(28, (layout.cardHeight - contentHeight) / 2)
    if (record.job && icons.get(record.job)) {
      context.drawImage(
        icons.get(record.job)!,
        iconX,
        iconY,
        iconSize,
        iconSize,
      )
    } else {
      context.fillStyle = '#eeeef5'
      roundedRect(context, iconX, iconY, iconSize, iconSize, iconSize / 2)
      context.fill()
      context.fillStyle = '#9691a8'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      setFont(context, 800, Math.max(11, iconSize * 0.32))
      context.fillText('—', iconX + iconSize / 2, iconY + iconSize / 2)
    }

    context.fillStyle = '#252236'
    context.textAlign = 'center'
    context.textBaseline = 'top'
    setFont(context, 750, title.fontSize)
    const nameY = iconY + iconSize + 14
    title.lines.forEach((line, lineIndex) => {
      context.fillText(
        line,
        x + layout.cardWidth / 2,
        nameY + lineIndex * title.lineHeight,
      )
    })

    drawBadgeRows(
      context,
      badgeRows,
      x + cardPadding,
      nameY + title.lines.length * title.lineHeight + 8,
      layout.cardWidth - cardPadding * 2,
      badgeFont,
    )
  })

  const chartX = CANVAS_PADDING_X
  const chartWidth = layout.canvasWidth - chartX * 2
  roundedRect(
    context,
    chartX,
    layout.chartTop,
    chartWidth,
    layout.chartHeight,
    18,
  )
  context.fillStyle = 'rgba(255, 255, 255, 0.92)'
  context.fill()

  context.fillStyle = '#252236'
  context.textAlign = 'left'
  context.textBaseline = 'top'
  setFont(context, 750, 20)
  context.fillText(labels.categories, chartX + 22, layout.chartTop + 20)

  const barX = chartX + 22
  const barY = layout.chartTop + 58
  const barWidth = chartWidth - 44
  const total = categories.reduce((sum, item) => sum + item.count, 0)
  context.save()
  roundedRect(context, barX, barY, barWidth, 24, 12)
  context.clip()
  context.fillStyle = '#efedf5'
  context.fillRect(barX, barY, barWidth, 24)
  let barOffset = 0
  categories.forEach((item) => {
    const segmentWidth = total ? (barWidth * item.count) / total : 0
    context.fillStyle = item.color
    context.fillRect(barX + barOffset, barY, segmentWidth, 24)
    barOffset += segmentWidth
  })
  context.restore()

  const legendWidth = barWidth / layout.legendColumns
  categories.forEach((item, index) => {
    const legendX = barX + (index % layout.legendColumns) * legendWidth
    const legendY =
      layout.chartTop + 100 + Math.floor(index / layout.legendColumns) * 30
    context.fillStyle = item.color
    roundedRect(context, legendX, legendY + 3, 10, 10, 5)
    context.fill()
    context.fillStyle = '#514d62'
    context.textAlign = 'left'
    setFont(context, 600, 13)
    context.fillText(
      fitText(context, item.name, legendWidth - 65),
      legendX + 18,
      legendY,
    )
    context.textAlign = 'right'
    setFont(context, 750, 13)
    context.fillText(
      item.count.toLocaleString(locale),
      legendX + legendWidth - 14,
      legendY,
    )
  })

  const qrSize = 126
  const qrX = layout.canvasWidth - CANVAS_PADDING_X - qrSize
  const qrY = layout.footerTop + 10
  roundedRect(context, qrX, qrY, qrSize, qrSize, 12)
  context.fillStyle = '#ffffff'
  context.fill()
  context.drawImage(qrCode, qrX + 5, qrY + 5, 116, 116)

  context.fillStyle = '#686377'
  context.textAlign = 'left'
  context.textBaseline = 'top'
  setFont(context, 750, 17)
  context.fillText(
    'FF14 MENTOR ROULETTE LOG',
    CANVAS_PADDING_X,
    layout.footerTop + 45,
  )
  setFont(context, 600, 18)
  context.fillText(SHARE_APP_URL, CANVAS_PADDING_X, layout.footerTop + 77)

  return canvasToBlob(canvas)
}

export async function downloadTodayShareImage(options: ShareImageOptions) {
  const blob = await createTodayShareImage(options)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = options.filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}
