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

    // ── Verificar se câmera está disponível ───────────────
    if (!navigator?.mediaDevices?.getUserMedia) {
      onErro?.(
        'Câmera indisponível. A câmera requer HTTPS ou localhost. ' +
        'Acesse via https:// para usar este recurso.'
      );
      return;
    }

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.decodeFromVideoDevice(
      null,
      videoRef.current,
      (resultado, erro) => {
        if (resultado) {
          const codigo = resultado.getText();
          if (codigo === ultimoRef.current && cooldownRef.current) return;
          ultimoRef.current   = codigo;
          cooldownRef.current = true;
          setTimeout(() => { cooldownRef.current = false; }, 2000);
          onLeitura(codigo);
        } else if (erro && !(erro instanceof NotFoundException)) {
          // NotFoundException é normal — ignora
        }
      }
    ).catch(e => {
      const msg = e?.message || '';
      if (msg.includes('getUserMedia') || msg.includes('mediaDevices')) {
        onErro?.('Câmera requer HTTPS. Configure SSL no servidor para usar a câmera.');
      } else if (msg.includes('Permission') || msg.includes('permission')) {
        onErro?.('Permissão de câmera negada. Permita o acesso nas configurações do navegador.');
      } else if (msg.includes('NotFound') || msg.includes('Devices')) {
        onErro?.('Nenhuma câmera encontrada neste dispositivo.');
      } else {
        onErro?.(msg || 'Erro ao acessar câmera');
      }
    });

    return parar;
  }, [ativo, videoRef, onLeitura, onErro, parar]);

  return { parar };
}