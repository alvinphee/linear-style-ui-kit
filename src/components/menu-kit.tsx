import {
  ContextMenuCheckboxItem, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuRadioGroup,
  ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenuCheckboxItem, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'

// Menu kits: one menu family's parts under shared names, so a list of menu
// items is written once and shown both in a dropdown (the … button) and in a
// context menu (right click). Write the items against a `kit` prop, then
// render them with DROPDOWN_MENU_KIT inside a DropdownMenuContent and with
// CONTEXT_MENU_KIT inside a ContextMenuContent:
//
//   function RowItems({ kit: K }: { kit: MenuKit }) {
//     return <K.Item onSelect={onOpen}>Open <K.Shortcut>↵</K.Shortcut></K.Item>
//   }
//
// The two families take the same props, so anything that works in one works
// in the other. Root, trigger and content stay the family's own.

// The dropdown menu's parts, for items inside a DropdownMenuContent.
export const DROPDOWN_MENU_KIT = {
  Item: DropdownMenuItem, CheckboxItem: DropdownMenuCheckboxItem, RadioGroup: DropdownMenuRadioGroup,
  RadioItem: DropdownMenuRadioItem, Label: DropdownMenuLabel, Separator: DropdownMenuSeparator,
  Shortcut: DropdownMenuShortcut, Group: DropdownMenuGroup, Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger, SubContent: DropdownMenuSubContent,
}

// The context menu's parts, for the same items inside a ContextMenuContent.
export const CONTEXT_MENU_KIT = {
  Item: ContextMenuItem, CheckboxItem: ContextMenuCheckboxItem, RadioGroup: ContextMenuRadioGroup,
  RadioItem: ContextMenuRadioItem, Label: ContextMenuLabel, Separator: ContextMenuSeparator,
  Shortcut: ContextMenuShortcut, Group: ContextMenuGroup, Sub: ContextMenuSub,
  SubTrigger: ContextMenuSubTrigger, SubContent: ContextMenuSubContent,
}

// Either kit: the type of a `kit` prop.
export type MenuKit = typeof DROPDOWN_MENU_KIT | typeof CONTEXT_MENU_KIT
