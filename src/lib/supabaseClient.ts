'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database';

// Cliente Supabase para el FRONTEND (usa cookies, compatible con middleware de auth-helpers)
export const supabase = createClientComponentClient<Database>();


