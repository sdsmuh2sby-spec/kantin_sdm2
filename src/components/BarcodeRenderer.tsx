import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface BarcodeRendererProps {
  value: string;
  type?: 'barcode' | 'qrcode';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  type = 'barcode',
  width = 1.6,
  height = 42,
  displayValue = true,
  fontSize = 11,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (type === 'barcode' && svgRef.current) {
      try {
        JsBarcode(svgRef.current, value || '0000000', {
          format: 'CODE128',
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: fontSize,
          margin: 4,
          background: 'transparent',
          lineColor: '#1e293b',
        });
      } catch (err) {
        console.warn('Barcode rendering error:', err);
      }
    } else if (type === 'qrcode' && canvasRef.current) {
      try {
        QRCode.toCanvas(
          canvasRef.current,
          value || 'KANTINKU',
          {
            width: height + 24,
            margin: 1,
            color: {
              dark: '#1e293b',
              light: '#ffffff',
            },
          },
          (err) => {
            if (err) console.warn('QR code render error:', err);
          }
        );
      } catch (err) {
        console.warn('QR render error:', err);
      }
    }
  }, [value, type, width, height, displayValue, fontSize]);

  if (type === 'qrcode') {
    return (
      <div className="flex flex-col items-center">
        <canvas ref={canvasRef} className="max-w-full" />
        {displayValue && (
          <span className="text-[10px] font-mono text-slate-600 mt-0.5">{value}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex justify-center max-w-full overflow-hidden">
      <svg ref={svgRef} className="max-w-full" />
    </div>
  );
};
