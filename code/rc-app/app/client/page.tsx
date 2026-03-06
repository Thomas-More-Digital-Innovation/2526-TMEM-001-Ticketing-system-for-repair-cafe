'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/lib/socket';

interface Voorwerp {
  voorwerpId: number;
  volgnummer: string;
  voorwerpStatus: {
    naam: string;
  };
}

interface GroupedVoorwerpen {
  afgeleverd: Voorwerp[];
  inBehandeling: Voorwerp[];
  klaar: Voorwerp[];
}

const EMPTY_GROUPED_ITEMS: GroupedVoorwerpen = {
  afgeleverd: [],
  inBehandeling: [],
  klaar: []
};

function normalizeGroupedVoorwerpen(data: unknown): GroupedVoorwerpen {
  if (!data || typeof data !== 'object') {
    return EMPTY_GROUPED_ITEMS;
  }

  const grouped = data as Partial<GroupedVoorwerpen>;

  return {
    afgeleverd: Array.isArray(grouped.afgeleverd) ? grouped.afgeleverd : [],
    inBehandeling: Array.isArray(grouped.inBehandeling) ? grouped.inBehandeling : [],
    klaar: Array.isArray(grouped.klaar) ? grouped.klaar : []
  };
}

export default function ClientView() {
  const [items, setItems] = useState<GroupedVoorwerpen>(EMPTY_GROUPED_ITEMS);
  const [isLoading, setIsLoading] = useState(true);
  const { socket, isConnected } = useSocket();
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollDirectionRef = useRef<'down' | 'up'>('down');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // Public endpoint for customer display
        const response = await fetch('/api/voorwerpen/status');
        const data = await response.json();

        if (!response.ok) {
          console.error('Error response fetching items:', data);
          setItems(EMPTY_GROUPED_ITEMS);
          return;
        }

        setItems(normalizeGroupedVoorwerpen(data));
      } catch (error) {
        console.error('Error fetching items:', error);
        setItems(EMPTY_GROUPED_ITEMS);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchItems();

    // Listen for WebSocket updates
    if (socket) {
      socket.on('voorwerpen-updated', (data: unknown) => {
        console.log('Received WebSocket update');
        setItems(normalizeGroupedVoorwerpen(data));
      });

      return () => {
        socket.off('voorwerpen-updated');
      };
    }
  }, [socket]);

  // Auto-scroll effect
  useEffect(() => {
    const startAutoScroll = () => {
      const scrollStep = 1; // Pixels per step
      const scrollSpeed = 10; // Milliseconds between steps
      const pauseDuration = 1000; // Pause at top/bottom in milliseconds

      const autoScroll = () => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        
        // If page doesn't need scrolling, don't scroll
        if (maxScroll <= 0) return;

        const currentScroll = window.scrollY;

        if (scrollDirectionRef.current === 'down') {
          if (currentScroll >= maxScroll) {
            // Reached bottom, pause then reverse
            if (scrollIntervalRef.current) {
              clearInterval(scrollIntervalRef.current);
            }
            setTimeout(() => {
              scrollDirectionRef.current = 'up';
              scrollIntervalRef.current = setInterval(autoScroll, scrollSpeed);
            }, pauseDuration);
          } else {
            window.scrollBy(0, scrollStep);
          }
        } else {
          if (currentScroll <= 0) {
            // Reached top, pause then reverse
            if (scrollIntervalRef.current) {
              clearInterval(scrollIntervalRef.current);
            }
            setTimeout(() => {
              scrollDirectionRef.current = 'down';
              scrollIntervalRef.current = setInterval(autoScroll, scrollSpeed);
            }, pauseDuration);
          } else {
            window.scrollBy(0, -scrollStep);
          }
        }
      };

      scrollIntervalRef.current = setInterval(autoScroll, scrollSpeed);
    };

    // Start autoscroll after content loads
    if (!isLoading) {
      const timer = setTimeout(startAutoScroll, 1000);
      return () => {
        clearTimeout(timer);
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
        }
      };
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#03091C] flex justify-center items-center">
        <span className="text-white text-2xl font-atkinson-hyperlegible">Laden...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03091C] flex justify-center items-start p-5 lg:p-10 font-atkinson-hyperlegible">
      {/* Connection Status Indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`px-3 py-1 rounded-full text-xs ${isConnected ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {isConnected ? '● Live' : '● Offline'}
        </div>
      </div>
      
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-12 lg:gap-12">
        {/* Afgegeven */}
        <div className="flex-1 flex flex-col items-center gap-5">
          <h2 className="text-white font-atkinson-hyperlegible text-2xl font-normal">Afgeleverd</h2>
          <div className="w-full flex flex-col gap-5">
            {items.afgeleverd.length === 0 ? (
              <div className="text-white/50 text-center py-8">Geen items</div>
            ) : (
              items.afgeleverd.map((item) => (
                <div
                  key={item.voorwerpId}
                  className="w-full h-32 lg:h-44 flex items-center justify-center rounded-md bg-gray-400"
                >
                  <span className="text-black font-atkinson-hyperlegible text-4xl font-normal">
                    {item.volgnummer}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* In behandeling */}
        <div className="flex-1 flex flex-col items-center gap-5">
          <h2 className="text-white font-atkinson-hyperlegible text-2xl font-normal">In behandeling</h2>
          <div className="w-full flex flex-col gap-5">
            {items.inBehandeling.length === 0 ? (
              <div className="text-white/50 text-center py-8">Geen items</div>
            ) : (
              items.inBehandeling.map((item) => (
                <div
                  key={item.voorwerpId}
                  className="w-full h-32 lg:h-44 flex items-center justify-center rounded-md bg-[#ED5028]"
                >
                  <span className="text-black font-atkinson-hyperlegible text-4xl font-normal">
                    {item.volgnummer}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Klaar */}
        <div className="flex-1 flex flex-col items-center gap-5">
          <h2 className="text-white font-atkinson-hyperlegible text-2xl font-normal">Klaar</h2>
          <div className="w-full flex flex-col gap-5">
            {items.klaar.length === 0 ? (
              <div className="text-white/50 text-center py-8">Geen items</div>
            ) : (
              items.klaar.map((item) => (
                <div
                  key={item.voorwerpId}
                  className="w-full h-32 lg:h-44 flex items-center justify-center rounded-md bg-green-500"
                >
                  <span className="text-black font-atkinson-hyperlegible text-4xl font-normal">
                    {item.volgnummer}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
