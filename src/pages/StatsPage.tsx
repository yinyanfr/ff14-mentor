import { Award, Compass, Hash, LoaderCircle } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { JobIcon } from '../components/JobIcon'
import { DutyTags } from '../components/DutyTags'
import { usePreferences } from '../contexts/PreferencesContext'
import { useRecords } from '../contexts/RecordsContext'
import { getJobName, jobRoleByJob } from '../data/jobs'
import {
  buildDailyStats,
  buildDutyStats,
  buildJobStats,
  buildTypeStats,
  findMostUsedJobs,
} from '../lib/stats'
import type { JobRole } from '../types'

const chartColors = [
  '#7066e8',
  '#26a69a',
  '#e3a44b',
  '#dc6a86',
  '#5596d8',
  '#9c6bd6',
  '#78909c',
]

const jobRoleColors: Record<JobRole, string> = {
  tank: '#5596d8',
  healer: '#57a96b',
  melee: '#dc6a6a',
  physicalRanged: '#e3a44b',
  caster: '#9c6bd6',
}

export function StatsPage() {
  const { t } = useTranslation()
  const { locale } = usePreferences()
  const { records, loading } = useRecords()
  const dutyStats = useMemo(
    () => buildDutyStats(records, locale),
    [locale, records],
  )
  const typeStats = useMemo(
    () =>
      buildTypeStats(records)
        .filter((item) => item.count > 0)
        .map((item) => ({ ...item, name: t(`dutyTypes.${item.type}`) })),
    [records, t],
  )
  const dailyStats = useMemo(
    () =>
      buildDailyStats(records).map((item) => ({
        ...item,
        label: new Intl.DateTimeFormat(locale, {
          month: 'short',
          day: 'numeric',
        }).format(item.date),
      })),
    [locale, records],
  )
  const jobStats = useMemo(
    () =>
      buildJobStats(records).map((item) => ({
        ...item,
        name: item.job ? getJobName(item.job, locale) : t('jobs.none'),
      })),
    [locale, records, t],
  )
  const favoriteJobs = findMostUsedJobs(jobStats)
  const favoriteJobCount = favoriteJobs[0]?.count ?? 0

  if (loading) {
    return (
      <div className="page-loading">
        <LoaderCircle className="spin" size={28} />
      </div>
    )
  }

  return (
    <div className="stats-page page-stack">
      <header className="page-heading">
        <span className="section-kicker">INSIGHTS</span>
        <h1>{t('stats.title')}</h1>
        <p>{t('stats.subtitle')}</p>
      </header>

      {!records.length ? (
        <div className="empty-dashboard">
          <Compass size={34} />
          <p>{t('stats.noData')}</p>
        </div>
      ) : (
        <>
          <section className="stat-summary" aria-label={t('stats.title')}>
            <article className="summary-card">
              <span>
                <Hash size={19} />
              </span>
              <small>{t('stats.total')}</small>
              <strong>{records.length.toLocaleString(locale)}</strong>
            </article>
            <article className="summary-card">
              <span>
                <Compass size={19} />
              </span>
              <small>{t('stats.unique')}</small>
              <strong>{dutyStats.length.toLocaleString(locale)}</strong>
            </article>
            <article className="summary-card favorite-card">
              <span>
                <Award size={19} />
              </span>
              <small>{t('stats.favorite')}</small>
              <div className="favorite-job-list">
                {favoriteJobs.map((item) => (
                  <span className="favorite-job-item" key={item.job ?? 'none'}>
                    <JobIcon job={item.job} className="favorite-job-icon" />
                    <b>{item.name}</b>
                  </span>
                ))}
              </div>
              <em>
                {favoriteJobCount.toLocaleString(locale)} {t('home.totalUnit')}
              </em>
            </article>
          </section>

          <section className="chart-grid">
            <article className="chart-card">
              <h2>{t('stats.categories')}</h2>
              <div className="pie-layout">
                <div className="chart-wrap pie-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeStats}
                        dataKey="count"
                        nameKey="name"
                        innerRadius="52%"
                        outerRadius="82%"
                        paddingAngle={3}
                      >
                        {typeStats.map((item, index) => (
                          <Cell
                            key={item.type}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          Number(value).toLocaleString(locale),
                          t('stats.count'),
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="chart-legend">
                  {typeStats.map((item, index) => (
                    <li key={item.type}>
                      <i
                        style={{
                          background: chartColors[index % chartColors.length],
                        }}
                      />
                      <span>{item.name}</span>
                      <strong>{item.count.toLocaleString(locale)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="chart-card">
              <h2>{t('stats.trend')}</h2>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyStats}
                    margin={{ top: 12, right: 12, left: -24, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      minTickGap={24}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [
                        Number(value).toLocaleString(locale),
                        t('stats.count'),
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#7066e8"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="chart-card job-stats-card">
              <h2>{t('stats.jobs')}</h2>
              <div
                className="chart-wrap job-chart"
                style={{ height: Math.max(240, jobStats.length * 38) }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={jobStats}
                    layout="vertical"
                    margin={{ top: 4, right: 18, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => [
                        Number(value).toLocaleString(locale),
                        t('stats.count'),
                      ]}
                    />
                    <Bar dataKey="count" radius={[0, 7, 7, 0]}>
                      {jobStats.map((item) => (
                        <Cell
                          key={item.job ?? 'none'}
                          fill={
                            item.job
                              ? jobRoleColors[jobRoleByJob[item.job]]
                              : '#78909c'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className="chart-card top-duties-card">
            <h2>{t('stats.topDuties')}</h2>
            <div className="chart-wrap ranking-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dutyStats.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [
                      Number(value).toLocaleString(locale),
                      t('stats.count'),
                    ]}
                  />
                  <Bar dataKey="count" fill="#7066e8" radius={[0, 7, 7, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="ranking-table-card">
            <h2>{t('stats.fullRanking')}</h2>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('home.searchLabel')}</th>
                    <th>{t('stats.count')}</th>
                    <th>{t('stats.percentage')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dutyStats.map((item, index) => (
                    <tr key={item.dutyId}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{item.name}</strong>
                        <small className="ranking-duty-meta">
                          {item.type !== 'guildhest' && (
                            <span>{t(`dutyTypes.${item.type}`)}</span>
                          )}
                          <DutyTags dutyId={item.dutyId} />
                        </small>
                      </td>
                      <td>{item.count.toLocaleString(locale)}</td>
                      <td>
                        {item.percentage.toLocaleString(locale, {
                          maximumFractionDigits: 1,
                        })}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
