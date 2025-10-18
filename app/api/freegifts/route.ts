import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (error) {
      console.error('Error fetching free gifts settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json({
      enabled: settings.free_gifts_enabled || false,
      conditionType: settings.free_gifts_condition_type || 'quantity',
      headline: settings.free_gifts_headline || 'Unlock Your Free Gifts!',
      progressColor: settings.free_gifts_progress_color || '#4CAF50',
      position: settings.free_gifts_position || 'bottom',
      
      tier1: {
        enabled: settings.free_gifts_tier1_enabled || false,
        threshold: settings.free_gifts_tier1_threshold || 1,
        productHandle: settings.free_gifts_tier1_product_handle || '',
        variantId: settings.free_gifts_tier1_variant_id || '',
        rewardText: settings.free_gifts_tier1_reward_text || 'Free Gift',
        unlockedMessage: settings.free_gifts_tier1_unlocked_message || '🎉 Free Gift Unlocked!',
        showUnlockedMessage: settings.free_gifts_tier1_show_unlocked_message ?? true,
        icon: settings.free_gifts_tier1_icon || '🎁',
      },
      
      tier2: {
        enabled: settings.free_gifts_tier2_enabled || false,
        threshold: settings.free_gifts_tier2_threshold || 2,
        productHandle: settings.free_gifts_tier2_product_handle || '',
        variantId: settings.free_gifts_tier2_variant_id || '',
        rewardText: settings.free_gifts_tier2_reward_text || 'Free Gift',
        unlockedMessage: settings.free_gifts_tier2_unlocked_message || '🎉 Free Gift Unlocked!',
        showUnlockedMessage: settings.free_gifts_tier2_show_unlocked_message ?? true,
        icon: settings.free_gifts_tier2_icon || '🎁',
      },
      
      tier3: {
        enabled: settings.free_gifts_tier3_enabled || false,
        threshold: settings.free_gifts_tier3_threshold || 3,
        productHandle: settings.free_gifts_tier3_product_handle || '',
        variantId: settings.free_gifts_tier3_variant_id || '',
        rewardText: settings.free_gifts_tier3_reward_text || 'Free Gift',
        unlockedMessage: settings.free_gifts_tier3_unlocked_message || '🎉 Free Gift Unlocked!',
        showUnlockedMessage: settings.free_gifts_tier3_show_unlocked_message ?? true,
        icon: settings.free_gifts_tier3_icon || '🎁',
      },
    });
  } catch (error) {
    console.error('Error fetching free gifts settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, ...freeGiftsSettings } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // Update free gifts settings
    const { data, error } = await supabase
      .from('settings')
      .update({
        free_gifts_enabled: freeGiftsSettings.enabled,
        free_gifts_condition_type: freeGiftsSettings.conditionType,
        free_gifts_headline: freeGiftsSettings.headline,
        free_gifts_progress_color: freeGiftsSettings.progressColor,
        free_gifts_position: freeGiftsSettings.position,
        
        // Tier 1
        free_gifts_tier1_enabled: freeGiftsSettings.tier1.enabled,
        free_gifts_tier1_threshold: freeGiftsSettings.tier1.threshold,
        free_gifts_tier1_product_handle: freeGiftsSettings.tier1.productHandle,
        free_gifts_tier1_variant_id: freeGiftsSettings.tier1.variantId,
        free_gifts_tier1_reward_text: freeGiftsSettings.tier1.rewardText,
        free_gifts_tier1_unlocked_message: freeGiftsSettings.tier1.unlockedMessage,
        free_gifts_tier1_show_unlocked_message: freeGiftsSettings.tier1.showUnlockedMessage,
        free_gifts_tier1_icon: freeGiftsSettings.tier1.icon,
        
        // Tier 2
        free_gifts_tier2_enabled: freeGiftsSettings.tier2.enabled,
        free_gifts_tier2_threshold: freeGiftsSettings.tier2.threshold,
        free_gifts_tier2_product_handle: freeGiftsSettings.tier2.productHandle,
        free_gifts_tier2_variant_id: freeGiftsSettings.tier2.variantId,
        free_gifts_tier2_reward_text: freeGiftsSettings.tier2.rewardText,
        free_gifts_tier2_unlocked_message: freeGiftsSettings.tier2.unlockedMessage,
        free_gifts_tier2_show_unlocked_message: freeGiftsSettings.tier2.showUnlockedMessage,
        free_gifts_tier2_icon: freeGiftsSettings.tier2.icon,
        
        // Tier 3
        free_gifts_tier3_enabled: freeGiftsSettings.tier3.enabled,
        free_gifts_tier3_threshold: freeGiftsSettings.tier3.threshold,
        free_gifts_tier3_product_handle: freeGiftsSettings.tier3.productHandle,
        free_gifts_tier3_variant_id: freeGiftsSettings.tier3.variantId,
        free_gifts_tier3_reward_text: freeGiftsSettings.tier3.rewardText,
        free_gifts_tier3_unlocked_message: freeGiftsSettings.tier3.unlockedMessage,
        free_gifts_tier3_show_unlocked_message: freeGiftsSettings.tier3.showUnlockedMessage,
        free_gifts_tier3_icon: freeGiftsSettings.tier3.icon,
        
        updated_at: new Date().toISOString(),
      })
      .eq('store_id', storeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating free gifts settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    // ⚡ CACHE INVALIDATION: Increment cache_version to invalidate edge function cache
    const { error: cacheError } = await supabase.rpc('increment_cache_version', {
      store_id_param: storeId
    });

    if (cacheError) {
      console.warn('Warning: Failed to invalidate cache, but settings were saved:', cacheError);
    } else {
      console.log('✅ Cache invalidated for store:', storeId);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating free gifts settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

