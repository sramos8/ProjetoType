import { useEffect, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface UseCameraBarcodeOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  ativo: boolean;
  onLeitura: (codigo: string) => void;
  onErro?: (erro: string) => void;
}

export function useCameraBarcode({ videoRef, ativo, onLeitura, onErro }: UseCameraBarcodeOptions) {
  const readerRef   = useRef<BrowserMultiFormatReader | null>(null);
  const ultimoRef   = useRef<string>('');
  const cooldownRef = useRef<boolean>(false);

  const parar = useCallback(() => {
    readerRef.current?.reset();
    readerRef.current = null;
  }, []);

  useEffect(() => {
    if (!ativo || !videoRef.current) { parar(); return; }

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.decodeFromVideoDevice(
      null, // usa câmera traseira por padrão
      videoRef.current,
      (resultado, erro) => {
        if (resultado) {
          const codigo = resultado.getText();

          // Debounce — evita leitura duplicada do mesmo código
          if (codigo === ultimoRef.current && cooldownRef.current) return;
          ultimoRef.current   = codigo;
          cooldownRef.current = true;
          setTimeout(() => { cooldownRef.current = false; }, 2000);

          onLeitura(codigo);
        } else if (erro && !(erro instanceof NotFoundException)) {
          // NotFoundException é normal quando não há código na câmera
        }
      }
    ).catch(e => {
      onErro?.(e?.message || 'Erro ao acessar câmera');
    });

    return parar;
  }, [ativo, videoRef, onLeitura, onErro, parar]);

  return { parar };
}