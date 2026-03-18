import { useState, useEffect } from 'react';

export function useResponsive() {
  const [largura, setLargura] = useState(window.innerWidth);

  useEffect(() => {
    const handler = () => setLargura(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    isMobile:  largura < 640,
    isTablet:  largura >= 640 && largura < 1024,
    isDesktop: largura >= 1024,
    largura,
  };
}