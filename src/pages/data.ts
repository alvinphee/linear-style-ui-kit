import type { IconSvgElement } from '@hugeicons/react'
import {
  // Navigation
  Home01Icon, DashboardSquare01Icon, Menu01Icon, Search01Icon, FilterIcon, Settings01Icon,
  ArrowLeft01Icon, ArrowRight01Icon, Notification03Icon, Logout01Icon, GridViewIcon,
  LeftToRightListBulletIcon,
  // Actions
  Add01Icon, PencilEdit02Icon, Delete02Icon, Download01Icon, Upload01Icon, Copy01Icon,
  Share01Icon, PrinterIcon, RefreshIcon, Tick02Icon, Cancel01Icon, MoreHorizontalIcon,
  // Logistics
  TruckIcon, TruckDeliveryIcon, DeliveryTruck01Icon, ContainerTruckIcon, ShippingTruck01Icon,
  ForkliftIcon, ContainerIcon, PackageIcon, DeliveryBox01Icon, WarehouseIcon, Location01Icon,
  Route01Icon, Calendar03Icon, Clock01Icon,
  // Photos & documents
  Camera01Icon, Image01Icon, ImageUpload01Icon, Album02Icon, Video01Icon, File01Icon, Pdf01Icon,
  Folder01Icon, Attachment01Icon, CloudUploadIcon, QrCodeIcon, FileScanIcon,
  // Status
  CheckmarkCircle02Icon, Alert02Icon, AlertCircleIcon, InformationCircleIcon, Loading03Icon,
  HelpCircleIcon, CancelCircleIcon, Clock04Icon, StopWatchIcon, Flag01Icon, StarIcon, ThumbsUpIcon,
  // People & access
  UserIcon, UserGroupIcon, UserAdd01Icon, UserCheck01Icon, UserSwitchIcon, IdIcon, ContactIcon,
  Building03Icon, Shield01Icon, SecurityCheckIcon, Key01Icon, SquareLock02Icon,
  // Safety
  HardHatIcon, FirstAidKitIcon, MedicalMaskIcon, FireIcon, Fire02Icon, ConstructionIcon,
  Alert01Icon, CheckListIcon, ClipboardCheckIcon, TaskDone01Icon, ClipboardIcon, Note01Icon,
  Megaphone01Icon,
  // Assets
  LaptopIcon, ComputerIcon, SmartPhone01Icon, HardDriveIcon, Plug01Icon, Wrench01Icon, ToolsIcon,
  ToolboxIcon, Tag01Icon, BarCode01Icon, BarcodeScanIcon, Settings02Icon,
  // Training
  Mortarboard01Icon, Certificate01Icon, Book02Icon, Presentation01Icon, TeacherIcon, Award01Icon,
  CourseIcon, QuizIcon,
  // Assistant
  AiChat02Icon, BubbleChatIcon, SparklesIcon, AiBrain01Icon, AiMagicIcon, MessageMultiple01Icon,
  Mic01Icon, SentIcon,
  // Job status and priority
  CircleDashedIcon, CircleIcon, TimeHalfPassIcon, NoSignalIcon, LowSignalIcon, MediumSignalIcon,
  FullSignalIcon, AlertSquareIcon,
} from '@hugeicons/core-free-icons'

export type Icons = Record<string, IconSvgElement>

