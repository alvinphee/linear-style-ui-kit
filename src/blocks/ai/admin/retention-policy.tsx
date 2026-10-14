import { useId, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Download01Icon, JusticeScale01Icon, SquareLock02Icon } from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { SettingsGroup, SettingsRow } from '@/blocks/settings-page'
import { DeleteConfirm } from '@/components/delete-confirm'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'

// An organisation's retention policy and data controls, as an admin sets
// them: how long chats are kept (until people delete them, or a number of
// days), whether the organisation's data may train models, a legal hold
// that pauses all deletion, and an export of everything.
//
// Shortening retention asks first: chats older than the new period are
// deleted for everyone. The training switch can be locked on (some plans
// never train on customer data), with a note saying why.

export const RETENTION_OPTIONS: { days: number | null; label: string }[] = [
  { days: null, label: 'Until deleted' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 180, label: '180 days' },
  { days: 365, label: '365 days' },
]

const valueOf = (days: number | null) => (days === null ? 'forever' : String(days))
// Moving to a shorter period (or from keeping everything) deletes chats.
const shortens = (from: number | null, to: number | null) => to !== null && (from === null || to < from)

export function RetentionPolicy({
  retentionDays, onRetentionChange, trainingOptOut, onTrainingOptOutChange, trainingLockedNote,
  onExport, legalHold, onLegalHoldChange, className,
}: {
  // Days chats are kept; null keeps them until people delete them.
  retentionDays: number | null
  onRetentionChange: (days: number | null) => void
  trainingOptOut: boolean
  onTrainingOptOutChange: (on: boolean) => void
  // Given: the opt-out is locked on, with this note.
  trainingLockedNote?: string
  // Left out: no export row.
  onExport?: () => void
  legalHold?: boolean
  // Left out: no legal hold row.
  onLegalHoldChange?: (on: boolean) => void
  className?: string
}) {
  const id = useId()
  const [pending, setPending] = useState<number | null>(null)
  const locked = trainingLockedNote !== undefined

  const pick = (value: string) => {
    const days = RETENTION_OPTIONS.find((o) => valueOf(o.days) === value)?.days ?? null
    if (days === retentionDays) return
    if (shortens(retentionDays, days)) setPending(days)
    else onRetentionChange(days)
  }

  return (
    <div className={cn('grid min-w-0 gap-6', className)}>
      <SettingsGroup
        title="Chat retention"
        description="How long everyone's chats are kept. People can still delete their own chats sooner."
      >
        <div className="grid gap-3 p-3">
          <RadioGroup
            value={valueOf(retentionDays)}
            onValueChange={pick}
            aria-label="Keep chats"
            className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-1.5"
          >
            {RETENTION_OPTIONS.map((o) => {
              const itemId = `${id}-${valueOf(o.days)}`
              return (
                <label
                  key={itemId}
                  htmlFor={itemId}
                  className={cn(
                    'flex min-w-0 cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors',
                    'hover:bg-accent/40 has-data-checked:border-primary/50 has-data-checked:bg-accent/40',
                  )}
                >
                  <RadioGroupItem id={itemId} value={valueOf(o.days)} />
                  <span className="truncate">{o.label}</span>
                </label>
              )
            })}
          </RadioGroup>

          {retentionDays === null ? (
            <p className="text-muted-foreground text-[11px] leading-4">
              Chats are kept until the person who started them deletes them.
            </p>
          ) : (
            <Alert>
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />
              <AlertTitle>Chats older than {retentionDays} days are deleted for good</AlertTitle>
              <AlertDescription>
                {legalHold
                  ? 'Paused while the legal hold is on: nothing is deleted until it is lifted.'
                  : 'Every night, for everyone, with their files and shared links. Deleted chats can’t be brought back.'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </SettingsGroup>

      <SettingsGroup title="Privacy">
        <SettingsRow
          label="Never use our data to train models"
          hint={locked ? (
            <span className="inline-flex items-start gap-1">
              <HugeiconsIcon icon={SquareLock02Icon} strokeWidth={2} aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
              {trainingLockedNote}
            </span>
          ) : 'Chats, files and feedback from anyone in the organisation are never used to train models. It applies to everyone, whatever each person chose.'}
          htmlFor={`${id}-training`}
        >
          <Switch
            id={`${id}-training`}
            checked={locked || trainingOptOut}
            disabled={locked}
            onCheckedChange={onTrainingOptOutChange}
          />
        </SettingsRow>
        {onLegalHoldChange && (
          <SettingsRow
            label={(
              <span className="inline-flex items-center gap-2">
                <HugeiconsIcon icon={JusticeScale01Icon} strokeWidth={2} aria-hidden="true" className="text-muted-foreground size-3.5 shrink-0" />
                Legal hold
              </span>
            )}
            hint="Pauses all deletion, by the retention policy and by people, until it is lifted. For when chats may be needed as evidence."
            htmlFor={`${id}-hold`}
          >
            <Switch id={`${id}-hold`} checked={!!legalHold} onCheckedChange={onLegalHoldChange} />
          </SettingsRow>
        )}
      </SettingsGroup>

      {onExport && (
        <SettingsGroup title="Export">
          <SettingsRow
            label="Export all organisation data"
            hint="Every member's chats, projects, files and the audit log, as one archive. The owners are emailed a link when it is ready."
          >
            <Button variant="outline" size="sm" onClick={onExport}>
              <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" /> Export
            </Button>
          </SettingsRow>
        </SettingsGroup>
      )}

      <DeleteConfirm
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={`Keep chats for ${pending} days?`}
        description={legalHold
          ? `Chats older than ${pending} days will be deleted for everyone once the legal hold is lifted.`
          : `Chats older than ${pending} days are deleted for everyone tonight, with their files and shared links. This can't be undone.`}
        confirmLabel={`Keep ${pending} days`}
        onConfirm={() => pending !== null && onRetentionChange(pending)}
      />
    </div>
  )
}
