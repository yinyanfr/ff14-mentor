import {
  dutyById,
  getDutyName,
  getDutyTags,
  type DutyTag,
} from '../data/duties'
import { getJobIconPath, getJobName } from '../data/jobs'
import type { DutyRecord, DutyType, Job, Locale } from '../types'

const MIN_CANVAS_WIDTH = 720
const CANVAS_PADDING_X = 56
const GRID_TOP = 210
const GRID_GAP = 14
const MIN_CARD_HEIGHT = 100
const FOOTER_HEIGHT = 70
const FONT_FAMILY =
  '"PingFang SC", "Hiragino Sans", "Noto Sans CJK SC", Arial, sans-serif'

interface ShareImageLabels {
  title: string
  date: string
  count: string
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

export function calculateShareLayout(
  count: number,
  cardHeight = MIN_CARD_HEIGHT,
) {
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
    }
  }

  const cardWidth = columns === 1 ? 560 : columns === 2 ? 420 : 360
  const gridWidth = cardWidth * columns + GRID_GAP * (columns - 1)
  const canvasWidth = Math.max(
    MIN_CANVAS_WIDTH,
    gridWidth + CANVAS_PADDING_X * 2,
  )
  const paddingX = (canvasWidth - gridWidth) / 2
  const canvasHeight =
    GRID_TOP + cardHeight * rows + GRID_GAP * (rows - 1) + FOOTER_HEIGHT

  return {
    columns,
    rows,
    canvasWidth,
    canvasHeight,
    cardWidth,
    cardHeight,
    gap: GRID_GAP,
    paddingX,
    gridTop: GRID_TOP,
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

function drawBadgeRows(
  context: CanvasRenderingContext2D,
  badges: readonly ShareBadge[],
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
) {
  const gap = Math.max(4, fontSize * 0.45)
  const badgeHeight = fontSize + 12
  const maximumBadgeWidth = Math.max(44, (maxWidth - gap) / 2)
  let cursorX = x
  let cursorY = y

  badges.forEach((badge) => {
    setFont(context, 700, fontSize)
    const desiredWidth = Math.min(
      maximumBadgeWidth,
      context.measureText(badge.text).width + 16,
    )
    if (cursorX > x && cursorX + desiredWidth > x + maxWidth) {
      cursorX = x
      cursorY += badgeHeight + gap
    }
    const colors = badgeColors[badge.tone]
    const width = drawBadge(
      context,
      badge.text,
      cursorX,
      cursorY,
      desiredWidth,
      fontSize,
      colors.foreground,
      colors.background,
    )
    cursorX += width + gap
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
  const maximumBadgeCount = Math.max(
    ...sortedRecords.map(
      (record) => getShareRecordBadges(record, locale, labels).length,
    ),
  )
  const badgeRows = Math.ceil(maximumBadgeCount / 2)
  const cardHeight = Math.max(MIN_CARD_HEIGHT, 45 + badgeRows * 27)
  const layout = calculateShareLayout(sortedRecords.length, cardHeight)
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
  roundedRect(context, layout.paddingX, 48, 116, 10, 5)
  context.fill()
  context.fillStyle = '#252236'
  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'
  setFont(context, 800, 44)
  context.fillText(labels.title, layout.paddingX, 126)
  context.fillStyle = '#69647c'
  setFont(context, 600, 23)
  context.fillText(labels.date, layout.paddingX, 168)
  context.textAlign = 'right'
  context.fillStyle = '#7066e8'
  setFont(context, 800, 54)
  context.fillText(labels.count, layout.canvasWidth - layout.paddingX, 132)

  const icons = await loadJobIcons(sortedRecords)
  const cardRadius = 16
  const cardPadding = 12
  const smallFont = 12
  const nameFont = 18
  const badgeFont = 10
  const iconSize = 54

  sortedRecords.forEach((record, index) => {
    const column = index % layout.columns
    const row = Math.floor(index / layout.columns)
    const x = layout.paddingX + column * (layout.cardWidth + layout.gap)
    const y = layout.gridTop + row * (layout.cardHeight + layout.gap)
    const duty = dutyById.get(record.dutyId)
    const dutyName = duty ? getDutyName(duty, locale) : `#${record.dutyId}`

    context.save()
    context.shadowColor = 'rgba(48, 42, 78, 0.09)'
    context.shadowBlur = 14
    context.shadowOffsetY = 5
    roundedRect(context, x, y, layout.cardWidth, layout.cardHeight, cardRadius)
    context.fillStyle = 'rgba(255, 255, 255, 0.92)'
    context.fill()
    context.restore()

    const iconX = x + cardPadding
    const iconY = y + (layout.cardHeight - iconSize) / 2
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

    const contentX = iconX + iconSize + Math.max(10, cardPadding)
    const contentWidth = x + layout.cardWidth - cardPadding - contentX
    const time = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(record.occurredAt))
    setFont(context, 650, smallFont)
    const timeWidth = context.measureText(time).width
    context.fillStyle = '#8b86a0'
    context.textAlign = 'right'
    context.fillText(
      time,
      x + layout.cardWidth - cardPadding,
      y + cardPadding + 2,
    )

    context.fillStyle = '#252236'
    context.textAlign = 'left'
    context.textBaseline = 'top'
    setFont(context, 750, nameFont)
    const nameY = y + cardPadding
    context.fillText(
      fitText(
        context,
        `#${index + 1} ${dutyName}`,
        contentWidth - timeWidth - 10,
      ),
      contentX,
      nameY,
    )

    drawBadgeRows(
      context,
      getShareRecordBadges(record, locale, labels),
      contentX,
      nameY + nameFont + Math.max(6, cardPadding * 0.65),
      contentWidth,
      badgeFont,
    )
  })

  context.fillStyle = '#8b86a0'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  setFont(context, 650, 17)
  context.fillText(
    'FF14 MENTOR ROULETTE LOG',
    layout.canvasWidth / 2,
    layout.canvasHeight - 30,
  )

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