export const ICON_GROUPS: { title: string; note: string; icons: Icons }[] = [
  {
    title: 'Navigation',
    note: 'Sidebar, header and menus',
    icons: {
      Home01Icon, DashboardSquare01Icon, Menu01Icon, Search01Icon, FilterIcon, Settings01Icon,
      ArrowLeft01Icon, ArrowRight01Icon, Notification03Icon, Logout01Icon, GridViewIcon,
      LeftToRightListBulletIcon,
    },
  },
  {
    title: 'Actions',
    note: 'Buttons and row actions',
    icons: {
      Add01Icon, PencilEdit02Icon, Delete02Icon, Download01Icon, Upload01Icon, Copy01Icon,
      Share01Icon, PrinterIcon, RefreshIcon, Tick02Icon, Cancel01Icon, MoreHorizontalIcon,
    },
  },
  {
    title: 'Logistics',
    note: 'PMS jobs, drivers and deliveries',
    icons: {
      TruckIcon, TruckDeliveryIcon, DeliveryTruck01Icon, ContainerTruckIcon, ShippingTruck01Icon,
      ForkliftIcon, ContainerIcon, PackageIcon, DeliveryBox01Icon, WarehouseIcon, Location01Icon,
      Route01Icon, Calendar03Icon, Clock01Icon,
    },
  },
  {
    title: 'Photos & documents',
    note: 'Proof photos, PDFs and uploads',
    icons: {
      Camera01Icon, Image01Icon, ImageUpload01Icon, Album02Icon, Video01Icon, File01Icon,
      Pdf01Icon, Folder01Icon, Attachment01Icon, CloudUploadIcon, QrCodeIcon, FileScanIcon,
    },
  },
  {
    title: 'Status',
    note: 'Badges, alerts and progress',
    icons: {
      CheckmarkCircle02Icon, Alert02Icon, AlertCircleIcon, InformationCircleIcon, Loading03Icon,
      HelpCircleIcon, CancelCircleIcon, Clock04Icon, StopWatchIcon, Flag01Icon, StarIcon,
      ThumbsUpIcon,
    },
  },
  {
    title: 'People & access',
    note: 'Administration, roles and staff',
    icons: {
      UserIcon, UserGroupIcon, UserAdd01Icon, UserCheck01Icon, UserSwitchIcon, IdIcon,
      ContactIcon, Building03Icon, Shield01Icon, SecurityCheckIcon, Key01Icon, SquareLock02Icon,
    },
  },
  {
    title: 'Safety',
    note: 'WSH inspections, permits and toolbox meetings',
    icons: {
      HardHatIcon, FirstAidKitIcon, MedicalMaskIcon, FireIcon, Fire02Icon, ConstructionIcon,
      Alert01Icon, CheckListIcon, ClipboardCheckIcon, TaskDone01Icon, ClipboardIcon, Note01Icon,
      Megaphone01Icon,
    },
  },
  {
    title: 'Assets',
    note: 'AMS equipment and maintenance',
    icons: {
      LaptopIcon, ComputerIcon, SmartPhone01Icon, HardDriveIcon, Plug01Icon, Wrench01Icon,
      ToolsIcon, ToolboxIcon, Tag01Icon, BarCode01Icon, BarcodeScanIcon, Settings02Icon,
    },
  },
  {
    title: 'Training',
    note: 'Courses, sessions and certificates',
    icons: {
      Mortarboard01Icon, Certificate01Icon, Book02Icon, Presentation01Icon, TeacherIcon,
      Award01Icon, CourseIcon, QuizIcon,
    },
  },
  {
    title: 'Assistant',
    note: 'The AI chat',
    icons: {
      AiChat02Icon, BubbleChatIcon, SparklesIcon, AiBrain01Icon, AiMagicIcon,
      MessageMultiple01Icon, Mic01Icon, SentIcon,
    },
  },
]

export type Status = 'backlog' | 'todo' | 'progress' | 'done' | 'cancelled'
export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent'

export const STATUS: Record<Status, { label: string; icon: IconSvgElement; className: string }> = {
  backlog: { label: 'Backlog', icon: CircleDashedIcon, className: 'text-status-todo' },
  todo: { label: 'Todo', icon: CircleIcon, className: 'text-status-todo' },
  progress: { label: 'In progress', icon: TimeHalfPassIcon, className: 'text-status-progress' },
  done: { label: 'Done', icon: CheckmarkCircle02Icon, className: 'text-status-done' },
  cancelled: { label: 'Cancelled', icon: CancelCircleIcon, className: 'text-muted-foreground' },
}

export const PRIORITY: Record<Priority, { label: string; icon: IconSvgElement; className: string }> = {
  none: { label: 'No priority', icon: NoSignalIcon, className: 'text-muted-foreground' },
  low: { label: 'Low', icon: LowSignalIcon, className: 'text-muted-foreground' },
  medium: { label: 'Medium', icon: MediumSignalIcon, className: 'text-muted-foreground' },
  high: { label: 'High', icon: FullSignalIcon, className: 'text-foreground' },
  urgent: { label: 'Urgent', icon: AlertSquareIcon, className: 'text-status-blocked' },
}

export type Job = {
  id: string
  title: string
  customer: string
  // The assignee. Empty string means unassigned.
  driver: string
  status: Status
  priority: Priority
  due: string
  photos: number
  labels: string[]
  description: string
  subtasks: { id: string; title: string; done: boolean }[]
  createdBy: string
  created: string
}

export const PEOPLE = ['Ravi', 'Mei Ling', 'Daniel', 'Siti', 'Ali']

export const CUSTOMERS = ['Bayview Foods', 'Lumen Electronics', 'Orchid Pharma', 'Tanjong Paints', 'Redhill Printing']

