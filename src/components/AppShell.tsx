
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
  Box,
  ClipboardCheck,
  Wrench,
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
import { useAutoBackup } from '@/hooks/useAutoBackup';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useSystemState } from '@/hooks/useSystemState';

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
    label: "Tools",
    icon: Wrench,
    subItems: [
      { label: 'Box Sorting', href: '/box-sorting', icon: Box, },
      { label: 'Packet Verifier', href: '/packet-verifier', icon: ListTodo, },
      { label: 'Kapan Verifier', href: '/kapan-verifier', icon: ClipboardCheck, },
      { label: 'Packet Reassignment', href: '/reassignment', icon: Replace, },
      { label: 'Packet History', href: '/packet-history', icon: History, },
      { label: 'Kapan Checker', href: '/kapan-checker', icon: ClipboardCheck, },
    ]
  },
   {
    label: 'Reports Center',
    icon: AreaChart,
    subItems: [
        { label: 'Analysis Reports', href: '/analysis-report' },
        { label: 'Production Reports', href: '/production-report' },
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

const SparklingDiamondIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 120 120"
    xmlns="http://www.w3.org/2000/svg"
    fill="black"
    stroke="black"
    {...props}
  >
    {/* Diamond shape */}
    <path
      d="M60 100 L20 40 L40 20 L80 20 L100 40 Z"
      fill="black"
    />
    <path
      d="M20 40 L60 100 L100 40 L80 20 L40 20 Z"
      fill="none"
      stroke="black"
      strokeWidth="3"
    />
    {/* Facet lines */}
    <path d="M40 20 L60 40 L80 20" stroke="black" strokeWidth="3" fill="none" />
    <path d="M60 40 L60 100" stroke="black" strokeWidth="3" fill="none" />
    <path d="M40 20 L60 100" stroke="black" strokeWidth="3" fill="none" />
    <path d="M80 20 L60 100" stroke="black" strokeWidth="3" fill="none" />

    {/* Sparkle lines left */}
    <path d="M10 50 L20 45" stroke="black" strokeWidth="3" />
    <path d="M8 40 L18 38" stroke="black" strokeWidth="3" />
    <path d="M12 30 L22 32" stroke="black" strokeWidth="3" />

    {/* Sparkle lines right */}
    <path d="M110 50 L100 45" stroke="black" strokeWidth="3" />
    <path d="M112 40 L102 38" stroke="black" strokeWidth="3" />
    <path d="M108 30 L98 32" stroke="black" strokeWidth="3" />
  </svg>
);




export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useAutoBackup();
  const { resetDeleteButton } = useSystemState();

  // Hide AI Insights and combine reports
  const updatedMenuItems = menuItems.map(item => {
    if (item.label === 'Reports Center') {
      return {
        ...item,
        label: 'Reports',
        subItems: [
          { label: 'Analysis Dashboard', href: '/analysis-report' },
          { label: 'Production Report', href: '/production-report' },
          { label: 'Jiram Verification', href: '/jiram-report' },
        ],
      };
    }
    return item;
  }).filter(item => item.label !== 'AI Insights');


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
              <h1 className="font-display text-lg font-bold truncate animate-fade-in-slide-up cursor-pointer flex items-center" onClick={resetDeleteButton}>
                <span>ATIXE DIAM</span>
                 <span className="relative w-[1ch] h-[1em] inline-flex items-center justify-center">
                    <span className="absolute inset-0 animate-text-o-out flex items-center justify-center">O</span>
                    <SparklingDiamondIcon className="absolute m-auto h-[0.7em] w-[0.7em] animate-diamond-in text-primary-foreground" />
                </span>
                <span>ND</span>
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
          <Accordion type="multiple" className="w-full">
            {updatedMenuItems.map((item) =>
              item.subItems ? (
                <AccordionItem value={item.label} key={item.label} className="border-none">
                  <AccordionTrigger className="py-2 px-3 text-sm rounded-md hover:bg-sidebar-accent hover:no-underline">
                    <div className="flex items-center gap-2">
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-6">
                    <SidebarMenuSub>
                      {item.subItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.href}>
                          <Link href={subItem.href}>
                            <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                              <a>{subItem.label}</a>
                            </SidebarMenuSubButton>
                          </Link>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </AccordionContent>
                </AccordionItem>
              ) : (
                <div key={item.label} className="px-3">
                  <Link href={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <a>
                        <item.icon size={18} />
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </Link>
                </div>
              )
            )}
          </Accordion>
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
