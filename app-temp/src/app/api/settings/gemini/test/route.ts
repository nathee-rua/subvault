// ============================================
// SubVault - Google Gemini API Models & Test Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, action, selectedModel } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'Google Gemini API Key is required' }, { status: 400 });
    }

    // A. FETCH AVAILABLE MODELS
    if (action === 'fetch_models') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        return NextResponse.json({ error: data.error?.message || 'Invalid Gemini API Key or project quota error' }, { status: 400 });
      }

      // Filter generateContent models
      const rawModels: any[] = data.models || [];
      const supportedModels = rawModels
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => m.name.replace('models/', ''));

      // Default model fallback list if empty
      const finalModels = supportedModels.length > 0
        ? supportedModels
        : ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'];

      return NextResponse.json({
        ok: true,
        models: finalModels,
      });
    }

    // B. TEST CONNECTION WITH PROMPT
    if (action === 'test_connection') {
      const modelToTest = selectedModel || 'gemini-2.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTest}:generateContent?key=${apiKey}`;

      const testRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with exactly: Connection Successful to SubVault AI Engine' }] }],
        }),
      });

      const testData = await testRes.json();

      if (!testRes.ok || testData.error) {
        return NextResponse.json({ error: testData.error?.message || `Failed to test Gemini model ${modelToTest}` }, { status: 400 });
      }

      const responseText = testData.candidates?.[0]?.content?.parts?.[0]?.text || 'Connection Successful';

      return NextResponse.json({
        ok: true,
        model: modelToTest,
        responseText,
        message: 'Connection successful',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
