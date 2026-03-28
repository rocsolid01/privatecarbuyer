import { runScraper } from '../src/lib/scraper';
import { Settings } from '../src/types/database';

async function testStopGuard() {
    const mockSettings: Partial<Settings> = {
        id: 'test-user-id',
        auto_scan_enabled: false,
        daily_budget_usd: 1.0,
        budget_spent_today: 0,
        zip: '90001',
        radius: 200,
        active_hour_start: 0,
        active_hour_end: 24,
        batch_size: 5,
        makes: ['Toyota'],
        last_city_index: 0
    };

    console.log('Testing Pulse run with auto_scan_enabled = false...');
    const result = await runScraper(mockSettings as Settings, false, true);
    console.log('Result:', result);

    if (result.message === 'Automated scanning is currently disabled by the user.') {
        console.log('✅ PASS: Scraper correctly skipped the pulse run.');
    } else {
        console.log('❌ FAIL: Scraper did not skip the pulse run.');
    }
}

testStopGuard().catch(console.error);
