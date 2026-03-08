export type Profile = {
    id: string;
    email: string;
    location: string | null;
    zip: string | null;
    radius: number | null;
    created_at: string;
};

export type Settings = {
    id: string; // References Profile.id
    makes: string[];
    models: string[];
    year_min: number;
    year_max: number;
    mileage_max: number;
    price_min: number;
    price_max: number;
    keywords: string[];
    locations: string[];
    zip: string | null;
    condition_include: string[];
    condition_exclude: string[];
    motivation_keywords: string[];
    post_age_max: number;
    margin_min: number;
    radius: number;
    active_hour_start: number;
    active_hour_end: number;
    batch_size: number;
    sms_numbers: string[];
    auto_scan_enabled: boolean;
    consecutive_empty_runs: number;
    last_scan_at: string | null;
    pulse_interval: number;
    max_items_per_city: number;
    unicorn_threshold: number;
    outreach_sms_goal: string;
    ai_persona: string;
    crm_webhook_url: string | null;
    telnyx_phone_number: string;
    recon_multiplier: number;
    sms_auto_enabled: boolean;
    sms_min_margin: number;
    sms_max_mileage: number;
    sms_year_min: number;
    sms_year_max: number;
    sms_price_min: number;
    sms_price_max: number;
    sms_require_vin: boolean;
    sms_exclude_keywords: string[];
    body_styles: string[];
    priority_models: string[];
    updated_at: string;
};

export type Lead = {
    id: string;
    external_id: string; // Craigslist ID
    title: string;
    price: number | null;
    mileage: number | null;
    vin: string | null;
    location: string | null;
    distance: number | null;
    url: string;
    photos: string[];
    post_time: string;
    ai_margin_est: number | null;
    ai_recon_est: number | null;
    ai_notes: string | null;
    status: 'New' | 'Contacted' | 'Negotiating' | 'Meeting Set' | 'Bought' | 'Dead';
    dealer_id: string; // References Profile.id
    created_at: string;
};

export type Message = {
    id: string;
    lead_id: string;
    dealer_id: string;
    direction: 'Inbound' | 'Outbound';
    content: string;
    sent_at: string;
};

export type ScrapeRun = {
    id: string;
    dealer_id: string;
    started_at: string;
    finished_at: string | null;
    mode: 'HOT ZONE' | 'FAR SWEEP' | 'SINGLE' | 'PRIORITY';
    cities: string[];
    leads_found: number;
    status: 'Pending' | 'Success' | 'Cooldown' | 'Error' | 'Partial';
    error_message: string | null;
    created_at: string;
};
