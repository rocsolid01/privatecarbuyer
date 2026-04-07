/**
 * src/lib/scraper.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Vercel-side scraper orchestrator — replaces apify.ts.
 *
 * This module contains ALL the existing logic:
 *   • Smart sleep (active_hour_start / active_hour_end)
 *   • Cooldown (pulse_interval, last_pulse_at)
 *   • Tiered city targeting (Hot Zone / Far Sweep)
 *   • Scrape run DB record management
 *
 * The ONLY change from apify.ts: the actual trigger call now POSTs to
 * the AWS Lambda API Gateway instead of the Apify REST API.
 *
 * The Lambda handles the scraping + Supabase upsert directly,
 * so no webhook round-trip is needed for the main scrape flow.
 */

import { Settings } from '@/types/database';
import { supabase, adminSupabase } from '@/lib/supabase';

declare var process: {
    cwd: () => string;
    env: {
        LAMBDA_SCRAPER_URL?: string;
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Craigslist city slug → coordinates (national coverage)
// ─────────────────────────────────────────────────────────────────────────────
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
    // California
    'losangeles':   { lat: 34.0522,  lng: -118.2437 },
    'orangecounty': { lat: 33.7175,  lng: -117.8311 },
    'sd':           { lat: 32.7157,  lng: -117.1611 },
    'sfbay':        { lat: 37.7749,  lng: -122.4194 },
    'sacramento':   { lat: 38.5816,  lng: -121.4944 },
    'inlandempire': { lat: 34.1067,  lng: -117.5931 },
    'ventura':      { lat: 34.2805,  lng: -119.2945 },
    'bakersfield':  { lat: 35.3733,  lng: -119.0187 },
    'fresno':       { lat: 36.7378,  lng: -119.7871 },
    'modesto':      { lat: 37.6391,  lng: -120.9969 },
    'monterey':     { lat: 36.6002,  lng: -121.8947 },
    'stockton':     { lat: 37.9577,  lng: -121.2908 },
    'palmsprings':  { lat: 33.8303,  lng: -116.5453 },
    'santabarbara': { lat: 34.4208,  lng: -119.6982 },
    // Arizona
    'phoenix':      { lat: 33.4484,  lng: -112.0740 },
    'tucson':       { lat: 32.2226,  lng: -110.9747 },
    'flagstaff':    { lat: 35.1983,  lng: -111.6513 },
    'yuma':         { lat: 32.6927,  lng: -114.6277 },
    'prescott':     { lat: 34.5400,  lng: -112.4685 },
    // Nevada
    'lasvegas':     { lat: 36.1716,  lng: -115.1391 },
    'reno':         { lat: 39.5296,  lng: -119.8138 },
    'elko':         { lat: 40.8324,  lng: -115.7631 },
    // Texas
    'dallas':       { lat: 32.7767,  lng: -96.7970  },
    'fortworth':    { lat: 32.7555,  lng: -97.3308  },
    'houston':      { lat: 29.7604,  lng: -95.3698  },
    'austin':       { lat: 30.2672,  lng: -97.7431  },
    'sanantonio':   { lat: 29.4241,  lng: -98.4936  },
    'elpaso':       { lat: 31.7619,  lng: -106.4850 },
    'lubbock':      { lat: 33.5779,  lng: -101.8552 },
    'waco':         { lat: 31.5493,  lng: -97.1467  },
    'amarillo':     { lat: 35.2220,  lng: -101.8313 },
    'corpus':       { lat: 27.8006,  lng: -97.3964  },
    'abilene':      { lat: 32.4487,  lng: -99.7331  },
    'beaumont':     { lat: 30.0802,  lng: -94.1266  },
    'killeen':      { lat: 31.1171,  lng: -97.7278  },
    'odessa':       { lat: 31.8457,  lng: -102.3676 },
    'texoma':       { lat: 33.7373,  lng: -96.5986  },
    'easttexas':    { lat: 32.3513,  lng: -95.3011  },
    'wichitafalls': { lat: 33.9137,  lng: -98.4934  },
    // Florida
    'miami':        { lat: 25.7617,  lng: -80.1918  },
    'orlando':      { lat: 28.5383,  lng: -81.3792  },
    'tampa':        { lat: 27.9506,  lng: -82.4572  },
    'jacksonville': { lat: 30.3322,  lng: -81.6557  },
    'sarasota':     { lat: 27.3364,  lng: -82.5307  },
    'ftlauderdale': { lat: 26.1224,  lng: -80.1373  },
    'gainesville':  { lat: 29.6516,  lng: -82.3248  },
    'keys':         { lat: 24.5551,  lng: -81.7800  },
    'lakeland':     { lat: 28.0395,  lng: -81.9498  },
    'ocala':        { lat: 29.1872,  lng: -82.1401  },
    'pensacola':    { lat: 30.4213,  lng: -87.2169  },
    'spacecoast':   { lat: 28.3852,  lng: -80.7298  },
    'tallahassee':  { lat: 30.4518,  lng: -84.2807  },
    // Georgia
    'atlanta':      { lat: 33.7490,  lng: -84.3880  },
    'savannah':     { lat: 32.0835,  lng: -81.0998  },
    'macon':        { lat: 32.8407,  lng: -83.6324  },
    'columbus':     { lat: 32.4610,  lng: -84.9877  },
    'augusta':      { lat: 33.4735,  lng: -82.0105  },
    // North Carolina
    'charlotte':    { lat: 35.2271,  lng: -80.8431  },
    'raleigh':      { lat: 35.7796,  lng: -78.6382  },
    'greensboro':   { lat: 36.0726,  lng: -79.7920  },
    'asheville':    { lat: 35.5951,  lng: -82.5515  },
    'wilmington':   { lat: 34.2257,  lng: -77.9447  },
    'fayetteville': { lat: 35.0527,  lng: -78.8784  },
    // Tennessee
    'nashville':    { lat: 36.1627,  lng: -86.7816  },
    'memphis':      { lat: 35.1495,  lng: -90.0490  },
    'knoxville':    { lat: 35.9606,  lng: -83.9207  },
    'chattanooga':  { lat: 35.0456,  lng: -85.3097  },
    // Illinois / Midwest
    'chicago':      { lat: 41.8781,  lng: -87.6298  },
    'peoria':       { lat: 40.6936,  lng: -89.5890  },
    'springfieldil':{ lat: 39.7817,  lng: -89.6501  },
    'rockford':     { lat: 42.2711,  lng: -89.0940  },
    // Ohio
    'cleveland':    { lat: 41.4993,  lng: -81.6944  },
    'columbus':     { lat: 39.9612,  lng: -82.9988  },
    'cincinnati':   { lat: 39.1031,  lng: -84.5120  },
    'dayton':       { lat: 39.7589,  lng: -84.1916  },
    'toledo':       { lat: 41.6639,  lng: -83.5552  },
    // Michigan
    'detroit':      { lat: 42.3314,  lng: -83.0458  },
    'grandrapids':  { lat: 42.9634,  lng: -85.6681  },
    'lansing':      { lat: 42.7325,  lng: -84.5555  },
    // Pennsylvania
    'philadelphia': { lat: 39.9526,  lng: -75.1652  },
    'pittsburgh':   { lat: 40.4406,  lng: -79.9959  },
    'allentown':    { lat: 40.6023,  lng: -75.4714  },
    // New York
    'newyork':      { lat: 40.7128,  lng: -74.0060  },
    'buffalo':      { lat: 42.8864,  lng: -78.8784  },
    'rochester':    { lat: 43.1566,  lng: -77.6088  },
    'albany':       { lat: 42.6526,  lng: -73.7562  },
    // Washington / Pacific NW
    'seattle':      { lat: 47.6062,  lng: -122.3321 },
    'spokane':      { lat: 47.6588,  lng: -117.4260 },
    'olympia':      { lat: 47.0379,  lng: -122.9007 },
    'bellingham':   { lat: 48.7519,  lng: -122.4787 },
    // Oregon
    'portland':     { lat: 45.5051,  lng: -122.6750 },
    'eugene':       { lat: 44.0521,  lng: -123.0868 },
    'medford':      { lat: 42.3265,  lng: -122.8756 },
    'bend':         { lat: 44.0582,  lng: -121.3153 },
    // Colorado
    'denver':       { lat: 39.7392,  lng: -104.9903 },
    'coloradosprings':{ lat: 38.8339, lng: -104.8214},
    'boulder':      { lat: 40.0150,  lng: -105.2705 },
    'fortcollins':  { lat: 40.5853,  lng: -105.0844 },
    'pueblo':       { lat: 38.2544,  lng: -104.6091 },
    // Utah
    'saltlakecity': { lat: 40.7608,  lng: -111.8910 },
    'provo':        { lat: 40.2338,  lng: -111.6585 },
    'ogden':        { lat: 41.2230,  lng: -111.9738 },
    'stgeorge':     { lat: 37.0965,  lng: -113.5684 },
    // New Mexico
    'albuquerque':  { lat: 35.0844,  lng: -106.6504 },
    'santafe':      { lat: 35.6870,  lng: -105.9378 },
    // Virginia
    'norfolk':      { lat: 36.8508,  lng: -76.2859  },
    'richmond':     { lat: 37.5407,  lng: -77.4360  },
    'roanoke':      { lat: 37.2710,  lng: -79.9414  },
    // Maryland / DC
    'baltimore':    { lat: 39.2904,  lng: -76.6122  },
    'washingtondc': { lat: 38.9072,  lng: -77.0369  },
    'annapolis':    { lat: 38.9784,  lng: -76.4922  },
    // Louisiana
    'neworleans':   { lat: 29.9511,  lng: -90.0715  },
    'batonrouge':   { lat: 30.4515,  lng: -91.1871  },
    'shreveport':   { lat: 32.5252,  lng: -93.7502  },
    'lafayette':    { lat: 30.2241,  lng: -92.0198  },
    // Alabama
    'birmingham':   { lat: 33.5186,  lng: -86.8104  },
    'montgomery':   { lat: 32.3792,  lng: -86.3077  },
    'huntsville':   { lat: 34.7304,  lng: -86.5861  },
    'mobile':       { lat: 30.6954,  lng: -88.0399  },
    // South Carolina
    'charleston':   { lat: 32.7765,  lng: -79.9311  },
    'columbia':     { lat: 34.0007,  lng: -81.0348  },
    'greenville':   { lat: 34.8526,  lng: -82.3940  },
    // Missouri
    'stlouis':      { lat: 38.6270,  lng: -90.1994  },
    'kansascity':   { lat: 39.0997,  lng: -94.5786  },
    'springfieldmo':{ lat: 37.2090,  lng: -93.2923  },
    // Minnesota
    'minneapolis':  { lat: 44.9778,  lng: -93.2650  },
    'duluth':       { lat: 46.7867,  lng: -92.1005  },
    // Wisconsin
    'milwaukee':    { lat: 43.0389,  lng: -87.9065  },
    'madison':      { lat: 43.0731,  lng: -89.4012  },
    // Indiana
    'indianapolis': { lat: 39.7684,  lng: -86.1581  },
    'fortwayne':    { lat: 41.0793,  lng: -85.1394  },
    // Kentucky
    'louisville':   { lat: 38.2527,  lng: -85.7585  },
    'lexington':    { lat: 38.0406,  lng: -84.5037  },
    // Default
    'default':      { lat: 34.0522,  lng: -118.2437 },
};

// Map of common city name aliases → Craigslist slug
const CITY_NAME_TO_SLUG: Record<string, string> = {
    // Texas
    'dallas': 'dallas', 'fort worth': 'fortworth', 'dfw': 'dallas',
    'houston': 'houston', 'austin': 'austin', 'san antonio': 'sanantonio',
    'el paso': 'elpaso', 'lubbock': 'lubbock', 'waco': 'waco',
    'amarillo': 'amarillo', 'corpus christi': 'corpus', 'abilene': 'abilene',
    'beaumont': 'beaumont', 'killeen': 'killeen', 'odessa': 'odessa',
    'wichita falls': 'wichitafalls', 'tyler': 'easttexas',
    // California
    'los angeles': 'losangeles', 'la': 'losangeles',
    'orange county': 'orangecounty', 'oc': 'orangecounty',
    'san diego': 'sd', 'sf': 'sfbay', 'san francisco': 'sfbay',
    'bay area': 'sfbay', 'sacramento': 'sacramento',
    'inland empire': 'inlandempire', 'ie': 'inlandempire',
    'ventura': 'ventura', 'bakersfield': 'bakersfield',
    'fresno': 'fresno', 'modesto': 'modesto', 'stockton': 'stockton',
    'palm springs': 'palmsprings', 'santa barbara': 'santabarbara',
    // Arizona
    'phoenix': 'phoenix', 'tucson': 'tucson', 'flagstaff': 'flagstaff',
    'yuma': 'yuma', 'prescott': 'prescott',
    // Nevada
    'las vegas': 'lasvegas', 'reno': 'reno',
    // Florida
    'miami': 'miami', 'orlando': 'orlando', 'tampa': 'tampa',
    'jacksonville': 'jacksonville', 'fort lauderdale': 'ftlauderdale',
    'sarasota': 'sarasota', 'gainesville': 'gainesville', 'tallahassee': 'tallahassee',
    // Georgia
    'atlanta': 'atlanta', 'savannah': 'savannah', 'macon': 'macon',
    'augusta': 'augusta',
    // North Carolina
    'charlotte': 'charlotte', 'raleigh': 'raleigh', 'greensboro': 'greensboro',
    'asheville': 'asheville', 'wilmington': 'wilmington', 'fayetteville': 'fayetteville',
    // Tennessee
    'nashville': 'nashville', 'memphis': 'memphis', 'knoxville': 'knoxville',
    'chattanooga': 'chattanooga',
    // Colorado
    'denver': 'denver', 'colorado springs': 'coloradosprings',
    'boulder': 'boulder', 'fort collins': 'fortcollins',
    // Illinois
    'chicago': 'chicago',
    // Ohio
    'cleveland': 'cleveland', 'columbus': 'columbus', 'cincinnati': 'cincinnati',
    // Michigan
    'detroit': 'detroit', 'grand rapids': 'grandrapids',
    // Washington
    'seattle': 'seattle', 'spokane': 'spokane',
    // Oregon
    'portland': 'portland', 'eugene': 'eugene',
    // Utah
    'salt lake city': 'saltlakecity', 'slc': 'saltlakecity',
    // New Mexico
    'albuquerque': 'albuquerque', 'santa fe': 'santafe',
    // Virginia
    'norfolk': 'norfolk', 'richmond': 'richmond',
    // Maryland / DC
    'baltimore': 'baltimore', 'washington': 'washingtondc', 'dc': 'washingtondc',
    // New York
    'new york': 'newyork', 'nyc': 'newyork', 'buffalo': 'buffalo',
    // Pennsylvania
    'philadelphia': 'philadelphia', 'pittsburgh': 'pittsburgh',
    // Louisiana
    'new orleans': 'neworleans', 'baton rouge': 'batonrouge',
    // Missouri
    'st louis': 'stlouis', 'kansas city': 'kansascity',
    // Minnesota
    'minneapolis': 'minneapolis',
    // Wisconsin
    'milwaukee': 'milwaukee',
    // Indiana
    'indianapolis': 'indianapolis',
    // Kentucky
    'louisville': 'louisville', 'lexington': 'lexington',
    // Alabama
    'birmingham': 'birmingham', 'huntsville': 'huntsville',
};

// Zip prefix → Craigslist city slug
const ZIP_PREFIX_MAP: Array<{ prefix: string; slug: string }> = [
    // California
    { prefix: '900', slug: 'losangeles' }, { prefix: '902', slug: 'losangeles' },
    { prefix: '903', slug: 'losangeles' }, { prefix: '904', slug: 'losangeles' },
    { prefix: '905', slug: 'losangeles' }, { prefix: '906', slug: 'losangeles' },
    { prefix: '926', slug: 'orangecounty' }, { prefix: '927', slug: 'orangecounty' },
    { prefix: '928', slug: 'orangecounty' },
    { prefix: '921', slug: 'sd' }, { prefix: '920', slug: 'sd' },
    { prefix: '941', slug: 'sfbay' }, { prefix: '940', slug: 'sfbay' },
    { prefix: '942', slug: 'sfbay' }, { prefix: '943', slug: 'sfbay' },
    { prefix: '944', slug: 'sfbay' },
    { prefix: '958', slug: 'sacramento' }, { prefix: '957', slug: 'sacramento' },
    { prefix: '916', slug: 'sacramento' },
    { prefix: '917', slug: 'inlandempire' }, { prefix: '925', slug: 'inlandempire' },
    { prefix: '923', slug: 'inlandempire' }, { prefix: '924', slug: 'inlandempire' },
    { prefix: '930', slug: 'ventura' }, { prefix: '931', slug: 'ventura' },
    { prefix: '932', slug: 'bakersfield' }, { prefix: '933', slug: 'bakersfield' },
    { prefix: '936', slug: 'fresno' }, { prefix: '937', slug: 'fresno' },
    { prefix: '953', slug: 'modesto' }, { prefix: '952', slug: 'stockton' },
    { prefix: '922', slug: 'palmsprings' },
    { prefix: '934', slug: 'santabarbara' },
    // Arizona
    { prefix: '850', slug: 'phoenix' }, { prefix: '852', slug: 'phoenix' },
    { prefix: '853', slug: 'phoenix' }, { prefix: '854', slug: 'phoenix' },
    { prefix: '856', slug: 'tucson' }, { prefix: '857', slug: 'tucson' },
    { prefix: '860', slug: 'flagstaff' },
    { prefix: '863', slug: 'prescott' },
    { prefix: '853', slug: 'yuma' },
    // Nevada
    { prefix: '891', slug: 'lasvegas' }, { prefix: '890', slug: 'lasvegas' },
    { prefix: '889', slug: 'lasvegas' }, { prefix: '888', slug: 'lasvegas' },
    { prefix: '895', slug: 'reno' }, { prefix: '894', slug: 'reno' },
    // Texas
    { prefix: '750', slug: 'dallas' }, { prefix: '751', slug: 'dallas' },
    { prefix: '752', slug: 'dallas' }, { prefix: '753', slug: 'dallas' },
    { prefix: '754', slug: 'dallas' },
    { prefix: '760', slug: 'fortworth' }, { prefix: '761', slug: 'fortworth' },
    { prefix: '762', slug: 'fortworth' },
    { prefix: '770', slug: 'houston' }, { prefix: '771', slug: 'houston' },
    { prefix: '772', slug: 'houston' }, { prefix: '773', slug: 'houston' },
    { prefix: '774', slug: 'houston' }, { prefix: '775', slug: 'houston' },
    { prefix: '787', slug: 'austin' }, { prefix: '786', slug: 'austin' },
    { prefix: '785', slug: 'austin' },
    { prefix: '782', slug: 'sanantonio' }, { prefix: '781', slug: 'sanantonio' },
    { prefix: '780', slug: 'sanantonio' },
    { prefix: '799', slug: 'elpaso' }, { prefix: '798', slug: 'elpaso' },
    { prefix: '793', slug: 'lubbock' }, { prefix: '794', slug: 'lubbock' },
    { prefix: '767', slug: 'waco' }, { prefix: '766', slug: 'waco' },
    { prefix: '790', slug: 'amarillo' }, { prefix: '791', slug: 'amarillo' },
    { prefix: '783', slug: 'corpus' }, { prefix: '784', slug: 'corpus' },
    { prefix: '795', slug: 'abilene' }, { prefix: '796', slug: 'abilene' },
    { prefix: '756', slug: 'easttexas' }, { prefix: '757', slug: 'easttexas' },
    { prefix: '763', slug: 'wichitafalls' },
    { prefix: '775', slug: 'beaumont' }, { prefix: '776', slug: 'beaumont' },
    { prefix: '765', slug: 'killeen' },
    { prefix: '797', slug: 'odessa' },
    { prefix: '758', slug: 'texoma' },
    // Florida
    { prefix: '331', slug: 'miami' }, { prefix: '330', slug: 'miami' },
    { prefix: '332', slug: 'miami' }, { prefix: '333', slug: 'miami' },
    { prefix: '328', slug: 'orlando' }, { prefix: '327', slug: 'orlando' },
    { prefix: '326', slug: 'orlando' },
    { prefix: '336', slug: 'tampa' }, { prefix: '335', slug: 'tampa' },
    { prefix: '337', slug: 'tampa' },
    { prefix: '322', slug: 'jacksonville' }, { prefix: '320', slug: 'jacksonville' },
    { prefix: '334', slug: 'ftlauderdale' },
    { prefix: '342', slug: 'sarasota' }, { prefix: '341', slug: 'sarasota' },
    { prefix: '326', slug: 'gainesville' },
    { prefix: '323', slug: 'tallahassee' },
    // Georgia
    { prefix: '303', slug: 'atlanta' }, { prefix: '302', slug: 'atlanta' },
    { prefix: '304', slug: 'atlanta' }, { prefix: '305', slug: 'atlanta' },
    { prefix: '314', slug: 'savannah' },
    { prefix: '312', slug: 'macon' },
    { prefix: '308', slug: 'augusta' },
    // North Carolina
    { prefix: '282', slug: 'charlotte' }, { prefix: '281', slug: 'charlotte' },
    { prefix: '276', slug: 'raleigh' }, { prefix: '275', slug: 'raleigh' },
    { prefix: '274', slug: 'greensboro' }, { prefix: '272', slug: 'greensboro' },
    { prefix: '288', slug: 'asheville' },
    { prefix: '284', slug: 'wilmington' },
    { prefix: '283', slug: 'fayetteville' },
    // Tennessee
    { prefix: '372', slug: 'nashville' }, { prefix: '370', slug: 'nashville' },
    { prefix: '381', slug: 'memphis' }, { prefix: '380', slug: 'memphis' },
    { prefix: '379', slug: 'knoxville' }, { prefix: '377', slug: 'knoxville' },
    { prefix: '374', slug: 'chattanooga' },
    // Colorado
    { prefix: '802', slug: 'denver' }, { prefix: '800', slug: 'denver' },
    { prefix: '801', slug: 'denver' }, { prefix: '803', slug: 'denver' },
    { prefix: '808', slug: 'coloradosprings' }, { prefix: '809', slug: 'coloradosprings' },
    { prefix: '803', slug: 'boulder' },
    { prefix: '805', slug: 'fortcollins' },
    // Illinois
    { prefix: '606', slug: 'chicago' }, { prefix: '605', slug: 'chicago' },
    { prefix: '604', slug: 'chicago' }, { prefix: '607', slug: 'chicago' },
    // Ohio
    { prefix: '441', slug: 'cleveland' }, { prefix: '440', slug: 'cleveland' },
    { prefix: '432', slug: 'columbus' }, { prefix: '431', slug: 'columbus' },
    { prefix: '452', slug: 'cincinnati' }, { prefix: '450', slug: 'cincinnati' },
    // Michigan
    { prefix: '482', slug: 'detroit' }, { prefix: '481', slug: 'detroit' },
    { prefix: '480', slug: 'detroit' },
    { prefix: '495', slug: 'grandrapids' }, { prefix: '493', slug: 'grandrapids' },
    // Washington
    { prefix: '981', slug: 'seattle' }, { prefix: '980', slug: 'seattle' },
    { prefix: '982', slug: 'seattle' },
    { prefix: '992', slug: 'spokane' }, { prefix: '990', slug: 'spokane' },
    // Oregon
    { prefix: '972', slug: 'portland' }, { prefix: '970', slug: 'portland' },
    { prefix: '974', slug: 'eugene' },
    // Utah
    { prefix: '841', slug: 'saltlakecity' }, { prefix: '840', slug: 'saltlakecity' },
    { prefix: '846', slug: 'provo' },
    { prefix: '844', slug: 'ogden' },
    // New Mexico
    { prefix: '871', slug: 'albuquerque' }, { prefix: '870', slug: 'albuquerque' },
    { prefix: '875', slug: 'santafe' },
    // Virginia
    { prefix: '235', slug: 'norfolk' }, { prefix: '234', slug: 'norfolk' },
    { prefix: '232', slug: 'richmond' }, { prefix: '230', slug: 'richmond' },
    // Maryland / DC
    { prefix: '212', slug: 'baltimore' }, { prefix: '210', slug: 'baltimore' },
    { prefix: '200', slug: 'washingtondc' }, { prefix: '201', slug: 'washingtondc' },
    // New York
    { prefix: '100', slug: 'newyork' }, { prefix: '101', slug: 'newyork' },
    { prefix: '102', slug: 'newyork' }, { prefix: '104', slug: 'newyork' },
    { prefix: '140', slug: 'buffalo' },
    // Pennsylvania
    { prefix: '191', slug: 'philadelphia' }, { prefix: '190', slug: 'philadelphia' },
    { prefix: '152', slug: 'pittsburgh' }, { prefix: '150', slug: 'pittsburgh' },
    // Louisiana
    { prefix: '701', slug: 'neworleans' }, { prefix: '700', slug: 'neworleans' },
    { prefix: '708', slug: 'batonrouge' }, { prefix: '707', slug: 'batonrouge' },
    { prefix: '711', slug: 'shreveport' },
    { prefix: '705', slug: 'lafayette' },
    // Missouri
    { prefix: '631', slug: 'stlouis' }, { prefix: '630', slug: 'stlouis' },
    { prefix: '641', slug: 'kansascity' }, { prefix: '640', slug: 'kansascity' },
    // Minnesota
    { prefix: '554', slug: 'minneapolis' }, { prefix: '553', slug: 'minneapolis' },
    // Wisconsin
    { prefix: '532', slug: 'milwaukee' }, { prefix: '530', slug: 'milwaukee' },
    { prefix: '537', slug: 'madison' },
    // Indiana
    { prefix: '462', slug: 'indianapolis' }, { prefix: '460', slug: 'indianapolis' },
    // Kentucky
    { prefix: '402', slug: 'louisville' }, { prefix: '400', slug: 'louisville' },
    { prefix: '405', slug: 'lexington' },
    // Alabama
    { prefix: '352', slug: 'birmingham' }, { prefix: '350', slug: 'birmingham' },
    { prefix: '358', slug: 'huntsville' },
    { prefix: '366', slug: 'mobile' },
];

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Resolve a user-entered city name OR zip code to { lat, lng }.
 * Accepts: "Dallas", "dallas", "75201", "DFW", "Los Angeles", "90001", etc.
 */
export function resolveHomeCoords(cityOrZip: string): { lat: number; lng: number; resolvedAs: string } {
    const input = (cityOrZip || '').trim();

    // 1. Try as zip code (all digits)
    if (/^\d{5}$/.test(input)) {
        for (const { prefix, slug } of ZIP_PREFIX_MAP) {
            if (input.startsWith(prefix)) {
                return { ...CITY_COORDS[slug], resolvedAs: slug };
            }
        }
        // Unknown zip — return default
        return { ...CITY_COORDS['default'], resolvedAs: 'default' };
    }

    // 2. Try city name lookup (case-insensitive)
    const normalized = input.toLowerCase().trim();
    const slug = CITY_NAME_TO_SLUG[normalized];
    if (slug && CITY_COORDS[slug]) {
        return { ...CITY_COORDS[slug], resolvedAs: slug };
    }

    // 3. Try direct slug match (e.g. "losangeles")
    if (CITY_COORDS[normalized]) {
        return { ...CITY_COORDS[normalized], resolvedAs: normalized };
    }

    // 4. Partial match — find first city name containing the input
    const partialKey = Object.keys(CITY_NAME_TO_SLUG).find(k => k.includes(normalized));
    if (partialKey) {
        const partialSlug = CITY_NAME_TO_SLUG[partialKey];
        return { ...CITY_COORDS[partialSlug], resolvedAs: partialSlug };
    }

    return { ...CITY_COORDS['default'], resolvedAs: 'default' };
}

/**
 * Return all Craigslist cities sorted by distance from a given coordinate,
 * filtered to within radiusMiles.
 */
export function getCitiesByDistance(
    homeCoords: { lat: number; lng: number },
    radiusMiles: number
): Array<{ name: string; distance: number }> {
    return Object.entries(CITY_COORDS)
        .filter(([name]) => name !== 'default')
        .map(([name, coords]) => ({
            name,
            distance: calculateDistance(homeCoords.lat, homeCoords.lng, coords.lat, coords.lng),
        }))
        .filter(c => c.distance <= radiusMiles)
        .sort((a, b) => a.distance - b.distance);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main run trigger — replaces runScraper() from apify.ts
// ─────────────────────────────────────────────────────────────────────────────
export async function runScraper(settings: Settings, isDeepScrape = false, isPulse = false) {
    const now = new Date();
    const LAMBDA_URL = typeof process !== 'undefined' ? process.env.LAMBDA_SCRAPER_URL : null;

    if (!LAMBDA_URL) {
        throw new Error('LAMBDA_SCRAPER_URL is not configured. Add it to your .env file after deploying the Lambda.');
    }

    // ── 0. Manual Stop Guard ─────────────────────────────────────────────
    // If the system is pulse-scanning, but the user has manually STOPPED it, skip
    if (isPulse && settings.auto_scan_enabled === false) {
        console.log(`[Tiered Sniper] 🛑 SYSTEM STOPPED (Auto Scan is Disabled for ${settings.id})`);
        return { success: true, message: 'Automated scanning is currently disabled by the user.' };
    }

    // ── 1. Smart Sleep Guard ──────────────────────────────────────────────
    // Use America/Los_Angeles time for the sleep check to match user's local active hours
    const laTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: 'numeric',
        hour12: false
    }).format(now);
    
    // Robust parsing for Intl format which might include hidden characters
    const currentHour = parseInt(laTime.replace(/[^0-9]/g, ''));
    const startHour = settings.active_hour_start ?? 0;
    const endHour = settings.active_hour_end ?? 24;

    // Pulse scans follow the schedule; manual scans (isPulse=false) always bypass it
    if (isPulse && (currentHour < startHour || currentHour >= endHour)) {
        console.log(`[Tiered Sniper] 💤 SYSTEM SLEEP (Active: ${startHour}:00 - ${endHour}:00 | Current: ${currentHour}:00 LA)`);
        return { success: true, message: `System is in sleep mode (Local LA Time: ${currentHour}:00).` };
    }

    // ── Tiered City Selection ─────────────────────────────────────────────
    const { lat: homeLat, lng: homeLng, resolvedAs } = resolveHomeCoords(settings.zip || 'losangeles');
    const homeCoords = { lat: homeLat, lng: homeLng };
    const radiusMiles = settings.radius ?? 200;
    console.log(`[City Targeting] Home resolved as: ${resolvedAs} (${homeLat}, ${homeLng})`);

    // All cities within radius, sorted nearest→farthest
    const allCitiesInRadius = getCitiesByDistance(homeCoords, radiusMiles);

    // Base pool: if user specified locations, rank those by distance; otherwise use all in-radius cities
    let cityPool = (settings.locations && settings.locations.length > 0)
        ? settings.locations
            .map(name => ({
                name,
                distance: CITY_COORDS[name]
                    ? calculateDistance(homeCoords.lat, homeCoords.lng, CITY_COORDS[name].lat, CITY_COORDS[name].lng)
                    : 9999,
            }))
            .filter(c => c.distance <= radiusMiles)
            .sort((a, b) => a.distance - b.distance)
        : allCitiesInRadius;

    if (cityPool.length === 0) {
        // Fallback: take the single closest city regardless of radius
        cityPool = allCitiesInRadius.slice(0, 1);
        if (cityPool.length === 0) cityPool = [{ name: resolvedAs === 'default' ? 'losangeles' : resolvedAs, distance: 0 }];
    }
    
    const allCities = [...cityPool].sort((a, b) => a.distance - b.distance);

    // -- Persistent Anchored Rotation Strategy --
    // 1. "Anchored"      = 2 closest cities (always included every pulse)
    // 2. "Rotating Pool" = remaining cities sorted closest-first
    //
    // We read last_city_index from the DB so BOTH manual and 30-min scrapes
    // share the same sequential position — no city is skipped or repeated
    // just because a manual run fired mid-cycle.
    
    const anchoredCount     = 2;
    const anchored          = allCities.slice(0, anchoredCount).map(c => c.name);
    const batchSize         = settings.batch_size ?? 5;
    const rotatingBatchSize = Math.max(0, batchSize - anchoredCount);

    // Pool: everything beyond the anchored cities, closest-first
    const rotatingPool = allCities.slice(anchoredCount).map(c => c.name);

    // Read the persistent index (defaults to 0 if column not yet populated)
    const startIndex = typeof settings.last_city_index === 'number'
        ? settings.last_city_index
        : 0;

    // Advance and wrap the index, then persist it immediately before triggering
    const nextIndex = rotatingPool.length > 0
        ? (startIndex + rotatingBatchSize) % rotatingPool.length
        : 0;

    try {
        await adminSupabase
            .from('settings')
            .update({ last_city_index: nextIndex })
            .eq('id', settings.id);
    } catch (idxErr: any) {
        console.error('[City Rotation] Failed to persist last_city_index:', idxErr.message);
    }

    // Pick rotating cities starting at startIndex
    const rotating: string[] = [];
    if (rotatingPool.length > 0 && rotatingBatchSize > 0) {
        for (let i = 0; i < rotatingBatchSize; i++) {
            rotating.push(rotatingPool[(startIndex + i) % rotatingPool.length]);
        }
    }

    // Final set: anchored first (closest), then rotating fill
    const cities = [...anchored.slice(0, batchSize), ...rotating].slice(0, batchSize);

    const cityDisplay = cities.map(name => {
        const dist = allCities.find(c => c.name === name)?.distance || 0;
        return `${name} (${Math.round(dist)}mi)`;
    }).join(', ');

    const mode = 'HOT ZONE';
    console.log(`[Tiered Sniper] ${mode} → [${cityDisplay}] (Anchored: ${anchored.join(', ')})`);

    // ── 5. Log Scrape Run Record ───────────────────────────────────────────
    let runId: string | null = null;
    try {
        const { data: run, error } = await adminSupabase
            .from('scrape_runs')
            .insert({
                dealer_id: settings.id,
                mode,
                cities,
                status: 'Pending',
            })
            .select()
            .single();
        if (error) throw error;
        if (run) runId = run.id;

        // Update last_pulse_at - wrapped in its own try-catch to prevent trigger failure
        try {
            await adminSupabase
                .from('settings')
                .update({ last_pulse_at: now.toISOString() })
                .eq('id', settings.id);
        } catch (updateErr: any) {
            console.error('[Settings Update] Failed to update last_pulse_at:', updateErr.message);
        }
    } catch (err: any) {
        console.error('[Run Log] Failed to create scrape_run record:', err);
    }

    // ── 6. Trigger Lambda ───────────────────────────────────────────────
    // We remove the IIFE and AWAIT the trigger to ensure Vercel doesn't kill the task.
    // The Lambda handles its own status updates to 'Running' and 'Success'.
    const lambdaPayload = {
        run_id:      runId,
        mode:        'pulse',
        dealer_id:   settings.id,
        cities,
        year_min:    settings.year_min,
        year_max:    settings.year_max,
        price_min:   settings.price_min,
        price_max:   settings.price_max,
        mileage_max: settings.mileage_max,
        makes:       settings.makes || [],
        models:      settings.models || [],
        post_age_max: settings.post_age_max || 24,
        exclude_salvage: settings.exclude_salvage || false,
        posted_today: false,
        max_items:   Math.min(500, settings.max_items_per_city || 25),
    };

    try {
        console.log(`[Lambda] Triggering production AI Engine for cities: [${cities.join(', ')}]`);
        const response = await fetch(LAMBDA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lambdaPayload),
        });

        if (!response.ok && response.status !== 504) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        if (response.status === 504) {
            console.log('[Lambda] Triggered successfully (Connection timed out, but Lambda is continuing in background).');
        } else {
            console.log('[Lambda] Scrape triggered and responded successfully.');
        }

    } catch (err: any) {
        console.error('[Lambda] Cloud trigger failed:', err.message);
        if (runId) {
            await adminSupabase.from('scrape_runs').update({
                status: 'Error',
                error_message: err.message,
                finished_at: new Date().toISOString(),
            }).eq('id', runId);
        }
    }

    return {
        success: true,
        message: `${mode} started for [${cities.join(', ')}].`,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Deep scrape — triggers Lambda in "deep" mode for a single listing URL
// ─────────────────────────────────────────────────────────────────────────────
export async function runDeepScrape(listingUrl: string) {
    const LAMBDA_URL = typeof process !== 'undefined' ? process.env.LAMBDA_SCRAPER_URL : null;
    if (!LAMBDA_URL) throw new Error('LAMBDA_SCRAPER_URL is not configured.');

    const res = await fetch(LAMBDA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'deep', deep_url: listingUrl }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(`Deep Scrape Failed: ${error?.error || res.statusText}`);
    }

    return { success: true };
}
