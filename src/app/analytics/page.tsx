"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { LeadAnalysisTable } from '@/components/LeadAnalysisTable';
import { InfoTooltip } from '@/components/InfoTooltip';
import { TOOLTIP_CONTENT } from '@/lib/tooltip-content';
import { Zap, ArrowRight, Clock, ExternalLink, MessageSquare, MapPin, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Lead, ScrapeRun } from '@/types/database';

export default function AnalyticsPage() {
    const [leads, setLeads] = useState([] as Lead[]);
    const [runs, setRuns] = useState([] as ScrapeRun[]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [leadsRes, runsRes] = await Promise.all([
                    supabase.from('leads').select('*'),
                    supabase.from('scrape_runs').select('*').order('started_at', { ascending: false }).limit(20)
                ]);

                if (leadsRes.data) setLeads(leadsRes.data);
                if (runsRes.data) setRuns(runsRes.data);
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
