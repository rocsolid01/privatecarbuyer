import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { scoreLead, generateOutreachSMS } from '@/lib/ai';
import { sendSMS } from '@/lib/sms';
import { calculateDistance, geocodeLocation } from '@/lib/geo';

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
            // Mapping for fatihtahta/craigslist-scraper:
            // Normalize fields that might come in with different names
            const title = item.title || 'Unknown Title';
            const priceVal = item.price || item.price_text;
            const url = item.url || item.url_text;
            const postedAt = item.posted_at || item.postedAt || new Date().toISOString();
            const locationStr = item.location || item.address || 'Unknown';
            const photos = item.image_urls || item.images || [];
            const description = item.description || '';

            // Extract attributes (odometer/mileage, VIN) from fatihtahta's attributes array if available
            let mileage = null;
            let vin = null;
            if (item.attributes && Array.isArray(item.attributes)) {
                const odometerAttr = item.attributes.find((a: any) => a.label?.toLowerCase() === 'odometer');
                if (odometerAttr) mileage = parseInt(odometerAttr.value?.replace(/[^0-9]/g, '') || '0');

                const vinAttr = item.attributes.find((a: any) => a.label?.toLowerCase() === 'vin');
                if (vinAttr) vin = vinAttr.value;
            } else {
                // Fallback for mileage if top-level
                mileage = item.mileage ? parseInt(item.mileage.toString().replace(/[^0-9]/g, '')) : null;
            }

            // 0. Filter by age
            const postDate = new Date(postedAt);
            const ageInHours = (new Date().getTime() - postDate.getTime()) / (1000 * 60 * 60);
            const maxAge = settings?.post_age_max || 1;

            if (ageInHours > maxAge) {
                console.log(`Skipping old lead: ${title} (${ageInHours.toFixed(1)}h old)`);
                continue;
            }

            // 1. Identify Active Scrape Run
            const { data: activeRun } = await supabase
                .from('scrape_runs')
                .select('id, leads_found')
                .eq('dealer_id', dealerId)
                .order('started_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            // 1.1 Deduplication Check
            const externalId = item.id || item.pid || url || Math.random().toString();
            const { data: existingLead } = await supabase
                .from('leads')
                .select('id')
                .eq('external_id', externalId)
                .maybeSingle();

            if (existingLead) {
                console.log(`Skipping duplicate lead: ${title}`);
                continue;
            }

            // ... (Rest of processing)

            if (processedLeads.length > 0) {
                // ... (Insert leads)

                // Update Run Yield
                if (activeRun) {
                    await supabase
                        .from('scrape_runs')
                        .update({ leads_found: (activeRun.leads_found || 0) + processedLeads.length })
                        .eq('id', activeRun.id);
                }
            }

            // 2. Calculate distance
            const itemLocation = await geocodeLocation(locationStr);
            let distance = null;
            if (itemLocation) {
                distance = calculateDistance(
                    dealerLocation.lat,
                    dealerLocation.lon,
                    itemLocation.lat,
                    itemLocation.lon
                );
            }

            // 3. AI Scoring
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
                vin: vin,
                location: locationStr,
                distance: distance,
                url: url,
                photos: photos,
                post_time: postedAt,
                ai_margin_est: aiAnalysis.margin_estimate,
                ai_recon_est: aiAnalysis.recon_estimate,
                ai_notes: aiAnalysis.notes,
                status: 'New',
                dealer_id: dealerId,
            };

            processedLeads.push(leadData);

            // 4. CRM Webhook Relay (New)
            if (settings?.crm_webhook_url) {
                console.log(`[CRM] Relaying lead ${externalId} to CRM.`);
                fetch(settings.crm_webhook_url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ event: 'new_lead', lead: leadData })
                }).catch(err => console.error('[CRM] Webhook Failed:', err));
            }

            // 5. Automated Outreach (Full Sniper Strategy)
            const smsEnabled = settings?.sms_auto_enabled ?? false;

            // Age & Mileage Safeguards (Rank 2 & 3)
            const minSmsYear = settings?.sms_year_min || 2018;
            const maxSmsYear = (settings as any).sms_year_max || 2026;
            const maxSmsMileage = settings?.sms_max_mileage || 100000;

            // Financial Sweet Spot (Rank 4)
            const minSmsPrice = (settings as any).sms_price_min || 8000;
            const maxSmsPrice = (settings as any).sms_price_max || 25000;
            const minSmsMargin = settings?.sms_min_margin || 2000;

            // Selection Logic (Rank 1 & 10)
            const priorityModels = (settings as any).priority_models || [];
            const allowedBodyStyles = (settings as any).body_styles || [];

            // Signals (Rank 6, 7 & 9)
            const requireVin = settings?.sms_require_vin || true;
            const blacklistedKeywords = settings?.sms_exclude_keywords || [];
            const motivationKeywords = (settings as any).motivation_keywords || [];

            // Feature Extraction
            const yearMatch = title.match(/\b(19|20)\d{2}\b/);
            const carYear = yearMatch ? parseInt(yearMatch[0]) : 0;

            const lowerTitle = title.toLowerCase();
            const lowerDesc = description.toLowerCase();

            const isPriorityModel = priorityModels.some((model: string) => lowerTitle.includes(model.toLowerCase()));
            const isBlacklisted = blacklistedKeywords.some((word: string) =>
                lowerTitle.includes(word.toLowerCase()) || lowerDesc.includes(word.toLowerCase())
            );
            const hasMotivation = motivationKeywords.some((word: string) =>
                lowerTitle.includes(word.toLowerCase()) || lowerDesc.includes(word.toLowerCase())
            );

            // Body Style Check (Mock logic - AI Usually labels this, but we'll check title/desc for now)
            const matchesBodyStyle = allowedBodyStyles.length === 0 ||
                allowedBodyStyles.some((style: string) => lowerTitle.includes(style.toLowerCase()) || lowerDesc.includes(style.toLowerCase()));

            const isIdealCandidate =
                smsEnabled &&
                !isBlacklisted &&
                (carYear >= minSmsYear && carYear <= maxSmsYear) &&
                (mileage === null || mileage <= maxSmsMileage) &&
                ((leadData.price || 0) >= minSmsPrice && (leadData.price || 0) <= maxSmsPrice) &&
                (aiAnalysis.margin_estimate >= minSmsMargin) &&
                (!requireVin || !!vin) &&
                matchesBodyStyle &&
                (isPriorityModel || hasMotivation || aiAnalysis.margin_estimate > (minSmsMargin + 1000));

            if (isIdealCandidate) {
                const smsContent = await generateOutreachSMS(
                    title,
                    leadData.price || 0,
                    leadData.location,
                    settings?.ai_persona,
                    settings?.outreach_sms_goal
                );

                if (item.sellerPhone) {
                    const smsResult = await sendSMS(item.sellerPhone, smsContent);
                    if (smsResult.success) {
                        leadData.status = 'Contacted';
                    }
                }
            }

            // Phase 4: Unicorn Auto-Extraction
            const unicornThreshold = settings?.unicorn_threshold || 4000;
            if (aiAnalysis.margin_estimate >= unicornThreshold) {
                console.log(`[Unicorn] Massive margin detected ($${aiAnalysis.margin_estimate}). Triggering Auto-Deep-Scrape.`);
                import('@/lib/apify').then(({ runDeepScrape }) => {
                    runDeepScrape(leadData.url).catch(err => console.error('[Unicorn] Auto-Deep-Scrape Failed:', err));
                });
            }

            // Phase 5: Unicorn Push Notification (SMS to Dealer)
            if (aiAnalysis.margin_estimate >= unicornThreshold) {
                const dealerPhone = settings?.sms_numbers?.[0];
                if (dealerPhone) {
                    const alertMsg = `🚨 UNICORN ALERT: ${item.title} ($${leadData.price}) has a potential $${aiAnalysis.margin_estimate} margin! Link: ${item.url}`;
                    sendSMS(dealerPhone, alertMsg).catch(err => console.error('[Unicorn] SMS Alert Failed:', err));
                }
            }
        }

        if (processedLeads.length > 0) {
            // Deduplicate in-memory just in case the same payload has duplicates
            const uniqueLeads = Array.from(new Map(processedLeads.map(l => [l.external_id, l])).values());

            const { error: insertError } = await supabase
                .from('leads')
                .insert(uniqueLeads);

            if (insertError) {
                console.error('Supabase Insert Error:', insertError);
                throw insertError;
            }
        }

        // Autonomous Scaling: Update consecutive_empty_runs in settings
        if (processedLeads.length === 0) {
            const { data: s } = await supabase.from('settings').select('consecutive_empty_runs').eq('id', dealerId).single();
            await supabase.from('settings').update({ consecutive_empty_runs: (s?.consecutive_empty_runs || 0) + 1 }).eq('id', dealerId);
        } else {
            // Reset if any leads found
            await supabase.from('settings').update({ consecutive_empty_runs: 0 }).eq('id', dealerId);
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
