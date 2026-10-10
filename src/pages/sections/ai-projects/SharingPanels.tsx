import { useState } from 'react'
import { toast } from 'sonner'
import {
  ShareButton, ShareDialog, ShareSummary, shareSummaryLabel, type ShareAccess, type ShareMember,
} from '@/blocks/share-dialog'
import {
  ProjectSharing, type ProjectChatVisibility, type ProjectMemberPermission,
} from '@/blocks/ai/projects/project-sharing'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { plural } from '@/lib/text'
import { Panel, Row } from '../shared'
import {
  MANY_MEMBERS, ONLY_YOU, ORGANISATION, PEOPLE, PROJECT_ROLES, SAMPLE_MEMBERS,
} from '../ai/projects/people'

// Sharing on its own, on local state (nothing here touches the AI chat app's
// projects): the share dialog live, the share summary and button in each
// state, and a project's Sharing tab on the same people, whose Share and
// Change open that dialog.

const PROJECT = 'Q4 planning'
const LINK = 'https://app.example.com/projects/q4-planning'

const roleLabel = (id: string) => PROJECT_ROLES.find((r) => r.id === id)?.label ?? id

export function SharingPanels() {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<ShareMember[]>(SAMPLE_MEMBERS)
  const [access, setAccess] = useState<ShareAccess>('restricted')
  const [accessRole, setAccessRole] = useState('chat')
  const [chats, setChats] = useState<ProjectChatVisibility>('shared')
  const [permission, setPermission] = useState<ProjectMemberPermission>('edit')
  const [asMember, setAsMember] = useState(false)

  const nameOf = (id: string) => {
    const m = members.find((x) => x.id === id)
    return m ? m.name || m.email : 'Someone'
  }

  return (
    <>
      <Panel title="Share dialog" note="Invite, roles, general access, copy link">
        <div className="grid min-w-0 gap-3">
          <p className="text-muted-foreground text-xs">
            Search the directory or type an email (paste several at once). Each person has a role, pending invites can
            be resent or cancelled, and general access opens it to everyone at {ORGANISATION} or to anyone with the link.
          </p>
          <Row className="justify-between">
            <ShareSummary members={members} access={access} organisation={ORGANISATION} />
            <ShareButton size="sm" members={members} access={access} organisation={ORGANISATION} onClick={() => setOpen(true)} />
          </Row>
        </div>
        <ShareDialog
          open={open}
          onOpenChange={setOpen}
          title={`Share “${PROJECT}”`}
          description="People you add can open the project. Their role decides what they can do in it."
          members={members}
          people={PEOPLE}
          roles={PROJECT_ROLES}
          defaultRole="chat"
          organisation={ORGANISATION}
          access={access}
          onAccessChange={(a) => {
            setAccess(a)
            toast.success('General access changed', { description: shareSummaryLabel(members, a, ORGANISATION) })
          }}
          accessRole={accessRole}
          onAccessRoleChange={(r) => {
            setAccessRole(r)
            toast.success(`Everyone at ${ORGANISATION}: ${roleLabel(r)}`)
          }}
          onInvite={(invitees, role, message) => {
            setMembers((list) => [
              ...list,
              ...invitees.map((i): ShareMember => ({
                id: `inv-${i.email}`, name: i.name ?? '', email: i.email, role, status: 'invited',
              })),
            ])
            toast.success(`Invited ${invitees.length === 1 ? invitees[0].name ?? invitees[0].email : plural(invitees.length, 'person', 'people')}`, {
              description: `${roleLabel(role)}${message ? ', with your message' : ''}. Demo only: no email is sent.`,
            })
          }}
          onRoleChange={(id, role) => {
            setMembers((list) => list.map((m) => (m.id === id ? { ...m, role } : m)))
            toast.success(`${nameOf(id)}: ${roleLabel(role)}`)
          }}
          onRemove={(id) => {
            const m = members.find((x) => x.id === id)
            setMembers((list) => list.filter((x) => x.id !== id))
            toast(m?.status === 'invited' ? 'Invite cancelled' : 'Access removed', { description: nameOf(id) })
          }}
          onResend={(id) => toast.success('Invite sent again', { description: `${nameOf(id)}. Demo only: no email is sent.` })}
          linkUrl={LINK}
          onCopyLink={() => toast.success('Link copied', {
            description: access === 'restricted' ? 'Only people with access can open it.' : shareSummaryLabel(members, access, ORGANISATION),
          })}
        />
      </Panel>

      <Panel title="Share summary and button" note="Only you, a few people, many, organisation, link">
        <div className="grid min-w-0 gap-2.5">
          <ShareSummary members={ONLY_YOU} access="restricted" />
          <ShareSummary members={SAMPLE_MEMBERS} access="restricted" />
          <ShareSummary members={MANY_MEMBERS} access="restricted" />
          <ShareSummary members={SAMPLE_MEMBERS} access="organisation" organisation={ORGANISATION} />
          <ShareSummary members={SAMPLE_MEMBERS} access="link" />
          <Row className="border-t pt-2.5">
            <ShareButton size="sm" members={ONLY_YOU} access="restricted" onClick={() => toast('Opens the share dialog')} />
            <ShareButton size="sm" members={SAMPLE_MEMBERS} access="restricted" onClick={() => toast('Opens the share dialog')} />
            <ShareButton size="sm" members={MANY_MEMBERS} access="organisation" organisation={ORGANISATION} onClick={() => toast('Opens the share dialog')} />
          </Row>
        </div>
      </Panel>

      <Panel title="Project sharing" note="A project's Sharing tab, on the dialog's people" wide>
        <div className="grid min-w-0 gap-4">
          <Row>
            <Switch id="sharing-as-member" checked={asMember} onCheckedChange={setAsMember} />
            <Label htmlFor="sharing-as-member" className="text-xs">View as a member (read only)</Label>
          </Row>
          <ProjectSharing
            members={members}
            roles={PROJECT_ROLES}
            access={access}
            accessRole={accessRole}
            organisation={ORGANISATION}
            onManage={() => setOpen(true)}
            chatVisibility={chats}
            onChatVisibilityChange={(v) => {
              setChats(v)
              toast.success(v === 'shared' ? 'Chats are shared with the project' : 'Chats are private to each person')
            }}
            memberPermission={permission}
            onMemberPermissionChange={(v) => {
              setPermission(v)
              toast.success(v === 'edit' ? 'Members with Can edit can change instructions and knowledge' : 'Members can only chat')
            }}
            canManage={!asMember}
          />
        </div>
      </Panel>
    </>
  )
}
