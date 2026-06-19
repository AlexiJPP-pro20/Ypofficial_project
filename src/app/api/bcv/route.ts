import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Fetch current BCV exchange rates
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (process.env.DOLARVZLA_API_KEY) {
      headers['x-dolarvzla-key'] = process.env.DOLARVZLA_API_KEY;
    }

    const res = await fetch('https://rates.dolarvzla.com/bcv/current.json', {
      cache: 'no-store',
      headers
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in /api/bcv route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate data', details: error.message },
      { status: 500 }
    );
  }
}
