import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { scoreLead, generateOutreachSMS } from '@/lib/ai';
import { sendSMS } from '@/lib/sms';
import { calculateDistance, geocodeLocation } from '@/lib/geo';

function extractMileageFromText(title: string, description: string): number | null {
    const text = `${title} ${description}`;
    
    // Pattern 1: 120k, 120K, 120k miles
    const kPattern = /\b(\d+(?:\.\d+)?)\s*k\b/i;
    const kMatch = text.match(kPattern);
    if (kMatch) {
        return Math.round(parseFloat(kMatch[1]) * 1000);
    }

    // Pattern 2: 120,000 miles, 120000 mi
    const fullPattern = /\b(\d{1,3}(?:[,\s]\d{3})*|\d{4,})\s*(?:miles|mi|mileage|odometer)\b/i;
    const fullMatch = text.match(fullPattern);
    if (fullMatch) {
        return parseInt(fullMatch[1].replace(/[,\s]/g, ''));
    }

    // Pattern 3: Trailing numbers in title often mean mileage if 4-6 digits
    const endPattern = /\s+(\d{4,6})\s*$/;
    const endMatch = title.match(endPattern);
    if (endMatch) {
        return parseInt(endMatch[1]);
    }

    return null;
}

function extractTitleStatus(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    if (text.includes('salvage') || text.includes('rebuilt') || text.includes('theft') || text.includes('reconstructed') || text.includes('branded')) {
        return 'Salvage';
    }
    return 'Clean';
}

function extractYear(title: string): number | null {
    const yearMatch = title.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? parseInt(yearMatch[0]) : null;
}

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        const leads = Array.isArray(payload) ? payload : [payload];

        // Fetch primary dealer settings (for MVP/Demo, using placeholder ID)
        const dealerId = '00000000-0000-0000-0000-000000000000';
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('*')
            .eq('id', dealerId)
            .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
            console.error('Settings Fetch Error:', settingsError);
        }

        const dealerLocation = {
            lat: 34.0522,
            lon: -118.2437
        }; // Fallback to LA

        const processedLeads = [];

        for (const item of leads) {
            // 1. Basic Mapping
            const title = item.Title || item.title || 'Unknown Title';
            const priceVal = item.Price || item.price || item.price_text || item['Price Text'];
            const url = item['Listing URL'] || item.url || item.url_text;
            const postedAt = item['Posted At'] || item.posted_at || item.postedAt || new Date().toISOString();
            const locationStr = item.Location || item.location || item.address || 'Unknown';
            const photos = item['Image URLs'] || item.image_urls || item.images || [];
            const description = item.Description || item.description || '';
            const externalId = item.id || item.pid || item['Post ID'] || url || Math.random().toString();

            // 2. Deduplication Check
            const { data: existingLead } = await supabase
                .from('leads')
                .select('id')
                .eq('external_id', externalId)
                .maybeSingle();

            if (existingLead) {
                console.log(`Skipping duplicate lead: ${title}`);
                continue;
            }

            // 3. Attribute Extraction (Deep Scrape Mode)
            let mileage = null;
            let vin = null;
            const attributes = item.Attributes || item.attributes || {};

            if (Array.isArray(attributes)) {
                const odometerAttr = attributes.find((a: any) => a.label?.toLowerCase() === 'odometer');
                if (odometerAttr) mileage = parseInt(odometerAttr.value?.replace(/[^0-9]/g, '') || '0');
                const vinAttr = attributes.find((a: any) => a.label?.toLowerCase() === 'vin');
                if (vinAttr) vin = vinAttr.value;
            } else if (typeof attributes === 'object') {
                const odoKey = Object.keys(attributes).find(k => k.toLowerCase() === 'odometer');
                if (odoKey) mileage = parseInt(attributes[odoKey]?.replace(/[^0-9]/g, '') || '0');
                const vinKey = Object.keys(attributes).find(k => k.toLowerCase() === 'vin');
                if (vinKey) vin = attributes[vinKey];
            }

            // Fallback Extraction (Title/Description Regex)
            if (mileage === null || mileage === 0) {
                mileage = extractMileageFromText(title, description);
            }

            const titleStatus = extractTitleStatus(title, description);
            const carYear = extractYear(title) || (item.year ? parseInt(item.year) : null);

            if (!vin && (item.VIN || item.vin)) {
                vin = item.VIN || item.vin;
            }

            console.log(`[DEBUG Webhook] Lead: ${title} | Extracted Mileage: ${mileage}`);

            // 4. Geocoding & Distance
            const itemLocation = await geocodeLocation(locationStr);
            let distance = null;
            if (itemLocation && dealerLocation) {
                distance = calculateDistance(
                    dealerLocation.lat,
                    dealerLocation.lon,
                    itemLocation.lat,
                    itemLocation.lon
                );
            }

            // 5. AI Scoring
            const rawPrice = typeof priceVal === 'number' ? priceVal : parseFloat(priceVal?.toString().replace(/[^0-9.]/g, '') || '0');
            const cleanedPrice = isNaN(rawPrice) ? 0 : rawPrice;

            let aiAnalysis;
            try {
                aiAnalysis = await scoreLead(
                    title,
                    cleanedPrice,
                    mileage || 0,
                    description,
                    settings?.recon_multiplier || 1.0
                );
            } catch (err) {
                console.error('Lead Scoring Failed:', err);
                aiAnalysis = {
                    margin_estimate: 1500,
                    recon_estimate: 1000,
                    notes: 'AI scoring failed, using defaults.'
                };
            }

            const leadData = {
                external_id: externalId,
                title: title,
                price: cleanedPrice,
                mileage: mileage,
                year: carYear,
                vin: vin,
                location: locationStr,
                distance: distance,
                url: url,
                photos: photos,
                post_time: postedAt,
                ai_margin: aiAnalysis.margin_estimate,
                ai_recon_est: aiAnalysis.recon_estimate,
                ai_notes: aiAnalysis.notes,
                status: 'New',
                title_status: titleStatus,
                is_clean_title: titleStatus === 'Clean',
                dealer_id: dealerId,
            };

            processedLeads.push(leadData);

            // 6. Outreach & Scaling Logic
            const unicornThreshold = settings?.unicorn_threshold || 4000;
            if (aiAnalysis.margin_estimate >= unicornThreshold) {
                import('@/lib/apify').then(({ runDeepScrape }) => {
                    runDeepScrape(leadData.url).catch(() => {});
                });
            }
        }

        // Finalize Batch
        if (processedLeads.length > 0) {
            const { error: insertError } = await supabase.from('leads').insert(processedLeads);
            if (insertError) throw insertError;

            // Update Yield
            const { data: activeRun } = await supabase.from('scrape_runs').select('id, leads_found').eq('dealer_id', dealerId).order('started_at', { ascending: false }).limit(1).maybeSingle();
            if (activeRun) {
                await supabase.from('scrape_runs').update({ leads_found: (activeRun.leads_found || 0) + processedLeads.length }).eq('id', activeRun.id);
            }
            await supabase.from('settings').update({ consecutive_empty_runs: 0 }).eq('id', dealerId);
        } else {
            const { data: s } = await supabase.from('settings').select('consecutive_empty_runs').eq('id', dealerId).single();
            await supabase.from('settings').update({ consecutive_empty_runs: (s?.consecutive_empty_runs || 0) + 1 }).eq('id', dealerId);
        }

        return Response.json({ success: true, count: processedLeads.length });
    } catch (error: any) {
        console.error('Webhook Error Details:', error);
        return Response.json({
            success: false,
            error: error.message,
            details: error,
            stack: error.stack
        }, { status: 500 });
    }
}
