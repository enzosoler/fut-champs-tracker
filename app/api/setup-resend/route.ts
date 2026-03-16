import { NextResponse } from 'next/server';

// Temporary setup route — will be deleted after use
export async function GET() {
  const RESEND_KEY = 're_XGLcasmD_6UH52aBoSptuCDJit1tCHxux';

  try {
    // 1. Get domains
    const domainsResp = await fetch('https://api.resend.com/domains', {
      headers: { 'Authorization': `Bearer ${RESEND_KEY}` }
    });
    const domainsData = await domainsResp.json();

    if (!domainsResp.ok) {
      return NextResponse.json({ step: 'get_domains', error: domainsData });
    }

    const domain = domainsData.data?.find((d: any) => d.name === 'solerworks.com');

    // 2. Create new API key scoped to solerworks.com
    const body: any = {
      name: 'Supabase SMTP - FC Tracker',
      permission: 'sending_access',
    };
    if (domain?.id) body.domain_id = domain.id;

    const createResp = await fetch('https://api.resend.com/api-keys', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const newKey = await createResp.json();

    if (!createResp.ok) {
      return NextResponse.json({ step: 'create_key', error: newKey, domain_id: domain?.id });
    }

    // 3. Send a test email to verify
    const testResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${newKey.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'FC Tracker <noreply@solerworks.com>',
        to: ['inbox@enzosoler.com'],
        subject: '✅ FC Tracker — SMTP funcionando!',
        html: `<div style="font-family:sans-serif;background:#0B0E14;color:#fff;padding:32px;border-radius:12px">
          <h2 style="color:#6366F1">FC Tracker ✅</h2>
          <p>O SMTP está configurado e funcionando corretamente.</p>
          <p style="color:#94A3B8;font-size:12px">Enviado via Resend · noreply@solerworks.com</p>
        </div>`
      })
    });
    const testResult = await testResp.json();

    return NextResponse.json({
      ok: true,
      new_key_id: newKey.id,
      new_key_token: newKey.token,
      domain_used: domain?.name ?? 'all domains',
      test_email: testResp.ok ? 'sent ✅' : testResult
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
