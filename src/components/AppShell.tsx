
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AreaChart,
  BarChart2,
  ChevronRight,
  Diamond,
  FileClock,
  Gem,
  History,
  LayoutGrid,
  ListTodo,
  Puzzle,
  Replace,
  Settings,
  Sparkles,
  Users,
  Warehouse,
  TestTubeDiagonal,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { cn } from '@/lib/utils';
import { Toaster } from './ui/toaster';

const menuItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutGrid,
  },
  {
    label: 'Sarin Tracker',
    icon: Diamond,
    subItems: [
      { label: 'Packet Entry', href: '/sarin/entry' },
      { label: 'Return Lot', href: '/sarin/return' },
      { label: 'Recent Entries', href: '/sarin/recent' },
      { label: 'Lot Analysis', href: '/sarin/analysis' },
    ],
  },
  {
    label: 'Laser Tracker',
    icon: Gem,
    subItems: [
      { label: 'New Laser Lot', href: '/laser/entry' },
      { label: 'Return Lot', href: '/laser/return' },
      { label: 'Recent Entries', href: '/laser/recent' },
      { label: 'Lot Analysis', href: '/laser/analysis' },
    ],
  },
  {
    label: '4P & 4P Teching',
    icon: Puzzle,
    subItems: [
      { label: '4P Teching Entry', href: '/fourp-teching/entry' },
      { label: '4P Return', href: '/fourp/return' },
    ],
  },
  {
    label: 'Udhda (Single Packet)',
    icon: FileClock,
    subItems: [
      { label: 'Udhda Entry', href: '/udhdha/entry' },
      { label: 'Udhda Return', href: '/udhdha/return' },
      { label: 'Udhda Report', href: '/udhdha/report' },
    ],
  },
  {
    label: 'Packet Reassignment',
    href: '/reassignment',
    icon: Replace,
  },
  {
    label: 'Packet History',
    href: '/packet-history',
    icon: History,
  },
   {
    label: 'Reports Center',
    icon: AreaChart,
    subItems: [
        { label: 'Production Analysis', href: '/analysis-report' },
        { label: 'Jiram Report', href: '/jiram-report' },
    ]
  },
   {
    label: 'AI Insights',
    href: '/insights',
    icon: Sparkles,
  },
  {
    label: 'Control Panel',
    href: '/control-panel',
    icon: Settings,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar className="print:hidden">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link href="/">
                <span className="text-2xl animate-pulse">💠</span>
              </Link>
            </Button>
            <div className="flex flex-col">
              <h1 className="font-display text-lg font-bold truncate animate-fade-in-slide-up">
                ATIXE DIAMOND
              </h1>
              <p 
                className="text-xs italic text-muted-foreground animate-fade-in-slide-up tracking-wider" 
                style={{animationDelay: '0.2s'}}>
                  by <span className="animate-glow font-semibold text-foreground/80 hover:text-foreground transition-colors">RAVII</span>
              </p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) =>
              item.subItems ? (
                <Collapsible key={item.label} defaultOpen={item.subItems.some(sub => pathname.startsWith(sub.href))}>
                  <SidebarMenuItem className="p-0">
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className="justify-between w-full"
                        variant="ghost"
                      >
                        <div className="flex items-center gap-2">
                          <item.icon size={18} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 [&[data-state=open]>svg]:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.subItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.href}>
                          <Link href={subItem.href} legacyBehavior passHref>
                            <SidebarMenuSubButton isActive={pathname === subItem.href}>
                              {subItem.label}
                            </SidebarMenuSubButton>
                          </Link>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.label}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      variant="ghost"
                    >
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center justify-between border-b bg-card px-4 md:hidden print:hidden">
          <Link href="/" className="flex items-center gap-2 font-display font-bold">
            <span className="text-xl">💠</span>
            <span>ATIXE DIAMOND</span>
          </Link>
          <SidebarTrigger>
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Toggle navigation</span>
          </SidebarTrigger>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}