// Fixed label colours, like Linear's: they read the same in every theme.
export const LABELS: { id: string; name: string; colour: string }[] = [
  { id: 'fragile', name: 'Fragile', colour: 'oklch(0.65 0.18 10)' },
  { id: 'export', name: 'Export', colour: 'oklch(0.62 0.15 250)' },
  { id: 'cold', name: 'Cold chain', colour: 'oklch(0.7 0.12 215)' },
  { id: 'oversize', name: 'Oversize', colour: 'oklch(0.74 0.15 70)' },
  { id: 'key', name: 'Key account', colour: 'oklch(0.6 0.17 300)' },
]

export const DUE_OPTIONS = ['Today', 'Tomorrow', '2 Oct', '4 Oct', 'Next week']

const subtasks = (...items: [string, boolean][]) =>
  items.map(([title, done], i) => ({ id: `s${i + 1}`, title, done }))

// Made-up sample data: invented customers and first names only.
export const JOBS: Job[] = [
  {
    id: 'DO-24817', title: 'Deliver 12 pallets to Jurong warehouse', customer: 'Bayview Foods', driver: 'Ravi',
    status: 'progress', priority: 'urgent', due: 'Today', photos: 3, labels: ['fragile', 'key'],
    description: 'Twelve pallets of chilled goods. Loading bay 4 at the Jurong warehouse. Call the site contact 15 minutes before arrival.',
    subtasks: subtasks(['Load pallets at depot', true], ['Photo of load before leaving', true], ['Deliver and get signature', false], ['Photo of delivered goods', false]),
    createdBy: 'Mei Ling', created: '2 days ago',
  },
  {
    id: 'DO-24815', title: 'Collect empty crates from Tuas depot', customer: 'Lumen Electronics', driver: 'Mei Ling',
    status: 'progress', priority: 'high', due: 'Today', photos: 1, labels: ['oversize'],
    description: 'About 40 empty crates. Bring the flatbed.',
    subtasks: subtasks(['Confirm crate count', true], ['Collect and photo', false]),
    createdBy: 'Daniel', created: '3 days ago',
  },
  {
    id: 'DO-24812', title: 'Wrap and label export cargo', customer: 'Orchid Pharma', driver: 'Daniel',
    status: 'todo', priority: 'medium', due: 'Tomorrow', photos: 0, labels: ['export', 'cold'],
    description: 'Temperature-sensitive. Keep between 2 and 8 °C.',
    subtasks: subtasks(['Print export labels', false], ['Wrap cargo', false], ['Check temperature log', false]),
    createdBy: 'Siti', created: '4 days ago',
  },
  {
    id: 'DO-24809', title: 'Container stuffing, 40ft', customer: 'Tanjong Paints', driver: 'Siti',
    status: 'todo', priority: 'high', due: '2 Oct', photos: 0, labels: ['export'],
    description: '',
    subtasks: [],
    createdBy: 'Ravi', created: '5 days ago',
  },
  {
    id: 'DO-24806', title: 'Return damaged pallets for inspection', customer: 'Redhill Printing', driver: 'Ali',
    status: 'backlog', priority: 'low', due: '4 Oct', photos: 0, labels: [],
    description: 'Customer reported three broken pallets.',
    subtasks: [],
    createdBy: 'Ali', created: '1 week ago',
  },
  {
    id: 'DO-24801', title: 'Deliver 4 crates to Changi cargo', customer: 'Bayview Foods', driver: 'Ravi',
    status: 'done', priority: 'medium', due: '29 Sep', photos: 6, labels: ['key'],
    description: '',
    subtasks: subtasks(['Deliver crates', true], ['Photo of delivered goods', true]),
    createdBy: 'Mei Ling', created: '1 week ago',
  },
  {
    id: 'DO-24798', title: 'Fumigation certificate pick-up', customer: 'Orchid Pharma', driver: 'Mei Ling',
    status: 'done', priority: 'none', due: '28 Sep', photos: 2, labels: ['export'],
    description: '',
    subtasks: [],
    createdBy: 'Daniel', created: '2 weeks ago',
  },
  {
    id: 'DO-24790', title: 'Re-deliver refused shipment', customer: 'Lumen Electronics', driver: 'Daniel',
    status: 'cancelled', priority: 'low', due: '27 Sep', photos: 0, labels: ['fragile'],
    description: 'Customer cancelled the re-delivery.',
    subtasks: [],
    createdBy: 'Siti', created: '2 weeks ago',
  },
]
