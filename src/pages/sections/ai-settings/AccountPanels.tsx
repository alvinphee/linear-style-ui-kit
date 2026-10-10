import { useState } from 'react'
import { toast } from 'sonner'
import { SessionList, type Session } from '@/blocks/session-list'
import { Button } from '@/components/ui/button'
import { Panel } from '../shared'
import { now } from '../ai/data'
import { sampleSessions } from '../ai/settings/SecurityTab'

// The signed-in devices block on its own: live (sign a device out, or all
// the others), only this device, and none at all.

export function AccountPanels() {
  const base = now()
  const [sessions, setSessions] = useState<Session[]>(() => sampleSessions(base))
  const current = sessions.filter((s) => s.current)

  return (
    <>
      <Panel title="Signed-in devices" note="Sign one out, or all the others" wide>
        <div className="grid gap-2">
          <div className="rounded-md border">
            <SessionList
              sessions={sessions}
              now={base}
              onSignOut={(s) => {
                setSessions((list) => list.filter((x) => x.id !== s.id))
                toast(`Signed out of ${s.name}`, { description: 'Demo only.' })
              }}
              onSignOutOthers={() => {
                setSessions(current)
                toast('Signed out of all other devices', { description: 'Demo only.' })
              }}
            />
          </div>
          {sessions.length < sampleSessions(base).length && (
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => setSessions(sampleSessions(base))}>
              Bring the devices back
            </Button>
          )}
        </div>
      </Panel>
      <Panel title="Only this device" note="Nothing to sign out">
        <div className="rounded-md border">
          <SessionList sessions={sampleSessions(base).filter((s) => s.current)} now={base} onSignOut={() => {}} onSignOutOthers={() => {}} />
        </div>
      </Panel>
      <Panel title="Empty" note="No sessions to show">
        <div className="rounded-md border">
          <SessionList sessions={[]} now={base} emptyLabel="No signed-in devices yet." />
        </div>
      </Panel>
    </>
  )
}
