import QRCode from 'qrcode';
import { site } from '../../site.config.mjs';
export async function GET() {
  const buffer = await QRCode.toBuffer(site.downloadUrl, { type: 'png', width: 480, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#20231E', light: '#FFFFFF' } });
  return new Response(new Uint8Array(buffer), { headers: { 'Content-Type': 'image/png' } });
}
