import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ArrowRight01Icon, StarIcon, TextBoldIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Toggle } from '@/components/ui/toggle'
import { ThemeToggle } from '@/components/theme-toggle'
import { CodeBlock, Demos, Gallery, Playground, Variants, bool, imports, jsx, str } from './Playground'

const BUTTON_VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const
const BUTTON_SIZES = ['xs', 'sm', 'default', 'lg'] as const
const ICON_SIZES = ['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const
const TOGGLE_VARIANTS = ['default', 'outline'] as const
const TOGGLE_SIZES = ['sm', 'default', 'lg'] as const

type Variant = (typeof BUTTON_VARIANTS)[number]
type Size = (typeof BUTTON_SIZES)[number]

const orDefault = (value: string) => (value === 'default' ? undefined : value)

// The reference page: one playground per component, then its variant grids
// and states. Other pages follow the same shape.
export default function ButtonsDemos() {
  return (
    <Demos>
      <Playground
        title="Button"
        description="variant, size, icon and state"
        controls={[
          { kind: 'select', name: 'variant', label: 'Variant', options: BUTTON_VARIANTS, initial: 'default' },
          { kind: 'select', name: 'size', label: 'Size', options: BUTTON_SIZES, initial: 'default' },
          { kind: 'select', name: 'icon', label: 'Icon', options: ['none', 'start', 'end'], initial: 'start' },
          { kind: 'text', name: 'label', label: 'Label', initial: 'New issue' },
          { kind: 'switch', name: 'loading', label: 'Loading', initial: false },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
        ]}
        render={(v) => {
          const icon = str(v, 'icon')
          const loading = bool(v, 'loading')
          const start = loading ? <Spinner data-icon="inline-start" /> : icon === 'start' && <HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />
          return (
            <Button variant={str(v, 'variant') as Variant} size={str(v, 'size') as Size} disabled={bool(v, 'disabled') || loading}>
              {start}
              {str(v, 'label') || 'Button'}
              {icon === 'end' && <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />}
            </Button>
          )
        }}
        code={(v) => {
          const icon = str(v, 'icon')
          const loading = bool(v, 'loading')
          const icons = [loading ? '' : icon === 'start' ? 'Add01Icon' : icon === 'end' ? 'ArrowRight01Icon' : ''].filter(Boolean)
          const head = imports({
            '@hugeicons/react': icons.length ? ['HugeiconsIcon'] : [],
            '@hugeicons/core-free-icons': icons,
            '@/components/ui/button': ['Button'],
            '@/components/ui/spinner': loading ? ['Spinner'] : [],
          })
          const children = [
            loading ? '<Spinner data-icon="inline-start" />' : icon === 'start' ? '<HugeiconsIcon icon={Add01Icon} strokeWidth={2} data-icon="inline-start" />' : '',
            str(v, 'label') || 'Button',
            !loading && icon === 'end' ? '<HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-end" />' : '',
          ].filter(Boolean)
          const body = jsx('Button', {
            variant: orDefault(str(v, 'variant')),
            size: orDefault(str(v, 'size')),
            disabled: bool(v, 'disabled') || loading,
          }, children.length === 1 ? children[0] : children)
          return `${head}\n\n${body}`
        }}
      />

      <Variants
        title="Button variants"
        rows={{ name: 'variant', values: BUTTON_VARIANTS }}
        cols={{ name: 'size', values: BUTTON_SIZES }}
        render={(variant, size) => <Button variant={variant} size={size}>{variant === 'default' ? 'Primary' : variant[0].toUpperCase() + variant.slice(1)}</Button>}
      />

      <Variants
        title="Icon buttons"
        rows={{ name: 'variant', values: BUTTON_VARIANTS.filter((v) => v !== 'link') }}
        cols={{ name: 'size', values: ICON_SIZES }}
        render={(variant, size) => (
          <Button variant={variant} size={size} aria-label="Add">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          </Button>
        )}
      />

      <Gallery
        title="Button states"
        note="Hover and focus with the mouse or Tab"
        items={[
          { label: 'rest', node: <Button>Save</Button> },
          { label: 'disabled', node: <Button disabled>Save</Button> },
          { label: 'loading', node: <Button disabled><Spinner data-icon="inline-start" /> Saving</Button> },
          { label: 'aria-invalid', node: <Button variant="outline" aria-invalid>Retry</Button> },
          { label: 'aria-expanded', node: <Button variant="outline" aria-expanded>Menu open</Button> },
        ]}
      />

      <Playground
        title="Toggle"
        description="A button that stays pressed"
        controls={[
          { kind: 'select', name: 'variant', label: 'Variant', options: TOGGLE_VARIANTS, initial: 'outline' },
          { kind: 'select', name: 'size', label: 'Size', options: TOGGLE_SIZES, initial: 'default' },
          { kind: 'switch', name: 'label', label: 'Show label', initial: true },
          { kind: 'switch', name: 'disabled', label: 'Disabled', initial: false },
        ]}
        render={(v) => (
          <Toggle
            variant={str(v, 'variant') as (typeof TOGGLE_VARIANTS)[number]}
            size={str(v, 'size') as (typeof TOGGLE_SIZES)[number]}
            disabled={bool(v, 'disabled')}
            aria-label="Bold"
          >
            <HugeiconsIcon icon={TextBoldIcon} strokeWidth={2} data-icon={bool(v, 'label') ? 'inline-start' : undefined} />
            {bool(v, 'label') && 'Bold'}
          </Toggle>
        )}
        code={(v) => {
          const label = bool(v, 'label')
          return `${imports({
            '@hugeicons/react': ['HugeiconsIcon'],
            '@hugeicons/core-free-icons': ['TextBoldIcon'],
            '@/components/ui/toggle': ['Toggle'],
          })}\n\n${jsx('Toggle', {
            variant: orDefault(str(v, 'variant')),
            size: orDefault(str(v, 'size')),
            disabled: bool(v, 'disabled'),
            'aria-label': 'Bold',
          }, label
            ? ['<HugeiconsIcon icon={TextBoldIcon} strokeWidth={2} data-icon="inline-start" />', 'Bold']
            : '<HugeiconsIcon icon={TextBoldIcon} strokeWidth={2} />')}`
        }}
      />

      <Variants
        title="Toggle variants"
        rows={{ name: 'variant', values: TOGGLE_VARIANTS }}
        cols={{ name: 'size', values: TOGGLE_SIZES }}
        render={(variant, size) => (
          <Toggle variant={variant} size={size} defaultPressed aria-label="Star">
            <HugeiconsIcon icon={StarIcon} strokeWidth={2} />
          </Toggle>
        )}
      />

      <Gallery
        title="Theme toggle"
        note="ThemeToggle: light and dark for a header. It switches the kit itself; System is in the theme menus"
        items={[
          { label: 'ThemeToggle', node: <ThemeToggle /> },
          { label: 'code', node: <CodeBlock code={"import { ThemeToggle } from '@/components/theme-toggle'\n\n<ThemeToggle />"} /> },
        ]}
      />
    </Demos>
  )
}
