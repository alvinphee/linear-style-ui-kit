import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { usePath } from '@/lib/router'
import { ThemeProvider } from '@/lib/theme'
import { JobsProvider } from '@/pages/jobs-store'
import KitchenSink from '@/pages/KitchenSink'
import ThemeCompare from '@/pages/ThemeCompare'
import AiChatApp from '@/templates/ai-chat/AiChatApp'
import ErpApp from '@/templates/erp/ErpApp'
import ErpAiApp from '@/templates/erp-ai/ErpAiApp'

// "#/templates/…" are full-page apps and "#/compare/…" the full-page theme
// comparison; everything else is the kit.
// "#/mockups/ai-chat" is the AI chat template's old address.
function Routes() {
  const path = usePath()
  if (path.startsWith('/templates/erp-ai')) return <ErpAiApp />
  if (path.startsWith('/templates/erp')) return <ErpApp />
  if (path.startsWith('/templates/ai-chat') || path.startsWith('/mockups/ai-chat')) return <AiChatApp />
  if (path === '/compare' || path.startsWith('/compare/')) return <ThemeCompare />
  return <KitchenSink />
}

// Dark first, like Linear. The theme switch and Ctrl+K menu can change it.
export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider delayDuration={300}>
        <JobsProvider>
          <Routes />
        </JobsProvider>
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  )
}
