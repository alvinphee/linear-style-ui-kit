import { UserAvatar } from '@/components/person'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { Panel, Row, Section } from './shared'

export default function PeopleSection() {
  return (
    <Section id="people" title="Avatars and people" description="Avatars, people, mentions, and the marks that stand for a company, team or module">
      <Panel title="People" note="Avatar, AvatarGroup">
        <div className="grid gap-3">
          <Row className="gap-3">
            <Avatar size="sm"><AvatarFallback>RA</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>ML</AvatarFallback></Avatar>
            <Avatar size="lg"><AvatarFallback>DA</AvatarFallback></Avatar>
          </Row>
          <Row className="gap-3">
            <AvatarGroup>
              {['Ravi', 'Mei Ling', 'Daniel', 'Siti'].map((n) => (
                <UserAvatar key={n} name={n} />
              ))}
              <AvatarGroupCount className="size-6 text-[10px]">+3</AvatarGroupCount>
            </AvatarGroup>
            <span className="text-muted-foreground text-xs">7 drivers on shift</span>
          </Row>
        </div>
      </Panel>
    </Section>
  )
}
