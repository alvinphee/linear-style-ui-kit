import { useId, useState } from 'react'
import { toast } from 'sonner'
import { SettingsGroup, SettingsHeader, SettingsRow } from '@/blocks/settings-page'
import {
  KNOWLEDGE_ACCESS, KnowledgeBaseList, KnowledgeBaseMark, knowledgeBaseSize,
} from '@/blocks/ai/knowledge/knowledge-base-list'
import type { KnowledgeAccess, KnowledgeBase } from '@/blocks/ai/knowledge/knowledge-types'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { plural } from '@/lib/text'
import { now } from '../data'
import { useKnowledge } from '../knowledge/context'
import { useStoredState } from '../settings/prefs'
import { ORG } from './org'

// Admin console › Knowledge: the organisation's knowledge bases, who owns
// each and who can search it, a switch per base to make it available to
// everyone, and the access new knowledge bases start with. Reads and writes
// the workspace's knowledge (useKnowledge), so it renders inside its provider.

export type NewBaseAccess = Extract<KnowledgeAccess, 'private' | 'organisation'>

export const ORG_KNOWLEDGE_DEFAULT_KEY = 'linear-kit:ai-org-knowledge-default:v1'

// The access a new knowledge base starts with, as the admin set it.
export function useOrgKnowledgeDefault() {
  return useStoredState<NewBaseAccess>(ORG_KNOWLEDGE_DEFAULT_KEY, 'private')
}

// Who can search it, in words: "Organisation", "Shared with 3 people", "Only Sam Lee".
function accessLine(base: KnowledgeBase) {
  if (base.access === 'organisation') return 'Everyone in the organisation'
  if (base.access === 'people') return `Shared with ${plural(base.members?.length ?? 0, 'person', 'people')}`
  return `Only ${base.owner}`
}

// Taken back from everyone: back to the people it was shared with, if any.
const narrowed = (base: KnowledgeBase): KnowledgeAccess => (base.members?.length ? 'people' : 'private')

export function OrgKnowledgeTab() {
  const id = useId()
  const { bases, patchBase } = useKnowledge()
  const [defaultAccess, setDefaultAccess] = useOrgKnowledgeDefault()
  const [openId, setOpenId] = useState<string | null>(null)
  const open = bases.find((b) => b.id === openId) ?? null
  const shared = bases.filter((b) => b.access === 'organisation').length

  const setEveryone = (base: KnowledgeBase, everyone: boolean) => {
    patchBase(base.id, (b) => ({ ...b, access: everyone ? 'organisation' : narrowed(b) }))
    toast(everyone ? `${base.name} is available to everyone` : `${base.name} is no longer available to everyone`, {
      description: everyone
        ? `Anyone in ${ORG.name} can search it and link it to their projects.`
        : narrowed(base) === 'people' ? 'Only the people it is shared with can search it.' : `Only ${base.owner} can search it.`,
    })
  }

  return (
    <>
      <SettingsHeader
        title="Knowledge"
        description="The knowledge bases in your organisation, who owns them and who can search them."
      />

      <SettingsGroup title="New knowledge bases">
        <SettingsRow
          label="Who can search a new knowledge base"
          hint="What a knowledge base starts with when someone creates one. Its owner can change it."
          htmlFor={`${id}-default`}
        >
          <Select
            value={defaultAccess}
            onValueChange={(v) => {
              setDefaultAccess(v as NewBaseAccess)
              toast(`New knowledge bases start ${v === 'organisation' ? 'available to everyone' : 'private'}`)
            }}
          >
            <SelectTrigger id={`${id}-default`} size="sm" className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectItem value="private">Private to its owner</SelectItem>
              <SelectItem value="organisation">Organisation</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup
        title="Available to everyone"
        description="A knowledge base available to everyone can be searched by anyone in the organisation and linked to any project."
        action={bases.length > 0 && <span className="text-muted-foreground text-[11px] tabular-nums">{shared} of {bases.length}</span>}
      >
        {bases.length === 0 ? (
          <p className="text-muted-foreground px-3 py-4 text-center text-[11px]">No knowledge bases yet.</p>
        ) : (
          <ul className="divide-y" aria-label="Knowledge bases">
            {bases.map((base) => {
              return (
                <li key={base.id} className="flex min-w-0 items-center gap-3 px-3 py-2">
                  <KnowledgeBaseMark base={base} />
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate text-xs font-medium">{base.name}</span>
                    <span className="text-muted-foreground truncate text-[11px]">
                      {base.owner} · {accessLine(base)}
                    </span>
                  </div>
                  <Switch
                    checked={base.access === 'organisation'}
                    onCheckedChange={(on) => setEveryone(base, on)}
                    aria-label={`Make ${base.name} available to everyone`}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </SettingsGroup>

      <section className="grid min-w-0 gap-2">
        <div className="grid gap-0.5">
          <h3 className="text-xs font-medium">All knowledge bases</h3>
          <p className="text-muted-foreground text-[11px] leading-4">Search them, and open one to see its owner and access.</p>
        </div>
        <KnowledgeBaseList bases={bases} view="list" onOpen={setOpenId} now={now} title="All knowledge bases" />
      </section>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="sm:max-w-md">
          {open && (
            <>
              <DialogHeader>
                <div className="flex min-w-0 items-center gap-2.5">
                  <KnowledgeBaseMark base={open} />
                  <DialogTitle className="truncate">{open.name}</DialogTitle>
                </div>
                <DialogDescription>{open.description}</DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-xs">
                <dt className="text-muted-foreground">Owner</dt>
                <dd className="truncate">{open.owner}</dd>
                <dt className="text-muted-foreground">Access</dt>
                <dd className="truncate">{KNOWLEDGE_ACCESS[open.access].label} · {accessLine(open)}</dd>
                <dt className="text-muted-foreground">Size</dt>
                <dd className="truncate tabular-nums">{knowledgeBaseSize(open)}</dd>
                <dt className="text-muted-foreground">Projects</dt>
                <dd className="truncate">
                  {open.linkedProjects.length ? open.linkedProjects.map((p) => p.name).join(', ') : 'Not linked to a project'}
                </dd>
              </dl>
              <div className="bg-card rounded-lg border">
                <SettingsRow
                  label="Make available to everyone"
                  hint={`Anyone in ${ORG.name} can search it and link it to their projects.`}
                  htmlFor={`${id}-dialog-everyone`}
                >
                  <Switch
                    id={`${id}-dialog-everyone`}
                    checked={open.access === 'organisation'}
                    onCheckedChange={(on) => setEveryone(open, on)}
                  />
                </SettingsRow>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenId(null)}>Done</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
