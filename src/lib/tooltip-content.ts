/**
 * Centralized repository for all UI tooltips.
 * Explanations are designed to be detailed yet easy to understand.
 */

export const TOOLTIP_CONTENT = {
    // Settings - Asset Intelligence
    ASSET_BRANDS: "Focuses the sniper engine on specific high-turnover manufacturers. This ensures the inventory matches your dealership's specialty.",

    // Settings - Search Parameters
    SEARCH_RADIUS: "The maximum distance (in miles) from your primary location that the engine will scan for private sellers.",
    YEAR_THRESHOLD: "Filters out vehicles older than this year to ensure you only deal with late-model, high-liquidity stock.",
    MILEAGE_CAP: "The absolute maximum mileage allowed for a lead. Lowering this reduces risk but may decrease total volume.",
    PRICE_LIMITS: "The financial bracket your dealership operates in. The engine ignores anything outside this range to protect your budget.",

    // Settings - Pulse Controls
    ACTIVE_HOURS: "Defines when the sniper engine is allowed to trigger. Keep this within daylight hours to ensure immediate outreach potential.",
    BATCH_SIZE: "The number of cities the engine scans in a single pulse. Larger batches increase volume but may trigger platform rate limits.",
    SCAN_INTERVAL: "How often (in minutes) the engine wakes up to look for new listings. Shorter intervals catch 'Fresh Snipes' faster.",
    CITY_DENSITY: "Limits how many leads the engine extracts from a single city per run. Essential for maintaining regional balance.",

    // Settings - SMS & Outreach
    AUTO_OUTREACH: "When enabled, the AI immediately sends a personalized SMS to private sellers the moment a matching lead is found.",
    OUTREACH_GOAL: "The specific objective for the AI's first contact (e.g., 'Book an inspection' or 'Get bottom dollar price').",
    AI_PERSONA: "Sets the tone of the automated messages. Use 'Professional' for corporate vibes or 'Casual' for individual-to-individual rapport.",
    SMS_SAFEGUARDS: "Advanced filters that prevent the AI from messaging sellers of high-risk vehicles based on specific keywords or missing data.",

    // Dashboard & Lead Card
    LEAD_SCORE: "A proprietary rating (1-10) based on margin potential, mileage risk, and historical market demand for this specific VIN.",
    AI_NOTES: "Summarized insights from the AI analyst highlighting why this car is a 'Snipe' or documenting potential red flags.",
    STATUS_FLOW: "The current stage of this lead in your acquisition pipeline, from initial discovery to final possession.",
    
    // Analytics
    TOTAL_PULSES: "The number of times the sniper engine has activated in the current tracking period.",
    LEADS_INGESTED: "The total volume of raw car listings discovered and stored in the database.",
    AVG_YIELD: "The average number of car listings found per engine pulse. Higher yield indicates higher market activity.",
    CLOSE_RATE: "The percentage of discovered leads that successfully reached 'Bought' status."
};
