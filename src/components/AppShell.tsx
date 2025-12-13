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
  PenSquare,
  GitCompare,
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
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { cn } from '@/lib/utils';
import { Toaster } from './ui/toaster';
import { useAutoBackup } from '@/hooks/useAutoBackup';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useSystemState } from '@/hooks/useSystemState';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AUTO_BACKUP_SETTINGS_KEY, SYSTEM_SETTINGS_KEY } from '@/lib/constants';
import { AutoBackupSettings, SystemSettings } from '@/lib/types';
import { isWithinInterval, set, parse } from 'date-fns';
import { useLayout } from '@/hooks/useLayout';


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
  { label: 'Chalu Entry', href: '/chalu-entry', icon: PenSquare },
  {
    label: "Tools",
    icon: Wrench,
    subItems: [
      { label: 'Box Sorting', href: '/box-sorting', icon: Box, },
      { label: 'Packet Verifier', href: '/packet-verifier', icon: ListTodo, },
      { label: 'Packet Matcher', href: '/packet-matcher', icon: GitCompare, },
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

const PremiumDiamondIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path className="facet" d="M12 2L6 8H18L12 2Z" fillOpacity="0.7"/>
    <path className="facet" d="M6 8L12 22L18 8H6Z" fillOpacity="0.8"/>
    <path className="facet" d="M6 8L2 9L12 22L6 8Z" fillOpacity="0.7"/>
    <path className="facet" d="M18 8L22 9L12 22L18 8Z" fillOpacity="0.7"/>
    <path className="facet" d="M2 9L6 8H18L22 9L12 11L2 9Z" fillOpacity="0.9"/>
  </svg>
);

const YouTubePlayer = () => {
    const [systemSettings] = useLocalStorage<SystemSettings>(SYSTEM_SETTINGS_KEY, { youtubeLink: 'https://www.youtube.com/watch?v=8-lR3VWJzCg', videoStartTime: '09:00', videoEndTime: '18:30' });
    const [embedUrl, setEmbedUrl] = React.useState('');
    const [videoId, setVideoId] = React.useState('');
    const [canPlay, setCanPlay] = React.useState(false);

    React.useEffect(() => {
        const checkTime = () => {
          const now = new Date();
          const startTimeString = systemSettings.videoStartTime || '00:00';
          const endTimeString = systemSettings.videoEndTime || '23:59';

          try {
            const startTime = parse(startTimeString, 'HH:mm', new Date());
            const endTime = parse(endTimeString, 'HH:mm', new Date());
            setCanPlay(isWithinInterval(now, { start: startTime, end: endTime }));
          } catch(e) {
            console.error("Invalid time format in settings", e);
            setCanPlay(false);
          }
        };
        checkTime();
        const interval = setInterval(checkTime, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [systemSettings.videoStartTime, systemSettings.videoEndTime]);


    React.useEffect(() => {
        try {
            const url = new URL(systemSettings.youtubeLink);
            let currentVideoId;
            if (url.hostname === 'youtu.be') {
                currentVideoId = url.pathname.slice(1);
            } else {
                currentVideoId = url.searchParams.get('v');
            }
            if (currentVideoId) {
                setVideoId(currentVideoId);
            } else {
                setVideoId('');
            }
        } catch (error) {
            console.error("Invalid YouTube URL:", error);
            setVideoId('');
        }
    }, [systemSettings.youtubeLink]);

    React.useEffect(() => {
        if (videoId && canPlay) {
            setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0`);
        } else {
            setEmbedUrl('');
        }
    }, [videoId, canPlay]);

    if (!videoId || !canPlay) {
        return null;
    }

    return (
        <div className="p-2">
            <div className="aspect-video bg-black rounded-lg">
                <iframe
                    className="w-full h-full rounded-lg pointer-events-none"
                    src={embedUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    )
}


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useAutoBackup();
  const { resetDeleteButton } = useSystemState();
  const { isFullscreen } = useLayout();

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


  if (isFullscreen) {
    return (
        <>
            {children}
            <Toaster />
        </>
    );
  }

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
                 <span className="relative w-[1.5ch] h-[1em] inline-flex items-center justify-center">
                    <span className="absolute inset-0 animate-text-o-out flex items-center justify-center">O</span>
                    <PremiumDiamondIcon className="absolute m-auto h-[0.9em] w-[0.9em] animate-diamond-in" style={{fill: 'hsl(var(--foreground))'}} />
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
                  <Link href={item.href} legacyBehavior={false}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <span>
                        <item.icon size={18} />
                        <span>{item.label}</span>
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </div>
              )
            )}
          </Accordion>
        </SidebarContent>
         <SidebarFooter>
          <YouTubePlayer />
        </SidebarFooter>
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
