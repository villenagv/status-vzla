import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');

    // Get the list of sites the authorized account has access to
    const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const sitesData = await sitesRes.json();
    const sites = sitesData.siteEntry || [];

    const { siteUrl, days = 28 } = await req.json().catch(() => ({}));

    // If no siteUrl provided, return the list of sites
    if (!siteUrl) {
      return Response.json({ sites });
    }

    // Date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - Number(days));
    const fmt = (d) => d.toISOString().split('T')[0];

    // Fetch overall performance totals
    const totalsRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: fmt(startDate), endDate: fmt(endDate), dimensions: ['date'], rowLimit: 90 }),
      }
    );
    const totalsData = await totalsRes.json();

    // Fetch top pages
    const pagesRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: fmt(startDate), endDate: fmt(endDate), dimensions: ['page'], rowLimit: 10 }),
      }
    );
    const pagesData = await pagesRes.json();

    // Fetch top queries
    const queriesRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: fmt(startDate), endDate: fmt(endDate), dimensions: ['query'], rowLimit: 10 }),
      }
    );
    const queriesData = await queriesRes.json();

    // Summarize totals from daily rows
    const dailyRows = totalsData.rows || [];
    const summary = dailyRows.reduce(
      (acc, r) => ({
        clicks: acc.clicks + (r.clicks || 0),
        impressions: acc.impressions + (r.impressions || 0),
      }),
      { clicks: 0, impressions: 0 }
    );
    summary.ctr = summary.impressions > 0 ? ((summary.clicks / summary.impressions) * 100).toFixed(2) : '0';
    summary.position = dailyRows.length > 0
      ? (dailyRows.reduce((acc, r) => acc + (r.position || 0), 0) / dailyRows.length).toFixed(1)
      : '0';

    return Response.json({
      summary,
      daily: dailyRows,
      topPages: pagesData.rows || [],
      topQueries: queriesData.rows || [],
      siteUrl,
      period: { startDate: fmt(startDate), endDate: fmt(endDate) },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});