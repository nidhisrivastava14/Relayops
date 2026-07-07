import { MirrorStatus } from '@/lib/types';

export interface CommandLog {
  id: string
  interaction_id: string
  server_id: string | null
  guild_id: string | null
  command_name: string
  user_id: string
  input_text: string | null
  status: 'received' | 'completed' | 'failed'
  action_taken: string | null
  incident_status: 'open' | 'resolved' | null
  mirror_status: MirrorStatus
  category: string | null
  priority: string | null
  ai_summary: string | null
  created_at: string
}

function getSparkline(logs: CommandLog[], filterFn: (log: CommandLog) => boolean): number[] {
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const bucketSize = oneDay / 10
  const buckets = Array(10).fill(0)

  logs.forEach((log) => {
    if (!filterFn(log)) return
    const logTime = new Date(log.created_at).getTime()
    const diff = now - logTime
    if (diff >= 0 && diff < oneDay) {
      const bucketIndex = 9 - Math.floor(diff / bucketSize)
      if (bucketIndex >= 0 && bucketIndex < 10) {
        buckets[bucketIndex]++
      }
    }
  })
  return buckets
}

export function fetchDashboardMetrics(logs: CommandLog[]) {
  // Counts Today
  const todayStr = new Date().toDateString()
  const todayLogs = logs.filter(
    (log) => new Date(log.created_at).toDateString() === todayStr
  )
  const commandsToday = todayLogs.length

  // Open Incidents
  const openIncidents = logs.filter(
    (log) => log.command_name === 'report' && log.incident_status === 'open'
  ).length

  // AI Classified
  const aiClassified = logs.filter((log) => log.category !== null).length

  // Success Rates
  const completed = logs.filter((log) => log.status === 'completed').length
  const failed = logs.filter((log) => log.status === 'failed').length
  const successRatePercent =
    completed + failed > 0
      ? Math.round((completed / (completed + failed)) * 100)
      : 100

  // Mirror success rate
  const mirrorDelivered = logs.filter(
    (log) => log.mirror_status === 'delivered'
  ).length
  const mirrorFailed = logs.filter(
    (log) => log.mirror_status === 'failed'
  ).length
  const mirrorRatePercent =
    mirrorDelivered + mirrorFailed > 0
      ? Math.round((mirrorDelivered / (mirrorDelivered + mirrorFailed)) * 100)
      : 100

  // Sparklines
  const commandsSpark = getSparkline(logs, () => true)
  const openSpark = getSparkline(
    logs,
    (log) => log.command_name === 'report' && log.incident_status === 'open'
  )
  const mirrorSpark = getSparkline(
    logs,
    (log) => log.mirror_status === 'delivered'
  )
  const aiSpark = getSparkline(logs, (log) => log.category !== null)

  return {
    commandsToday,
    openIncidents,
    aiClassified,
    successRate: `${successRatePercent}%`,
    mirrorSuccessRate: `${mirrorRatePercent}%`,
    sparks: {
      commands: commandsSpark,
      open: openSpark,
      mirror: mirrorSpark,
      ai: aiSpark,
    },
  }
}

export function getCommandVolume(logs: CommandLog[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const volumeMap: Record<string, { commands: number; mirrors: number }> = {}

  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(now.getDate() - i)
    const dayName = days[d.getDay()]
    volumeMap[dayName] = { commands: 0, mirrors: 0 }
  }

  logs.forEach((log) => {
    const logDate = new Date(log.created_at)
    const diffTime = Math.abs(now.getTime() - logDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays <= 7) {
      const dayName = days[logDate.getDay()]
      if (volumeMap[dayName]) {
        volumeMap[dayName].commands++
        if (log.mirror_status === 'delivered') {
          volumeMap[dayName].mirrors++
        }
      }
    }
  })

  return Object.entries(volumeMap).map(([day, val]) => ({
    day,
    commands: val.commands,
    mirrors: val.mirrors,
  }))
}

