import { useEffect } from 'react'
import { AiWorkspace } from '@/pages/sections/AiWorkspaceSection'

// A full-page mockup: the kit's AI workspace block filling the window, as a
// real AI chat app would. No kit chrome; the account menu links back.
export default function AiChatApp() {
  useEffect(() => {
    document.title = 'Assistant · Acme'
  }, [])

  return (
    <main className="bg-background">
      <h1 className="sr-only">Assistant</h1>
      <AiWorkspace page />
    </main>
  )
}
