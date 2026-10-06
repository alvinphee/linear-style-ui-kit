import { useState, type MouseEvent } from 'react'
import { cn } from 'cn'
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Panel, Section } from './shared'

// First, last, and the pages either side of the current one. A gap of one
// page shows that page instead of an ellipsis.
function pageItems(page: number, total: number): (number | 'gap')[] {
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

function PaginationPanel() {
  const total = 10
  const perPage = 20
  const [page, setPage] = useState(3)
  const go = (p: number) => (e: MouseEvent) => {
    e.preventDefault()
    setPage(Math.min(total, Math.max(1, p)))
  }
  const endClass = 'pointer-events-none opacity-50'

  return (
    <Panel title="Pagination" note="10 pages, ellipsis, disabled ends">
      <div className="grid gap-3">
        <Pagination>
          <PaginationContent className="flex-wrap justify-center">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={go(page - 1)}
                aria-disabled={page === 1}
                tabIndex={page === 1 ? -1 : undefined}
                className={cn(page === 1 && endClass)}
              />
            </PaginationItem>
            {pageItems(page, total).map((item, i) =>
              item === 'gap' ? (
                <PaginationItem key={`gap-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink href="#" isActive={item === page} onClick={go(item)} className="tabular-nums">
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={go(page + 1)}
                aria-disabled={page === total}
                tabIndex={page === total ? -1 : undefined}
                className={cn(page === total && endClass)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <p aria-live="polite" className="text-muted-foreground text-center text-xs tabular-nums">
          Page {page} of {total} · showing {(page - 1) * perPage + 1}–{page * perPage} of {total * perPage}
        </p>
      </div>
    </Panel>
  )
}

export default function PaginationSection() {
  return (
    <Section id="pagination" title="Pagination" description="Moving through a long list a page at a time">
      <PaginationPanel />
    </Section>
  )
}
