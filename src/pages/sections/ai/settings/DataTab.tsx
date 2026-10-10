import { useId, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Archive01Icon, Copy01Icon, Delete02Icon, Download01Icon, Link01Icon, RefreshIcon, Unarchive03Icon, Unlink03Icon,
  UserRemove01Icon,
} from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { SettingsGroup, SettingsHeader, SettingsRow } from '@/blocks/settings-page'
import { DeleteConfirm } from '@/components/delete-confirm'
import { IconAction } from '@/components/icon-action'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { copyText } from '@/lib/clipboard'
import { formatNumber, formatShortDate } from '@/lib/format'
import { plural } from '@/lib/text'
import { useAiPrefs, useStoredState } from './prefs'

// Data controls: training opt-in, how long chats are kept, the links you
// have shared and the chats you have archived (made-up records kept in this
// browser), export, and the destructive actions last, as the big chat apps
// order them.

type SharedLink = { id: string; title: string; sharedAt: string; views: number }
type ArchivedChat = { id: string; title: string; archivedAt: string }

const SHARED_LINKS: SharedLink[] = [
  { id: 'sh-7f3k', title: 'Q3 on-time delivery summary', sharedAt: '2026-09-28', views: 42 },
  { id: 'sh-2m9q', title: 'Draft reply to a late-delivery complaint', sharedAt: '2026-09-21', views: 7 },
  { id: 'sh-8w1c', title: 'Overdue invoices: reminder plan', sharedAt: '2026-09-12', views: 19 },
  { id: 'sh-4t6z', title: 'Driver rota for the holiday week', sharedAt: '2026-08-30', views: 113 },
]

const ARCHIVED_CHATS: ArchivedChat[] = [
  { id: 'ar-1', title: 'Warehouse move checklist', archivedAt: '2026-09-25' },
  { id: 'ar-2', title: 'Fuel surcharge wording', archivedAt: '2026-09-14' },
  { id: 'ar-3', title: 'Welcome email for new drivers', archivedAt: '2026-08-22' },
]

const RETENTION = [
  { value: 'forever', label: 'Keep forever', days: null },
  { value: '30', label: '30 days', days: 30 },
  { value: '90', label: '90 days', days: 90 },
  { value: '365', label: '365 days', days: 365 },
] as const

const shareUrl = (id: string) => `https://chat.example.com/share/${id}`
const day = (iso: string) => formatShortDate(new Date(`${iso}T00:00:00`), { year: true })

export function DataTab({ chatCount, onExportAll, onResetDemo }: {
  chatCount: number
  onExportAll: () => void
  onResetDemo: () => void
}) {
  const id = useId()
  const { prefs, set } = useAiPrefs()
  const [deleting, setDeleting] = useState(false)

  return (
    <>
      <SettingsHeader title="Data controls" description="What happens to your chats, who can see them, and how to take them with you." />

      <SettingsGroup title="Privacy">
        <SettingsRow
          label="Improve the model for everyone"
          hint="Allow your chats to be used to train future models. Off by default; incognito chats are never used."
          htmlFor={`${id}-improve`}
        >
          <Switch id={`${id}-improve`} checked={prefs.improve} onCheckedChange={(on) => set('improve', on)} />
        </SettingsRow>
        <SettingsRow
          label="Chat history retention"
          hint="Chats older than this are deleted for good. Pinned chats and project chats are kept."
          htmlFor={`${id}-retention`}
        >
          <Select
            value={prefs.retentionDays === null ? 'forever' : String(prefs.retentionDays)}
            onValueChange={(v) => {
              const days = RETENTION.find((r) => r.value === v)?.days ?? null
              set('retentionDays', days)
              if (days) toast(`Chats older than ${days} days will be deleted`, { description: 'Demo only. Nothing is deleted.' })
            }}
          >
            <SelectTrigger id={`${id}-retention`} size="sm" className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent position="popper" align="end">
              {RETENTION.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsGroup>

      <SharedLinks />
      <ArchivedChats />

      <SettingsGroup title="Your data">
        <SettingsRow label="Export data" hint={`All ${plural(chatCount, 'chat')} as one Markdown file. Incognito chats are not included.`}>
          <Button variant="outline" size="sm" onClick={onExportAll} disabled={chatCount === 0}>
            <HugeiconsIcon icon={Download01Icon} strokeWidth={2} data-icon="inline-start" /> Export
          </Button>
        </SettingsRow>
        <SettingsRow label="Reset demo chats" hint="Bring back the sample chats and projects. Chats you started are removed.">
          <DeleteConfirm
            icon={null}
            title="Reset the demo chats?"
            description="Chats you started are deleted and the sample chats come back. This can't be undone."
            confirmLabel="Reset chats"
            onConfirm={onResetDemo}
          >
            <Button variant="outline" size="sm">
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} data-icon="inline-start" /> Reset
            </Button>
          </DeleteConfirm>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Danger zone" className="border-destructive/30">
        <SettingsRow label="Delete account" hint="Your account, chats, projects and files are deleted for good. This can't be undone.">
          <Button variant="destructive" size="sm" onClick={() => setDeleting(true)}>
            <HugeiconsIcon icon={UserRemove01Icon} strokeWidth={2} data-icon="inline-start" /> Delete account
          </Button>
        </SettingsRow>
      </SettingsGroup>

      <DeleteAccountDialog open={deleting} onOpenChange={setDeleting} />
    </>
  )
}

