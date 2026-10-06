import { Fragment } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Attachment01Icon, Clock01Icon, Message01Icon } from '@hugeicons/core-free-icons'
import { Separator } from '@/components/ui/separator'
import { Demos, Gallery, Variants } from './Playground'

const ORIENTATIONS = ['horizontal', 'vertical'] as const

export default function SeparatorDemos() {
  return (
    <Demos>
      <Variants
        title="Separator"
        rows={{ name: 'orientation', values: ORIENTATIONS }}
        render={(orientation) => orientation === 'horizontal' ? (
          <div className="grid w-40 gap-2 text-xs">
            <span>Profile</span>
            <Separator />
            <span>Billing</span>
          </div>
        ) : (
          <div className="flex h-5 items-center gap-3 text-xs">
            <span>Issues</span>
            <Separator orientation="vertical" />
            <span>Projects</span>
          </div>
        )}
      />

      <Gallery
        title="Separator in use"
        items={[
          {
            label: 'with a label',
            node: (
              <div className="relative flex w-56 items-center justify-center">
                <Separator className="absolute inset-x-0 top-1/2" />
                <span className="bg-card text-muted-foreground relative px-2 text-[11px]">or</span>
              </div>
            ),
          },
          {
            label: 'metadata row',
            node: (
              <div className="text-muted-foreground flex h-4 items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3" /> 2h ago
                </span>
                <Separator orientation="vertical" />
                <span className="flex items-center gap-1">
                  <HugeiconsIcon icon={Message01Icon} strokeWidth={2} className="size-3" /> 12 comments
                </span>
                <Separator orientation="vertical" />
                <span className="flex items-center gap-1">
                  <HugeiconsIcon icon={Attachment01Icon} strokeWidth={2} className="size-3" /> 3 files
                </span>
              </div>
            ),
          },
          {
            label: 'list rows',
            node: (
              <div className="w-48 rounded-md border text-xs">
                {['Profile', 'Notifications', 'Billing'].map((item, i) => (
                  <Fragment key={item}>
                    {i > 0 && <Separator />}
                    <div className="px-2.5 py-1.5">{item}</div>
                  </Fragment>
                ))}
              </div>
            ),
          },
        ]}
      />
    </Demos>
  )
}
