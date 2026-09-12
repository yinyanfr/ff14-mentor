export type Locale = 'zh-CN' | 'zh-TW' | 'ja' | 'en' | 'de' | 'fr' | 'ko'

export type DutyLocale = 'zh_cn' | 'zh_tw' | 'ja' | 'en' | 'de' | 'fr' | 'ko'

export type DutyType =
  | 'leveling_dungeon'
  | 'level_cap_dungeon'
  | 'trial'
  | 'extreme_trial'
  | 'normal_raid'
  | 'alliance_raid'
  | 'guildhest'

export interface Duty {
  content_finder_condition_id: number
  garland_tools_instance_id: number | null
  names: Partial<Record<DutyLocale, string>>
  type: DutyType
  patch: string
  expansion: string
  level: {
    required: number
    sync: number | null
    item_level_required: number | null
    item_level_sync: number | null
  }
  sort_key: number
}

export interface DutyDataset {
  meta: {
    schema_version: number
    game_data_snapshot: string
    duty_count: number
  }
  duties: Duty[]
}

export interface DutyRecord {
  id: string
  dutyId: number
  incomplete: boolean
  occurredAt: string
  note: string
  createdAt: string
  updatedAt: string
}

export interface RecordUpdate {
  dutyId: number
  incomplete: boolean
  note: string
}

export type Theme = 'light' | 'dark'