function SharedLinks() {
  const [links, setLinks] = useStoredState<SharedLink[]>('linear-kit:ai-shared-links:v1', SHARED_LINKS)
  const revoke = (link: SharedLink) => {
    setLinks((all) => all.filter((l) => l.id !== link.id))
    toast('Link revoked', { description: `"${link.title}" can no longer be opened from its link.` })
  }

  return (
    <SettingsGroup
      title="Shared links"
      description="Anyone with one of these links can read that chat. Revoke a link to stop it working."
      action={links.length > 0 && (
        <DeleteConfirm
          icon={Unlink03Icon}
          title={`Revoke all ${plural(links.length, 'link')}?`}
          description="Every shared link stops working. The chats themselves stay in your history."
          confirmLabel="Revoke all"
          onConfirm={() => {
            setLinks([])
            toast('All shared links revoked')
          }}
        >
          <Button variant="ghost" size="sm" className="text-destructive">Revoke all</Button>
        </DeleteConfirm>
      )}
      className="@container"
    >
      {links.length === 0 ? (
        <EmptyState icon={Link01Icon} title="No shared links" description="Share a chat from its menu to get a link anyone can read." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent [&>th]:text-muted-foreground [&>th]:h-8 [&>th]:text-[11px]">
              <TableHead className="pl-3">Chat</TableHead>
              <TableHead className="hidden @md:table-cell">Shared</TableHead>
              <TableHead className="hidden text-right @md:table-cell">Views</TableHead>
              <TableHead className="w-0 pr-3"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => (
              <TableRow key={link.id}>
                <TableCell className="w-full max-w-0 pl-3 whitespace-normal">
                  <span className="block truncate font-medium">{link.title}</span>
                  {/* On a narrow card the date and views fold under the title. */}
                  <span className="text-muted-foreground text-[11px] tabular-nums @md:hidden">
                    {day(link.sharedAt)} · {plural(link.views, 'view')}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground hidden tabular-nums @md:table-cell">{day(link.sharedAt)}</TableCell>
                <TableCell className="text-muted-foreground hidden text-right tabular-nums @md:table-cell">{formatNumber(link.views)}</TableCell>
                <TableCell className="pr-3">
                  <div className="flex items-center justify-end gap-0.5">
                    <IconAction
                      label={`Copy link to "${link.title}"`}
                      icon={Copy01Icon}
                      onClick={() => copyText(shareUrl(link.id), { success: 'Link copied' })}
                    />
                    <DeleteConfirm
                      icon={Unlink03Icon}
                      title="Revoke this link?"
                      description={`"${link.title}" stops being readable from its link. The chat stays in your history.`}
                      confirmLabel="Revoke link"
                      onConfirm={() => revoke(link)}
                    >
                      <Button variant="ghost" size="sm" aria-label={`Revoke the link to "${link.title}"`}>Revoke</Button>
                    </DeleteConfirm>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SettingsGroup>
  )
}

function ArchivedChats() {
  const [chats, setChats] = useStoredState<ArchivedChat[]>('linear-kit:ai-archived-chats:v1', ARCHIVED_CHATS)
  const remove = (chat: ArchivedChat) => setChats((all) => all.filter((c) => c.id !== chat.id))

  return (
    <SettingsGroup title="Archived chats" description="Archived chats leave your history but are kept until you delete them.">
      {chats.length === 0 ? (
        <EmptyState icon={Archive01Icon} title="No archived chats" description="Archive a chat from its menu to tidy your history without deleting it." />
      ) : (
        <ul className="divide-y">
          {chats.map((chat) => (
            <li key={chat.id} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
              <div className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate text-xs font-medium">{chat.title}</span>
                <span className="text-muted-foreground text-[11px] tabular-nums">Archived {day(chat.archivedAt)}</span>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    remove(chat)
                    toast('Chat unarchived', { description: `"${chat.title}" is back in your history. Demo only.` })
                  }}
                >
                  <HugeiconsIcon icon={Unarchive03Icon} strokeWidth={2} data-icon="inline-start" /> Unarchive
                </Button>
                <DeleteConfirm
                  title="Delete this chat?"
                  description={`"${chat.title}" is deleted for good. This can't be undone.`}
                  onConfirm={() => {
                    remove(chat)
                    toast('Chat deleted')
                  }}
                >
                  <IconAction label={`Delete "${chat.title}"`} icon={Delete02Icon} />
                </DeleteConfirm>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SettingsGroup>
  )
}

function EmptyState({ icon, title, description }: { icon: IconSvgElement; title: string; description: ReactNode }) {
  return (
    <Empty className="gap-2 p-6">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={icon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle className="text-xs">{title}</EmptyTitle>
        <EmptyDescription className="text-[11px]">{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

const CONFIRM_WORD = 'DELETE'

// The last step before deleting an account: the delete button only works
// once the word is typed, so it can't be pressed by habit.
function DeleteAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const id = useId()
  const [typed, setTyped] = useState('')
  const ready = typed.trim() === CONFIRM_WORD
  const close = (next: boolean) => {
    if (!next) setTyped('')
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-sm">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!ready) return
            close(false)
            toast('Account deleted', { description: 'Demo only. Your account and chats are still here.' })
          }}
        >
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Your account, every chat, project and file are deleted for good, and shared links stop working. This
              can't be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <label htmlFor={`${id}-confirm`} className="text-xs">
              Type <span className="font-mono font-medium">{CONFIRM_WORD}</span> to confirm
            </label>
            <Input
              id={`${id}-confirm`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={!ready}>Delete account</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
