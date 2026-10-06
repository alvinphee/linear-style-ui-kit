import { cn } from 'cn'
import { toast } from 'sonner'
import { SearchTrigger } from '@/components/search-trigger'
import { Demos, Playground, Variants, bool, imports, jsx, str, unless } from './Playground'

/* SearchTrigger: the button that opens the command palette */

const SEARCH_SIZES = ['sm', 'md', 'lg'] as const

const SEARCH_SHORTCUTS = ['shortcut', 'no shortcut'] as const

type SearchSize = (typeof SEARCH_SIZES)[number]

// Each size at about the width of the place it is made for: a sidebar, a
// header, a home page.
const SEARCH_BOX: Record<SearchSize, string> = { sm: 'w-full max-w-56', md: 'w-full max-w-72', lg: 'w-full max-w-md' }

const SEARCH_WIDTH: Record<SearchSize, string> = { sm: 'w-48', md: 'w-60', lg: 'w-80' }

const openPalette = () => toast('Command palette', { description: 'Demo only. The trigger opens it; typing happens there.' })

function SearchTriggerDemos() {
  return (
    <>
      <Playground
        title="SearchTrigger"
        description="A button that looks like a search field and opens the command palette"
        controls={[
          { kind: 'text', name: 'label', label: 'Label', initial: 'Search…' },
          { kind: 'select', name: 'size', label: 'Size', options: SEARCH_SIZES, initial: 'md' },
          { kind: 'switch', name: 'shortcut', label: 'Shortcut', initial: true },
        ]}
        render={(v) => {
          const size = str(v, 'size') as SearchSize
          return (
            <div className={cn('bg-background rounded-lg border p-3', SEARCH_BOX[size])}>
              <SearchTrigger
                label={str(v, 'label') || undefined}
                size={size}
                shortcut={bool(v, 'shortcut') ? undefined : []}
                onClick={openPalette}
              />
            </div>
          )
        }}
        code={(v) => `${imports({ '@/components/search-trigger': ['SearchTrigger'] })}\n\n${jsx('SearchTrigger', {
          label: unless(str(v, 'label'), 'Search…'),
          size: unless(str(v, 'size'), 'sm'),
          shortcut: bool(v, 'shortcut') ? undefined : '{[]}',
          onClick: '{openCommandPalette}',
        })}`}
      />

      <Variants
        title="SearchTrigger sizes"
        note="sm: a sidebar, md: a header, lg: the search on a home page"
        rows={{ name: 'size', values: SEARCH_SIZES }}
        cols={{ name: 'shortcut', values: SEARCH_SHORTCUTS }}
        render={(size, shortcut) => (
          <SearchTrigger
            size={size}
            shortcut={shortcut === 'no shortcut' ? [] : undefined}
            onClick={openPalette}
            className={SEARCH_WIDTH[size]}
          />
        )}
      />
    </>
  )
}

export default function CommandPaletteDemos() {
  return (
    <Demos>
      <SearchTriggerDemos />
    </Demos>
  )
}
