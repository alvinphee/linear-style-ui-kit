import { useId, useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Camera01Icon, Delete02Icon, Mail01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { SettingsGroup, SettingsHeader, SettingsRow } from '@/blocks/settings-page'
import { UserAvatar } from '@/components/person'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { USER } from '../data'
import { useAiPrefs, useStoredState } from './prefs'

// Who you are to the assistant: photo, name, what to call you, what you do,
// and the language for the app and its replies. Changes save as you type.

const LANGUAGES = [
  'English', 'Bahasa Melayu', 'Bahasa Indonesia', '中文 (简体)', 'தமிழ்', 'हिन्दी', 'Español', 'Français', 'Deutsch', 'Português', '日本語', '한국어',
]

const ROLES = ['Product manager', 'Software engineer', 'Designer', 'Operations lead', 'Founder', 'Student']

// The photo is shrunk to a small square before it is kept, so it fits in the
// browser's storage: 160 px, centre-cropped, as a JPEG data URL.
const PHOTO_KEY = 'linear-kit:ai-profile-photo:v1'
const PHOTO_SIZE = 160

function shrinkPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = PHOTO_SIZE
      canvas.getContext('2d')!.drawImage(
        img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE,
      )
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Not an image'))
    }
    img.src = url
  })
}

export function ProfileTab() {
  const id = useId()
  const { prefs, set } = useAiPrefs()
  const [photo, setPhoto] = useStoredState<string | null>(PHOTO_KEY, null)
  const fileRef = useRef<HTMLInputElement>(null)
  const name = prefs.fullName.trim() || USER.name
  const nameMissing = !prefs.fullName.trim()

  async function pick(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image', { description: 'PNG, JPG, GIF or WebP.' })
      return
    }
    try {
      setPhoto(await shrinkPhoto(file))
      toast.success('Photo updated')
    } catch {
      toast.error('Couldn’t read that image', { description: 'Try another file.' })
    }
  }

  return (
    <>
      <SettingsHeader title="Profile" description="How you appear in shared chats, and what the assistant knows about you." />

      <SettingsGroup>
        <div className="flex min-w-0 flex-wrap items-center gap-3 px-3 py-3">
          {photo ? (
            <Avatar className="size-14">
              <AvatarImage src={photo} alt={`Profile photo of ${name}`} />
            </Avatar>
          ) : (
            <UserAvatar name={name} className="size-14 *:text-base" />
          )}
          <div className="grid min-w-0 flex-1 basis-32 gap-0.5">
            <span className="truncate text-sm font-medium">{name}</span>
            <span className="text-muted-foreground truncate text-[11px]">{USER.email}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                pick(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <HugeiconsIcon icon={Camera01Icon} strokeWidth={2} data-icon="inline-start" /> Change photo
            </Button>
            {photo && (
              <Button variant="ghost" size="sm" onClick={() => {
                setPhoto(null)
                toast('Photo removed', { action: { label: 'Undo', onClick: () => setPhoto(photo) } })
              }}>
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} data-icon="inline-start" /> Remove
              </Button>
            )}
          </div>
        </div>
      </SettingsGroup>

      <SettingsGroup title="About you" description="The assistant uses these in every chat.">
        <SettingsRow label="Full name" htmlFor={`${id}-name`} stacked>
          <Input
            id={`${id}-name`}
            value={prefs.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            autoComplete="name"
            aria-invalid={nameMissing || undefined}
            aria-describedby={nameMissing ? `${id}-name-error` : undefined}
            className="max-w-sm"
          />
          {nameMissing && <FieldError id={`${id}-name-error`}>Enter your name. Until then we show “{USER.name}”.</FieldError>}
        </SettingsRow>
        <SettingsRow label="What should the assistant call you?" hint="A first name or nickname." htmlFor={`${id}-nick`} stacked>
          <Input
            id={`${id}-nick`}
            value={prefs.nickname}
            onChange={(e) => set('nickname', e.target.value)}
            placeholder={USER.first}
            className="max-w-sm"
          />
        </SettingsRow>
        <SettingsRow label="What do you do?" hint="Your role or work, so examples fit." htmlFor={`${id}-role`} stacked>
          <Input
            id={`${id}-role`}
            value={prefs.role}
            onChange={(e) => set('role', e.target.value)}
            placeholder="Operations lead at a logistics firm"
            autoComplete="organization-title"
            className="max-w-sm"
          />
          <div role="group" aria-label="Suggested roles" className="flex flex-wrap gap-1.5">
            {ROLES.map((r) => {
              const on = prefs.role === r
              return (
                <Button
                  key={r}
                  variant={on ? 'secondary' : 'outline'}
                  size="xs"
                  aria-pressed={on}
                  className="rounded-full"
                  onClick={() => set('role', on ? '' : r)}
                >
                  {r}
                </Button>
              )
            })}
          </div>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Language and account">
        <SettingsRow label="Language" hint="For the app, and the language replies start in." htmlFor={`${id}-lang`}>
          <Select value={prefs.language} onValueChange={(v) => set('language', v)}>
            <SelectTrigger id={`${id}-lang`} size="sm" className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent position="popper" align="end">
              {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label="Email" hint="Where sign-in links and receipts go." htmlFor={`${id}-email`}>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Input id={`${id}-email`} value={USER.email} readOnly className="text-muted-foreground w-52 max-w-full" />
            <Button variant="outline" size="sm" onClick={() => toast('Change email', { description: 'Demo only. We would send a link to the new address to confirm it.' })}>
              <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} data-icon="inline-start" /> Change email
            </Button>
          </div>
        </SettingsRow>
      </SettingsGroup>
    </>
  )
}
