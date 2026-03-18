import { useEffect, useRef, useCallback } from 'react';

interface UseBarcodeOptions {
  onLeitura: (codigo: string) => void;
  ativo?: boolean;
  minLength?: number;    // tamanho mínimo para considerar como código
  timeout?: number;      // ms entre caracteres para detectar leitor
}

export function useBarcode({
  onLeitura,
  ativo = true,
  minLength = 3,
  timeout = 80,
}: UseBarcodeOptions) {
  const bufferRef   = useRef('');
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inicioRef   = useRef<number>(0);

  const processar = useCallback(() => {
    const codigo = bufferRef.current.trim();
    bufferRef.current = '';
    if (codigo.length >= minLength) {
      onLeitura(codigo);
    }
  }, [onLeitura, minLength]);

  useEffect(() => {
    if (!ativo) return;

    const handler = (e: KeyboardEvent) => {
      // Ignora se o foco está em input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === 'Enter') {
        if (timerRef.current) clearTimeout(timerRef.current);
        processar();
        return;
      }

      // Aceita apenas caracteres imprimíveis
      if (e.key.length !== 1) return;

      const agora = Date.now();

      // Se passou tempo demais desde o último char, reseta o buffer
      if (bufferRef.current.length > 0 && agora - inicioRef.current > timeout * bufferRef.current.length) {
        bufferRef.current = '';
      }

      if (bufferRef.current.length === 0) inicioRef.current = agora;
      bufferRef.current += e.key;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(processar, timeout + 50);
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ativo, timeout, processar]);
}