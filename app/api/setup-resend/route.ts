import { NextResponse } from 'next/server';

// Temporary test route — delete after use
export async function GET() {
  const RESEND_KEY = 're_XGLcasmD_6UH52aBoSptuCDJit1tCHxux';

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'FC Tracker <noreply@solerworks.com>',
        to: ['inbox@enzosoler.com'],
        subject: '✅ FC Tracker — teste de email',
        html: `<div style="font-family:sans-serif;background:#0B0E14;color:#fff;padding:32px;border-radius:12px;max-width:480px;margin:0 auto">
          <h2 style="color:#6366F1;margin:0 0 12px">FC Tracker ✅</h2>
          <p style="color:#94A3B8">Se chegou, o Resend está funcionando corretamente.</p>
          <p style="color:#475569;font-size:12px">noreply@solerworks.com</p>
        </div>`
      })
    });

    const result = await resp.json();
    return NextResponse.json({
      http_status: resp.status,
      ok: resp.ok,
      resend_response: result
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
