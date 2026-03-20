import { useEffect, useRef, useCallback } from 'react';
import {
  BrowserMultiFormatReader,
  NotFoundException,
  DecodeHintType,
  BarcodeFormat,
} from '@zxing/library';

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
  const streamRef   = useRef<MediaStream | null>(null);

  const parar = useCallback(() => {
    readerRef.current?.reset();
    readerRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!ativo || !videoRef.current) { parar(); return; }

    if (!navigator?.mediaDevices?.getUserMedia) {
      onErro?.('Câmera requer HTTPS. Acesse via https://');
      return;
    }

    // ── Hints para melhorar leitura de código de barras ──────
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.ITF,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);  // tenta mais duramente encontrar o código

    const reader = new BrowserMultiFormatReader(hints, 300); // tenta a cada 300ms
    readerRef.current = reader;

    // ── Solicitar câmera traseira com foco contínuo ───────────
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: 'environment' }, // câmera traseira
        width:  { ideal: 1280 },
        height: { ideal: 720 },
        focusMode: 'continuous',              // foco automático contínuo
      } as MediaTrackConstraints & { focusMode?: string },
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        streamRef.current = stream;

        if (!videoRef.current) { parar(); return; }
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');

        return videoRef.current.play().then(() => {
          if (!videoRef.current) return;

          // Ativa foco contínuo na track se suportado
          const track = stream.getVideoTracks()[0];
          if (track && typeof (track as any).applyConstraints === 'function') {
            (track as any).applyConstraints({
              advanced: [{ focusMode: 'continuous' }]
            }).catch(() => {});
          }

          // Inicia decodificação no elemento de vídeo
          reader.decodeFromStream(stream, videoRef.current!, (resultado, erro) => {
            if (resultado) {
              const codigo = resultado.getText();
              if (codigo === ultimoRef.current && cooldownRef.current) return;
              ultimoRef.current   = codigo;
              cooldownRef.current = true;
              setTimeout(() => { cooldownRef.current = false; }, 2500);
              onLeitura(codigo);
            } else if (erro && !(erro instanceof NotFoundException)) {
              // ignora NotFoundException — normal quando não há código na tela
            }
          });
        });
      })
      .catch(e => {
        const msg = e?.message || e?.name || '';
        if (msg.includes('Permission') || msg.includes('NotAllowed')) {
          onErro?.('Permissão de câmera negada. Permita o acesso nas configurações.');
        } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
          onErro?.('Nenhuma câmera encontrada neste dispositivo.');
        } else if (msg.includes('getUserMedia') || msg.includes('mediaDevices')) {
          onErro?.('Câmera requer HTTPS. Acesse via https://padariasistemagestao.duckdns.org');
        } else {
          onErro?.(msg || 'Erro ao acessar câmera');
        }
      });

    return parar;
  }, [ativo, videoRef, onLeitura, onErro, parar]);

  return { parar };
}