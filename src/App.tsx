import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/lib/theme'
import { JobsProvider } from '@/pages/jobs-store'
import KitchenSink from '@/pages/KitchenSink'

// Dark first, like Linear. The theme switch and Ctrl+K menu can change it.
export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider delayDuration={300}>
        <JobsProvider>
          <KitchenSink />
        </JobsProvider>
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  )
}
