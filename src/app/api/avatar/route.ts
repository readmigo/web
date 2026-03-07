import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const API_BASE_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function getAccessToken(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  return (token?.accessToken as string) || null;
}

export async function POST(req: NextRequest) {
  const accessToken = await getAccessToken(req);
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const backendForm = new FormData();
  backendForm.append('file', file, 'avatar.jpg');

  try {
    const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: backendForm,
    });
    const data = await response.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  const accessToken = await getAccessToken(req);
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json().catch(() => null);
    return NextResponse.json(data ?? {}, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 502 });
  }
}
