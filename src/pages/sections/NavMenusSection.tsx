import { type MouseEvent } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Analytics01Icon, BookOpen01Icon, CodeIcon, News01Icon, RepeatIcon, SparklesIcon, Target02Icon, Task01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { cn } from 'cn'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList,
  NavigationMenuTrigger, navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { Panel, Section } from './shared'

const PRODUCT: { title: string; description: string; icon: IconSvgElement }[] = [
  { title: 'Issues', description: 'Track bugs and tasks with fast keyboard flows.', icon: Task01Icon },
  { title: 'Cycles', description: 'Plan focused two-week sprints for each team.', icon: RepeatIcon },
  { title: 'Projects', description: 'Ship bigger goals with milestones and updates.', icon: Target02Icon },
  { title: 'Insights', description: 'Charts across teams, cycles and labels.', icon: Analytics01Icon },
]

const RESOURCES: { title: string; icon: IconSvgElement }[] = [
  { title: 'Documentation', icon: BookOpen01Icon },
  { title: 'Changelog', icon: News01Icon },
  { title: 'API reference', icon: CodeIcon },
  { title: 'Community', icon: UserGroupIcon },
]

function openDemo(title: string) {
  return (e: MouseEvent) => {
    e.preventDefault()
    toast(title, { description: 'Demo link' })
  }
}

function NavigationMenuPanel() {
  return (
    <Panel title="Navigation menu" note="NavigationMenu, a marketing-style top bar" wide>
      <div className="bg-subtle flex min-w-0 items-center gap-2 rounded-md border px-2 py-1">
        {/* The root spans the bar, so on small screens the dropdown can use the bar's full width. */}
        <NavigationMenu className="max-w-none min-w-0 flex-1 justify-start">
          <NavigationMenuList className="flex-none flex-wrap justify-start">
            <NavigationMenuItem className="mr-1 flex items-center gap-1.5 px-1 text-xs font-semibold">
              <span className="bg-brand text-primary-foreground flex size-5 items-center justify-center rounded-md">
                <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3" />
              </span>
              <span className="hidden sm:inline">Orbit</span>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="h-7">Product</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[min(28rem,calc(100vw-5rem))] max-w-full grid-cols-1 gap-0.5 sm:grid-cols-2 md:max-w-none">
                  {PRODUCT.map((item) => (
                    <li key={item.title}>
                      <NavigationMenuLink href="#" onClick={openDemo(item.title)} className="items-start gap-2.5">
                        <span className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-md border">
                          <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-3.5" />
                        </span>
                        <span className="grid min-w-0 gap-0.5">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-muted-foreground text-[11px] leading-snug">{item.description}</span>
                        </span>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="h-7">Resources</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[min(14rem,calc(100vw-5rem))] max-w-full gap-0.5 md:max-w-none">
                  {RESOURCES.map((item) => (
                    <li key={item.title}>
                      <NavigationMenuLink href="#" onClick={openDemo(item.title)}>
                        <HugeiconsIcon icon={item.icon} strokeWidth={2} className="text-muted-foreground size-3.5" />
                        {item.title}
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#" onClick={openDemo('Pricing')} className={cn(navigationMenuTriggerStyle(), 'h-7')}>
                Pricing
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="hidden shrink-0 items-center gap-1 sm:flex">
          <Button variant="ghost" size="sm">Log in</Button>
          <Button size="sm">Sign up</Button>
        </div>
      </div>
    </Panel>
  )
}

export default function NavMenusSection() {
  return (
    <Section id="nav-menus" title="Navigation menus" description="A sidebar's items and folding groups, and a menu bar with panels">
      <NavigationMenuPanel />
    </Section>
  )
}
