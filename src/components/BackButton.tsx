'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export function BackButton() {
  const router = useRouter();

  return (
    <Button 
      variant="ghost" 
      onClick={() => router.back()} 
      className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft size={20} /> Back to Home
    </Button>
  );
}
