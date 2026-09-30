import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/lib/theme'
import KitchenSink from '@/pages/KitchenSink'

// Dark first, like Linear. The theme switch and Ctrl+K menu can change it.
export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider delayDuration={300}>
        <KitchenSink />
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  )
}
