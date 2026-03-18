import { useState, useEffect } from 'react';

export function useResponsive() {
  const [largura, setLargura] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1024; // fallback (desktop)
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = () => setLargura(window.innerWidth);
    window.addEventListener('resize', handler);

    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    isMobile: largura < 640,
    isTablet: largura >= 640 && largura < 1024,
    isDesktop: largura >= 1024,
    largura,
  };
}