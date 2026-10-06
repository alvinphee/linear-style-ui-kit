import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, Link01Icon } from '@hugeicons/core-free-icons'
import { copyText } from '@/lib/clipboard'
import { formatMoney } from '@/lib/format'
import { IconAction } from '@/components/icon-action'
import { QrCode } from '@/components/qr-code'
import { Button } from '@/components/ui/button'
import { Panel, Row, Section } from './shared'

const PAY_LINK = 'https://pay.example.com/i/INV-1042'

function PayByQrPanel() {
  return (
    <Panel title="Pay by QR code" note="QrCode with the company's name and mark">
      <div className="flex flex-wrap items-center gap-5">
        <QrCode value={PAY_LINK} size={128} shape="rounded" mark="initials" company="Northwind Trading" caption="Scan to pay" />
        <div className="grid min-w-0 flex-1 basis-40 gap-3">
          <div className="grid gap-0.5">
            <span className="text-muted-foreground text-[11px]">Invoice INV-1042</span>
            <span className="text-xl font-semibold tracking-tight tabular-nums">{formatMoney(4820)}</span>
            <span className="text-muted-foreground text-xs">Due 20 October · Bank transfer or card</span>
          </div>
          <Row>
            <Button variant="outline" size="sm" onClick={() => copyText(PAY_LINK, { success: 'Payment link copied' })}>
              <HugeiconsIcon icon={Link01Icon} strokeWidth={2} data-icon="inline-start" /> Copy link
            </Button>
          </Row>
        </div>
      </div>
    </Panel>
  )
}

const SETUP_KEY = 'JBSW Y3DP EHPK 3PXP'

function AuthenticatorPanel() {
  return (
    <Panel title="Set up an authenticator app" note="QrCode on its own, with the key to type in">
      <div className="flex flex-wrap items-start gap-5">
        <QrCode value={`otpauth://totp/Northwind:maya@example.com?secret=${SETUP_KEY.replace(/ /g, '')}&issuer=Northwind`} size={120} />
        <ol className="grid min-w-0 flex-1 basis-48 list-decimal gap-2.5 pl-4 text-xs leading-5 marker:text-muted-foreground">
          <li>Open your authenticator app and scan the code.</li>
          <li>
            Can't scan it? Type this key instead:
            <span className="mt-1 flex items-center gap-1">
              <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-[11px] tracking-wide">{SETUP_KEY}</code>
              <IconAction label="Copy key" icon={Copy01Icon} size="icon-xs" onClick={() => copyText(SETUP_KEY.replace(/ /g, ''), { success: 'Key copied' })} />
            </span>
          </li>
          <li>Enter the 6-digit code the app shows.</li>
        </ol>
      </div>
    </Panel>
  )
}

export default function QrCodeSection() {
  return (
    <Section id="qr-code" title="QR code" description="A link as a QR code, with the company's name and mark">
      <PayByQrPanel />

      <AuthenticatorPanel />
    </Section>
  )
}
