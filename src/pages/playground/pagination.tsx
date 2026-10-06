import { type MouseEvent } from 'react'
import { cn } from 'cn'
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, pick, str } from './Playground'

const PAGES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const

// Demo links stay on the page instead of jumping to the top.
const stay = (e: MouseEvent) => e.preventDefault()

/* Pagination */

const TOTAL_PAGES = 10

const END = 'pointer-events-none opacity-50'

// First, last, and the pages either side of the current one. A gap of one
// page shows that page instead of an ellipsis.
function pageItems(page: number, total: number, collapse: boolean): (number | 'gap')[] {
  if (!collapse) return Array.from({ length: total }, (_, i) => i + 1)
  const keep = [...new Set([1, page - 1, page, page + 1, total])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)
  const items: (number | 'gap')[] = []
  keep.forEach((p, i) => {
    const prev = keep[i - 1]
    if (prev !== undefined && p - prev === 2) items.push(prev + 1)
    else if (prev !== undefined && p - prev > 2) items.push('gap')
    items.push(p)
  })
  return items
}

function Pages({ page, prevNext = true, collapse = true }: { page: number; prevNext?: boolean; collapse?: boolean }) {
  return (
    <Pagination>
      <PaginationContent className="flex-wrap justify-center">
        {prevNext && (
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={stay}
              aria-disabled={page === 1}
              tabIndex={page === 1 ? -1 : undefined}
              className={cn(page === 1 && END)}
            />
          </PaginationItem>
        )}
        {pageItems(page, TOTAL_PAGES, collapse).map((item, i) =>
          item === 'gap' ? (
            <PaginationItem key={`gap-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink href="#" onClick={stay} isActive={item === page} className="tabular-nums">{item}</PaginationLink>
            </PaginationItem>
          ),
        )}
        {prevNext && (
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={stay}
              aria-disabled={page === TOTAL_PAGES}
              tabIndex={page === TOTAL_PAGES ? -1 : undefined}
              className={cn(page === TOTAL_PAGES && END)}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  )
}

function PaginationDemos() {
  return (
    <>
      <Playground
        title="Pagination"
        description="10 pages; the select sets the current one"
        controls={[
          { kind: 'select', name: 'page', label: 'Current page', options: PAGES, initial: '3' },
          { kind: 'switch', name: 'prevNext', label: 'Previous and next', initial: true },
          { kind: 'switch', name: 'collapse', label: 'Ellipsis', initial: true },
        ]}
        render={(v) => <Pages page={Number(str(v, 'page'))} prevNext={bool(v, 'prevNext')} collapse={bool(v, 'collapse')} />}
        code={(v) => {
          const page = Number(str(v, 'page'))
          const prevNext = bool(v, 'prevNext')
          const items = pageItems(page, TOTAL_PAGES, bool(v, 'collapse'))
          const gaps = items.includes('gap')
          const end = (disabled: boolean) => (disabled ? { 'aria-disabled': true, tabIndex: -1, className: END } : {})
          const head = imports({
            '@/components/ui/pagination': pick(
              'Pagination', 'PaginationContent', gaps && 'PaginationEllipsis', 'PaginationItem', 'PaginationLink',
              prevNext && 'PaginationNext', prevNext && 'PaginationPrevious',
            ),
          })
          const body = jsx('Pagination', {}, jsx('PaginationContent', {}, [
            prevNext ? jsx('PaginationItem', {}, jsx('PaginationPrevious', { href: '#', ...end(page === 1) })) : '',
            ...items.map((item) => jsx('PaginationItem', {}, item === 'gap'
              ? '<PaginationEllipsis />'
              : jsx('PaginationLink', { href: '#', isActive: item === page }, String(item)))),
            prevNext ? jsx('PaginationItem', {}, jsx('PaginationNext', { href: '#', ...end(page === TOTAL_PAGES) })) : '',
          ]))
          return `${head}\n\n${body}`
        }}
      />

      <Variants
        title="Pagination by page"
        note="Where the ellipses fall"
        rows={{ name: 'page', values: ['1', '4', '7', '10'] as const }}
        render={(page) => <Pages page={Number(page)} />}
      />

      <Gallery
        title="Pagination in use"
        items={[
          {
            label: 'compact',
            node: (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={stay} />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-muted-foreground px-2 text-xs tabular-nums">Page 3 of 10</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" onClick={stay} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ),
          },
          {
            label: 'with summary',
            node: (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-muted-foreground text-xs tabular-nums">41–60 of 200 issues</span>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationLink href="#" onClick={stay} size="default">Previous</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#" onClick={stay} size="default">Next</PaginationLink>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            ),
          },
        ]}
      />
    </>
  )
}

export default function PaginationPageDemos() {
  return (
    <Demos>
      <PaginationDemos />
    </Demos>
  )
}
