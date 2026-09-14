import { BriefcaseBusiness } from 'lucide-react'

import { getJobIconPath } from '../data/jobs'
import type { Job } from '../types'

interface JobIconProps {
  job: Job | null
  className?: string
}

export function JobIcon({ job, className = '' }: JobIconProps) {
  return (
    <span className={`job-icon ${className}`.trim()} aria-hidden="true">
      {job ? (
        <img src={getJobIconPath(job)} alt="" />
      ) : (
        <BriefcaseBusiness size={20} />
      )}
    </span>
  )
}
