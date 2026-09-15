import { useTranslation } from 'react-i18next'

import { getDutyTags, type DutyTag } from '../data/duties'

interface DutyTagsProps {
  dutyId: number
}

const tagClassNames: Record<DutyTag, string> = {
  mainScenario: 'main-scenario',
  crystalTower: 'crystal-tower',
}

export function DutyTags({ dutyId }: DutyTagsProps) {
  const { t } = useTranslation()

  return getDutyTags(dutyId).map((tag) => (
    <span key={tag} className={`special-duty-chip ${tagClassNames[tag]}`}>
      {t(`dutyTags.${tag}`)}
    </span>
  ))
}
