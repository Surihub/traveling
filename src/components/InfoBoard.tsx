import { useState } from 'react';
import { useLocalTours, useAccommodations, useShopping, useTransport, useMemos } from '../hooks/useTrip';
import { AccommodationBoard } from './AccommodationBoard';
import { ShoppingBoard } from './ShoppingBoard';
import { TransportBoard } from './TransportBoard';
import { MemoBoard } from './MemoBoard';
import { LocalTourBoard } from './LocalTourBoard';

interface SectionProps {
  title: string;
  emoji: string;
  count: number;
  badgeClass: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, emoji, count, badgeClass, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">{emoji}</span>
          <span className="font-semibold text-gray-800 text-sm">{title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>{count}개</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="border-t px-4 py-4">{children}</div>}
    </div>
  );
}

export function InfoBoard({ canEdit }: { canEdit: boolean }) {
  const { items: localTours } = useLocalTours();
  const { items: accommodations } = useAccommodations();
  const { items: shopping } = useShopping();
  const { items: transport } = useTransport();
  const { items: memos } = useMemos();

  return (
    <div className="space-y-3">
      <Section title="현지투어" emoji="🗺" count={localTours.length} badgeClass="bg-emerald-100 text-emerald-700">
        <LocalTourBoard canEdit={canEdit} />
      </Section>

      <Section title="숙소" emoji="🏨" count={accommodations.length} badgeClass="bg-sky-100 text-sky-700">
        <AccommodationBoard canEdit={canEdit} />
      </Section>

      <Section title="쇼핑" emoji="🛍" count={shopping.length} badgeClass="bg-rose-100 text-rose-700">
        <ShoppingBoard canEdit={canEdit} />
      </Section>

      <Section title="교통" emoji="🚆" count={transport.length} badgeClass="bg-amber-100 text-amber-700">
        <TransportBoard canEdit={canEdit} />
      </Section>

      <Section title="메모" emoji="📝" count={memos.length} badgeClass="bg-violet-100 text-violet-700" defaultOpen={false}>
        <MemoBoard canEdit={canEdit} />
      </Section>
    </div>
  );
}
