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
  driver: string
  status: Status
  priority: Priority
  due: string
  photos: number
}

// Made-up sample data: invented customers and first names only.
export const JOBS: Job[] = [
  { id: 'DO-24817', title: 'Deliver 12 pallets to Jurong warehouse', customer: 'Bayview Foods', driver: 'Ravi', status: 'progress', priority: 'urgent', due: 'Today', photos: 3 },
  { id: 'DO-24815', title: 'Collect empty crates from Tuas depot', customer: 'Lumen Electronics', driver: 'Mei Ling', status: 'progress', priority: 'high', due: 'Today', photos: 1 },
  { id: 'DO-24812', title: 'Wrap and label export cargo', customer: 'Orchid Pharma', driver: 'Daniel', status: 'todo', priority: 'medium', due: 'Tomorrow', photos: 0 },
  { id: 'DO-24809', title: 'Container stuffing, 40ft', customer: 'Tanjong Paints', driver: 'Siti', status: 'todo', priority: 'high', due: '2 Oct', photos: 0 },
  { id: 'DO-24806', title: 'Return damaged pallets for inspection', customer: 'Redhill Printing', driver: 'Ali', status: 'backlog', priority: 'low', due: '4 Oct', photos: 0 },
  { id: 'DO-24801', title: 'Deliver 4 crates to Changi cargo', customer: 'Bayview Foods', driver: 'Ravi', status: 'done', priority: 'medium', due: '29 Sep', photos: 6 },
  { id: 'DO-24798', title: 'Fumigation certificate pick-up', customer: 'Orchid Pharma', driver: 'Mei Ling', status: 'done', priority: 'none', due: '28 Sep', photos: 2 },
  { id: 'DO-24790', title: 'Re-deliver refused shipment', customer: 'Lumen Electronics', driver: 'Daniel', status: 'cancelled', priority: 'low', due: '27 Sep', photos: 0 },
]
