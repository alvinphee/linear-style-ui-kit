import { addDays } from 'date-fns'
import { dayKey, overlaps, parseDayKey, type Dock, type DockAppointment, type DockClosure, type DockDirection } from '@/blocks/dock-schedule'
import { seededRandom } from '@/lib/random'

// A made-up distribution centre's docks and three weeks of dock appointments
// around today (Monday 5 October 2026, 10:40). Generated from a fixed seed,
// so everyone sees the same yard.

export const TODAY = '2026-10-05'
export const NOW = 10 * 60 + 40
export const OPEN = 6 * 60
export const CLOSE = 22 * 60

export type LoadType = 'live' | 'drop'

// The block's appointment, plus what the yard office keeps about it.
export type YardAppointment = DockAppointment & {
  number: string
  carrier: string
  trailer: string
  driver: string
  // A purchase order coming in, a delivery order going out.
  reference: string
  pallets: number
  loadType: LoadType
  // When the trailer checked in at the gate, in minutes after midnight.
  arrivedAt?: number
}

export const LOAD_TYPE: Record<LoadType, Record<DockDirection, string>> = {
  live: { inbound: 'Live unload', outbound: 'Live load' },
  drop: { inbound: 'Drop trailer', outbound: 'Drop trailer' },
}

export const DOCKS: Dock[] = [
  { id: 'd01', name: 'Dock 01', use: 'inbound', description: 'Leveller' },
  { id: 'd02', name: 'Dock 02', use: 'inbound', description: 'Leveller' },
  { id: 'd03', name: 'Dock 03', use: 'inbound', description: 'Reefer · Leveller' },
  { id: 'd04', name: 'Dock 04', use: 'both', description: 'Reefer' },
  { id: 'd05', name: 'Dock 05', use: 'both', description: 'Container ramp' },
  { id: 'd06', name: 'Dock 06', use: 'outbound', description: 'Leveller' },
  { id: 'd07', name: 'Dock 07', use: 'outbound', description: 'Side loading' },
  { id: 'd08', name: 'Dock 08', use: 'outbound', outOfService: 'Leveller repair' },
]

export const CLOSURES: DockClosure[] = [
  { id: 'shift', start: 14 * 60, end: 14 * 60 + 30, label: 'Shift change' },
  { id: 'd03-wash', dockId: 'd03', start: 6 * 60, end: 7 * 60, label: 'Reefer wash' },
  { id: 'd05-service', dockId: 'd05', date: TODAY, start: 12 * 60, end: 13 * 60 + 30, label: 'Maintenance' },
]

export const CARRIERS = [
  'Northpeak Freight', 'Bluefin Haulage', 'Harbourline Transport', 'Summitway Carriers', 'Redgum Logistics',
  'Kestrel Express', 'Meridian Cargo', 'Coldchain Couriers', 'Pinecrest Trucking', 'Ironbark Haulage',
]

const DRIVERS = [
  'Ahmad Rizal', 'Tan Wei Ming', 'Priya Nair', 'Marcus Lee', 'Siti Aminah', 'Daniel Ong', 'Ravi Kumar',
  'Chloe Lim', 'Hafiz Osman', 'Grace Teo',
]

export const DAYS = Array.from({ length: 21 }, (_, i) => dayKey(addDays(parseDayKey('2026-09-28'), i)))

function generate(): YardAppointment[] {
  const rand = seededRandom(20261005)
  const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)] as T
  const drafts: Omit<YardAppointment, 'id' | 'number' | 'reference'>[] = []

  for (const date of DAYS) {
    const weekday = parseDayKey(date).getDay()
    // Saturday closes early; Sunday has a few bookings on two docks.
    const lastStart = weekday === 6 ? 14 * 60 : CLOSE - 30
    const docks = weekday === 0 ? DOCKS.slice(3, 5) : DOCKS
    for (const dock of docks) {
      if (dock.outOfService) continue
      let t = OPEN + pick([0, 30, 60, 90])
      while (t < lastStart) {
        const length = pick([30, 45, 60, 60, 90, 120])
        if (t + length > CLOSE) break
        const clash = CLOSURES.find((c) => (!c.dockId || c.dockId === dock.id) && (!c.date || c.date === date) && overlaps(c, { start: t, end: t + length }))
        if (clash) {
          t = clash.end
          continue
        }
        const direction: DockDirection = dock.use === 'both' ? (rand() < 0.5 ? 'inbound' : 'outbound') : dock.use === 'outbound' ? 'outbound' : 'inbound'
        const carrier = pick(dock.description?.includes('Reefer') && rand() < 0.5 ? ['Coldchain Couriers'] : CARRIERS)
        drafts.push({
          dockId: dock.id, date, start: t, end: t + length, direction, status: 'scheduled',
          title: carrier, carrier,
          trailer: `TRL-${1000 + Math.floor(rand() * 9000)}`,
          driver: pick(DRIVERS),
          pallets: 6 + Math.floor(rand() * 21),
          loadType: rand() < 0.75 ? 'live' : 'drop',
        })
        t += length + pick(weekday === 0 ? [120, 180, 240] : [0, 0, 30, 30, 60, 90, 150])
      }
    }
  }

  drafts.sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start || a.dockId.localeCompare(b.dockId))

  let inbound = 8000
  let outbound = 7000
  const list: YardAppointment[] = drafts.map((d, i) => {
    const reference = d.direction === 'inbound' ? `PO-${++inbound}` : `DO-${++outbound}`
    const roll = rand()
    let status = d.status
    let arrivedAt: number | undefined
    if (d.date < TODAY) {
      status = roll < 0.05 ? 'no-show' : 'completed'
    } else if (d.date === TODAY) {
      if (d.end <= NOW) status = roll < 0.12 ? 'no-show' : 'completed'
      else if (d.start <= NOW) status = roll < 0.4 ? 'late' : 'at-door'
      else if (d.start <= NOW + 90 && roll < 0.45) status = 'checked-in'
    }
    if (status === 'completed' || status === 'at-door' || status === 'checked-in') {
      arrivedAt = Math.max(OPEN - 30, d.start - 5 - Math.floor(rand() * 40))
      if (status === 'checked-in') arrivedAt = Math.min(arrivedAt, NOW - 4)
    }
    return {
      ...d,
      id: `apt-${1001 + i}`,
      number: `APT-${1001 + i}`,
      reference,
      status,
      arrivedAt,
      subtitle: `${reference} · ${d.pallets} pallets`,
    }
  })

  // Today shows each kind of exception at least once, whatever the dice said.
  const ended = list.filter((a) => a.date === TODAY && a.status === 'completed')
  if (!list.some((a) => a.date === TODAY && a.status === 'no-show') && ended[3]) {
    ended[3].status = 'no-show'
    ended[3].arrivedAt = undefined
  }
  return list
}

export const APPOINTMENTS = generate()
