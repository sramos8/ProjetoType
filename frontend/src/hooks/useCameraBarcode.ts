import { useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface UseCameraBarcodeOptions {
  elementId: string;
  ativo: boolean;
  onLeitura: (codigo: string) => void;
  onErro?: (erro: string) => void;
}

export function useCameraBarcode({
  elementId,
  ativo,
  onLeitura,
  onErro,
}: UseCameraBarcodeOptions) {
  const scannerRef  = useRef<Html5Qrcode | null>(null);
  const ultimoRef   = useRef<string>('');
  const cooldownRef = useRef<boolean>(false);
  const rodandoRef  = useRef<boolean>(false);

  const parar = useCallback(async () => {
    if (scannerRef.current && rodandoRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch { /* ignora */ }
      rodandoRef.current = false;
    }
    scannerRef.current = null;
  }, []);

  useEffect(() => {
    if (!ativo) { parar(); return; }

    if (!navigator?.mediaDevices?.getUserMedia) {
      onErro?.('Câmera requer HTTPS. Acesse via https://');
      return;
    }

    const timer = setTimeout(async () => {
      const el = document.getElementById(elementId);
      if (!el) return;

      try {
        // formatsToSupport vai no construtor ← correção aqui
        const scanner = new Html5Qrcode(elementId, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,   // ← principal para balança
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
        });

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 280, height: 120 },
            aspectRatio: 1.777,
            disableFlip: false,
          },
          (decodedText) => {
            if (decodedText === ultimoRef.current && cooldownRef.current) return;
            ultimoRef.current   = decodedText;
            cooldownRef.current = true;
            setTimeout(() => { cooldownRef.current = false; }, 2500);
            onLeitura(decodedText);
          },
          () => { /* erro de frame — normal, ignora */ }
        );

        rodandoRef.current = true;

      } catch (e: unknown) {
        const msg = (e as Error)?.message || String(e);
        if (msg.includes('Permission') || msg.includes('NotAllowed')) {
          onErro?.('Permissão de câmera negada. Permita o acesso nas configurações.');
        } else if (msg.includes('NotFound')) {
          onErro?.('Nenhuma câmera encontrada neste dispositivo.');
        } else {
          onErro?.(msg || 'Erro ao acessar câmera');
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      parar();
    };
  }, [ativo, elementId]);

  return { parar };
}