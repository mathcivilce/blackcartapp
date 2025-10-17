import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET announcement settings
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
      console.error('Error fetching announcement settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Transform database format to API format
    return NextResponse.json({
      enabled: settings?.announcement_enabled ?? false,
      text: settings?.announcement_text || 'BUY 1 GET 2 FREE',
      textColor: settings?.announcement_text_color || '#FFFFFF',
      backgroundColor: settings?.announcement_background_color || '#000000',
      position: settings?.announcement_position || 'top',
      countdownEnabled: settings?.announcement_countdown_enabled ?? false,
      countdownType: settings?.announcement_countdown_type || 'fixed',
      countdownEnd: settings?.announcement_countdown_end || null,
      countdownDuration: settings?.announcement_countdown_duration || 300,
      fontSize: settings?.announcement_font_size || 14,
      showBorder: settings?.announcement_show_border ?? true,
      textBold: settings?.announcement_text_bold ?? false,
      textItalic: settings?.announcement_text_italic ?? false,
      textUnderline: settings?.announcement_text_underline ?? false,
      countdownBold: settings?.announcement_countdown_bold ?? false,
      countdownItalic: settings?.announcement_countdown_italic ?? false,
      countdownUnderline: settings?.announcement_countdown_underline ?? false,
      countdownTimeFormat: settings?.announcement_countdown_time_format || 'text',
    });
  } catch (error) {
    console.error('Announcement settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST (update) announcement settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, ...announcementSettings } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // Transform API format to database format
    const dbSettings: any = {};
    if (announcementSettings.enabled !== undefined) dbSettings.announcement_enabled = announcementSettings.enabled;
    if (announcementSettings.text !== undefined) dbSettings.announcement_text = announcementSettings.text;
    if (announcementSettings.textColor !== undefined) dbSettings.announcement_text_color = announcementSettings.textColor;
    if (announcementSettings.backgroundColor !== undefined) dbSettings.announcement_background_color = announcementSettings.backgroundColor;
    if (announcementSettings.position !== undefined) dbSettings.announcement_position = announcementSettings.position;
    if (announcementSettings.countdownEnabled !== undefined) dbSettings.announcement_countdown_enabled = announcementSettings.countdownEnabled;
    if (announcementSettings.countdownType !== undefined) dbSettings.announcement_countdown_type = announcementSettings.countdownType;
    if (announcementSettings.countdownEnd !== undefined) dbSettings.announcement_countdown_end = announcementSettings.countdownEnd;
    if (announcementSettings.countdownDuration !== undefined) dbSettings.announcement_countdown_duration = announcementSettings.countdownDuration;
    if (announcementSettings.fontSize !== undefined) dbSettings.announcement_font_size = announcementSettings.fontSize;
    if (announcementSettings.showBorder !== undefined) dbSettings.announcement_show_border = announcementSettings.showBorder;
    if (announcementSettings.textBold !== undefined) dbSettings.announcement_text_bold = announcementSettings.textBold;
    if (announcementSettings.textItalic !== undefined) dbSettings.announcement_text_italic = announcementSettings.textItalic;
    if (announcementSettings.textUnderline !== undefined) dbSettings.announcement_text_underline = announcementSettings.textUnderline;
    if (announcementSettings.countdownBold !== undefined) dbSettings.announcement_countdown_bold = announcementSettings.countdownBold;
    if (announcementSettings.countdownItalic !== undefined) dbSettings.announcement_countdown_italic = announcementSettings.countdownItalic;
    if (announcementSettings.countdownUnderline !== undefined) dbSettings.announcement_countdown_underline = announcementSettings.countdownUnderline;
    if (announcementSettings.countdownTimeFormat !== undefined) dbSettings.announcement_countdown_time_format = announcementSettings.countdownTimeFormat;

    const { error } = await supabase
      .from('settings')
      .update(dbSettings)
      .eq('store_id', storeId);

    if (error) {
      console.error('Error updating announcement settings:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Announcement settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

