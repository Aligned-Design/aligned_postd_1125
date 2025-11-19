import { supabase } from './supabase';

export async function seedUserBrands(userId: string) {
  try {
    const brandIds = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
    ];

    const memberships = brandIds.map((brandId) => ({
      brand_id: brandId,
      user_id: userId,
      role: 'admin' as const,
    }));

    await supabase.from('brand_members').insert(memberships);
    
    // Demo brands assigned successfully
  } catch (error) {
    // Error seeding brands - fail silently in production
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Error seeding brands for user:', error);
    }
  }
}
