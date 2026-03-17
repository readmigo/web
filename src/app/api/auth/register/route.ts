import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const API_BASE_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Invalid input';
    return NextResponse.json({ message }, { status: 422 });
  }

  const { name, email, password } = parsed.data;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = data?.message ?? 'Registration failed';
      return NextResponse.json({ message }, { status: response.status });
    }

    return NextResponse.json(data ?? {}, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Service unavailable, please try again later' }, { status: 502 });
  }
}
