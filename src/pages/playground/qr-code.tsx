import { useState } from 'react'
import { Store01Icon } from '@hugeicons/core-free-icons'
import { toast } from 'sonner'
import { IconMark } from '@/components/mark'
import { QrCode, type QrCodeLevel, type QrCodeMark, type QrCodeShape } from '@/components/qr-code'
import { QrScanner } from '@/components/qr-scanner'
import { Button } from '@/components/ui/button'
import { Demos, Gallery, Playground, Variants, bool, imports, jsx, str, type Values } from './Playground'

// Props equal to their default stay out of the snippet.
const unless = (value: string, fallback: string) => (value === fallback ? undefined : value)

// --- QrCode --------------------------------------------------------------

const QR_SHAPES = ['square', 'rounded', 'dots'] as const

const QR_MARKS = ['none', 'initials', 'name'] as const

const QR_LEVELS = ['L', 'M', 'Q', 'H'] as const

const QR_SIZES = ['96', '128', '160', '200'] as const

const QR_LINK = 'https://pay.example.com/i/INV-1042'

const QR_COMPANY = 'Northwind Trading'

function qrCodeCode(v: Values) {
  const mark = str(v, 'mark')
  return `${imports({ '@/components/qr-code': ['QrCode'] })}

${jsx('QrCode', {
    value: str(v, 'value'),
    size: str(v, 'size') === '160' ? undefined : Number(str(v, 'size')),
    // The level only counts without a mark: a mark always uses H.
    level: mark === 'none' ? unless(str(v, 'level'), 'M') : undefined,
    shape: unless(str(v, 'shape'), 'square'),
    company: str(v, 'company') || undefined,
    showName: bool(v, 'showName') ? undefined : '{false}',
    caption: str(v, 'caption') || undefined,
    mark: unless(mark, 'none'),
  })}`
}

// The scanner asks for the camera, so it starts on a click, not with the page.
function ScannerDemo() {
  const [on, setOn] = useState(false)
  const [last, setLast] = useState('')
  if (!on) {
    return (
      <div className="grid w-72 justify-items-start gap-2">
        <Button variant="outline" size="sm" onClick={() => setOn(true)}>Start the scanner</Button>
        <span className="text-muted-foreground text-[11px]">Asks for the camera. Without one, it takes the code typed.</span>
      </div>
    )
  }
  return (
    <div className="grid w-72 gap-2">
      <QrScanner
        onScan={(value) => {
          setLast(value)
          toast.success('Code read', { description: value })
        }}
      />
      {last && <span className="text-muted-foreground truncate text-[11px]">Last read: {last}</span>}
      <Button variant="ghost" size="xs" className="justify-self-start" onClick={() => setOn(false)}>Stop</Button>
    </div>
  )
}

export default function QrCodeDemos() {
  return (
    <Demos>
      <Playground
        title="QrCode"
        description="a link as a QR code, with the company's name and mark"
        controls={[
          { kind: 'text', name: 'value', label: 'Value', initial: QR_LINK },
          { kind: 'text', name: 'company', label: 'Company', initial: QR_COMPANY },
          { kind: 'switch', name: 'showName', label: 'Show name', initial: true },
          { kind: 'text', name: 'caption', label: 'Caption', initial: 'Scan to pay' },
          { kind: 'select', name: 'mark', label: 'Mark', options: QR_MARKS, initial: 'initials' },
          { kind: 'select', name: 'shape', label: 'Shape', options: QR_SHAPES, initial: 'rounded' },
          { kind: 'select', name: 'size', label: 'Size', options: QR_SIZES, initial: '160' },
          { kind: 'select', name: 'level', label: 'Level (without a mark)', options: QR_LEVELS, initial: 'M' },
        ]}
        render={(v) => (
          <QrCode
            value={str(v, 'value')}
            size={Number(str(v, 'size'))}
            level={str(v, 'level') as QrCodeLevel}
            shape={str(v, 'shape') as QrCodeShape}
            company={str(v, 'company')}
            showName={bool(v, 'showName')}
            caption={str(v, 'caption')}
            mark={str(v, 'mark') as QrCodeMark}
          />
        )}
        code={qrCodeCode}
      />

      <Variants
        title="QrCode shapes and marks"
        rows={{ name: 'shape', values: QR_SHAPES }}
        cols={{ name: 'mark', values: QR_MARKS }}
        render={(shape, mark) => <QrCode value={QR_LINK} size={120} shape={shape} mark={mark} company={mark === 'name' ? 'Northwind' : QR_COMPANY} showName={false} />}
      />

      <Gallery
        title="QrCode states"
        note="An empty or too long value shows why there is no code"
        items={[
          { label: 'name and caption', node: <QrCode value={QR_LINK} size={128} company={QR_COMPANY} caption="Scan to pay" /> },
          { label: 'long name: truncates', node: <QrCode value={QR_LINK} size={128} company="Northwind Trading and Logistics Pte Ltd" mark="name" /> },
          {
            label: 'logo: your own mark',
            node: <QrCode value={QR_LINK} size={128} shape="dots" company="Corner Store" logo={<IconMark icon={Store01Icon} colour="var(--chart-4)" size="lg" />} />,
          },
          { label: 'empty value', node: <QrCode value="" size={128} /> },
          { label: 'too long', node: <QrCode value={'x'.repeat(3000)} size={128} /> },
        ]}
      />

      <Gallery
        title="QrScanner"
        note="Reads a code with the camera (BarcodeDetector), or takes it typed"
        items={[{ label: 'onScan gets the value', node: <ScannerDemo /> }]}
      />
    </Demos>
  )
}