export function getCommandsByCategory(logs: CommandLog[]) {
  const categories = [
    'Backend',
    'Frontend',
    'Infrastructure',
    'Authentication',
    'Database',
    'Networking',
    'Deployment',
    'Feature Request',
    'Other',
  ]
  const counts: Record<string, number> = {}
  categories.forEach((cat) => (counts[cat] = 0))

  let totalReports = 0
  logs.forEach((log) => {
    if (log.command_name === 'report' && log.category) {
      counts[log.category] = (counts[log.category] || 0) + 1
      totalReports++
    }
  })

  const colors = [
    '#8b5cf6',
    '#6366f1',
    '#34d399',
    '#22d3ee',
    '#fbbf24',
    '#ec4899',
    '#f43f5e',
    '#14b8a6',
    '#6b7280',
  ]

  return categories
    .map((cat, i) => {
      const count = counts[cat] || 0
      const percent = totalReports > 0 ? Math.round((count / totalReports) * 100) : 0
      return {
        label: cat,
        value: percent,
        color: colors[i % colors.length],
      }
    })
    .filter((item) => item.value > 0)
}

export function getSuccessFailure(logs: CommandLog[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dataMap: Record<string, { success: number; failure: number }> = {}

  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(now.getDate() - i)
    const dayName = days[d.getDay()]
    dataMap[dayName] = { success: 0, failure: 0 }
  }

  logs.forEach((log) => {
    const logDate = new Date(log.created_at)
    const diffTime = Math.abs(now.getTime() - logDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays <= 7) {
      const dayName = days[logDate.getDay()]
      if (dataMap[dayName]) {
        if (log.status === 'completed') {
          dataMap[dayName].success++
        } else if (log.status === 'failed') {
          dataMap[dayName].failure++
        }
      }
    }
  })

  return Object.entries(dataMap).map(([day, val]) => ({
    day,
    success: val.success,
    failure: val.failure,
  }))
}

export function getHourlyActivity(logs: CommandLog[]) {
  const activity = Array.from({ length: 7 }, () => Array(24).fill(0))

  logs.forEach((log) => {
    const logDate = new Date(log.created_at)
    const dayIndex = logDate.getDay()
    const hourIndex = logDate.getHours()

    // Sunday (0) maps to index 6, Monday (1) to index 0, etc.
    const mappedDay = dayIndex === 0 ? 6 : dayIndex - 1
    activity[mappedDay][hourIndex]++
  })

  return activity.map((row) =>
    row.map((count) => {
      if (count === 0) return 0
      if (count <= 2) return 1
      if (count <= 5) return 2
      if (count <= 10) return 3
      return 4
    })
  )
}

export function getTopCommands(logs: CommandLog[]) {
  const counts: Record<
    string,
    { count: number; completed: number; failed: number }
  > = {}

  logs.forEach((log) => {
    const name = `/${log.command_name}`
    if (!counts[name]) {
      counts[name] = { count: 0, completed: 0, failed: 0 }
    }
    counts[name].count++
    if (log.status === 'completed') {
      counts[name].completed++
    } else if (log.status === 'failed') {
      counts[name].failed++
    }
  })

  const descriptions: Record<string, string> = {
    '/report': 'User Issue Reports',
    '/status': 'Status Queries',
    '/resolve_click': 'Resolution Clicks',
  }

  return Object.entries(counts)
    .map(([command, val], i) => {
      const total = val.completed + val.failed
      const rate = total > 0 ? Math.round((val.completed / total) * 100) : 100
      return {
        rank: i + 1,
        command,
        description: descriptions[command] || 'System Commands',
        count: val.count,
        successRate: `${rate}%`,
      }
    })
    .sort((a, b) => b.count - a.count)
    .map((item, index) => ({ ...item, rank: index + 1 }))
}

export function getPriorityDistribution(logs: CommandLog[]) {
  const counts: Record<string, number> = { High: 0, Medium: 0, Low: 0 }
  let totalReports = 0

  logs.forEach((log) => {
    if (log.command_name === 'report' && log.priority) {
      counts[log.priority] = (counts[log.priority] || 0) + 1
      totalReports++
    }
  })

  const colors: Record<string, string> = {
    High: '#f87171',
    Medium: '#fbbf24',
    Low: '#60a5fa',
  }

  return Object.entries(counts).map(([label, val]) => {
    const percent = totalReports > 0 ? Math.round((val / totalReports) * 100) : 0
    return {
      label,
      value: percent,
      color: colors[label] || '#94a3b8',
    }
  })
}
