import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatInTimeZone } from "date-fns-tz";
import { supabase } from "../../lib/supabase.js";

const ZONE = "America/Bogota";
const LOCALE = "es-CO";

export const reportsKey = (brandId) => ["reports", brandId];

export const PLATFORM_LABEL = { instagram: "Instagram", tiktok: "TikTok" };
export const platformLabel = (platform) => PLATFORM_LABEL[platform] ?? platform;

// Badges follow the network identity used across the app and in the PDF deck.
export const PLATFORM_COLOR = { instagram: "#833AB4", tiktok: "#FE2C55" };

export function useReports(brandId) {
  return useQuery({
    queryKey: reportsKey(brandId),
    enabled: Boolean(supabase) && Boolean(brandId),
    queryFn: async () => {
      const results = await Promise.all([
        supabase.from("social_accounts").select("id,platform,handle,display_name,status").eq("brand_id", brandId),
        supabase.from("account_metrics_daily").select("*").eq("brand_id", brandId).order("metric_date"),
        supabase
          .from("post_metrics_snapshots")
          .select("*")
          .eq("brand_id", brandId)
          .order("published_at", { ascending: false }),
        supabase.from("brand_events").select("*").eq("brand_id", brandId).order("event_date"),
        supabase
          .from("campaigns")
          .select("id,name,objective,start_date,end_date,status,color")
          .eq("brand_id", brandId),
        supabase.from("reports").select("*").eq("brand_id", brandId).order("period_start", { ascending: false }),
        supabase.from("brand_colors").select("id,name,hex,role,position").eq("brand_id", brandId).order("position"),
      ]);
      for (const result of results) if (result.error) throw result.error;

      // The monthly insights table arrives with its own migration. Until it is
      // applied, the report still works from the daily snapshots.
      const insights = await supabase
        .from("social_insights_monthly")
        .select("*")
        .eq("brand_id", brandId)
        .order("period_start");

      return {
        accounts: results[0].data ?? [],
        daily: results[1].data ?? [],
        posts: results[2].data ?? [],
        events: results[3].data ?? [],
        campaigns: results[4].data ?? [],
        reports: results[5].data ?? [],
        colors: results[6].data ?? [],
        insights: insights.error ? [] : insights.data ?? [],
      };
    },
  });
}

export function useSaveReport(brandId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }) => {
      const query = id
        ? supabase.from("reports").update(values).eq("id", id)
        : supabase.from("reports").insert({ ...values, brand_id: brandId });
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: reportsKey(brandId) }),
  });
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export function currentMonthKey() {
  return formatInTimeZone(new Date(), ZONE, "yyyy-MM");
}

export function shiftMonthKey(monthKey, offset) {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthBounds(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    start: `${monthKey}-01`,
    end: `${monthKey}-${String(lastDay).padStart(2, "0")}`,
    days: lastDay,
  };
}

export function monthLabel(monthKey, style = "long") {
  const date = new Date(`${monthKey}-15T12:00:00Z`);
  return new Intl.DateTimeFormat(LOCALE, { month: style, year: "numeric", timeZone: "UTC" }).format(date);
}

export function dayLabel(dateValue, options = { day: "2-digit", month: "short" }) {
  if (!dateValue) return "—";
  const date = new Date(`${String(dateValue).slice(0, 10)}T12:00:00Z`);
  return new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: "UTC" }).format(date);
}

export function dateRangeLabel(start, end) {
  const startDate = new Date(`${start}T12:00:00Z`);
  const endDate = new Date(`${end}T12:00:00Z`);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const startText = new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: sameMonth ? undefined : "long",
    timeZone: "UTC",
  }).format(startDate);
  const endText = new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(endDate);
  return `${startText} – ${endText}`;
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

const number = (value) => Number(value ?? 0) || 0;

function inRange(dateValue, start, end) {
  if (!dateValue) return false;
  const day = String(dateValue).slice(0, 10);
  return day >= start && day <= end;
}

function postDay(post) {
  if (!post?.published_at) return null;
  return formatInTimeZone(new Date(post.published_at), ZONE, "yyyy-MM-dd");
}

export const postInteractions = (post) =>
  number(post.likes) + number(post.comments) + number(post.shares) + number(post.saves);

const TYPE_LABEL = {
  REELS: "Reels",
  FEED: "Publicaciones",
  STORIES: "Historias",
  VIDEO: "Videos",
  IMAGE: "Fotos",
  CAROUSEL_ALBUM: "Carruseles",
};

function postType(post) {
  return TYPE_LABEL[post.media_product_type] ?? TYPE_LABEL[post.media_type] ?? "Otras";
}

function groupByType(posts) {
  const groups = new Map();
  for (const post of posts) {
    const label = postType(post);
    const row = groups.get(label) ?? { label, count: 0, interactions: 0, views: 0 };
    row.count += 1;
    row.interactions += postInteractions(post);
    row.views += number(post.views);
    groups.set(label, row);
  }
  return [...groups.values()].sort((a, b) => b.interactions - a.interactions);
}

const MONTH_FIELDS = [
  "followers_gained",
  "followers_lost",
  "reach",
  "views",
  "non_follower_views",
  "profile_views",
  "link_clicks",
  "interactions",
];

// When no monthly insight row exists, fall back to the daily snapshots so the
// report still shows real numbers instead of an empty slide.
function deriveFromDaily(dailyRows) {
  const sum = (field) => dailyRows.reduce((total, row) => total + number(row[field]), 0);
  return {
    followers: dailyRows.length ? number(dailyRows.at(-1).followers) : 0,
    followers_gained: sum("followers_gained"),
    followers_lost: sum("followers_lost"),
    reach: sum("reach"),
    views: sum("views"),
    non_follower_views: 0,
    profile_views: sum("profile_views"),
    link_clicks: 0,
    interactions: sum("total_interactions"),
    posts_count: 0,
    audience: {},
    traffic: {},
    top_searches: [],
    best_hours: [],
  };
}

function normalizeRow(row) {
  const result = { ...row };
  for (const field of MONTH_FIELDS) result[field] = number(row?.[field]);
  result.followers = number(row?.followers);
  result.posts_count = number(row?.posts_count);
  result.audience = row?.audience ?? {};
  result.traffic = row?.traffic ?? {};
  result.top_searches = row?.top_searches ?? [];
  result.best_hours = row?.best_hours ?? [];
  return result;
}

function buildNetwork({ platform, account, current, previous, monthPosts, previousPosts = [], dailyRows }) {
  const now = normalizeRow(current ?? deriveFromDaily(dailyRows));
  const before = previous ? normalizeRow(previous) : null;

  const posts = monthPosts.length ? monthPosts.length : now.posts_count;
  // Post-level metrics are the source of truth for interactions: the daily
  // snapshot total can lag behind and would make per-type shares exceed 100%.
  const interactions = monthPosts.length
    ? monthPosts.reduce((total, post) => total + postInteractions(post), 0)
    : now.interactions;
  const previousInteractions = previousPosts.length
    ? previousPosts.reduce((total, post) => total + postInteractions(post), 0)
    : (before?.interactions ?? 0);
  const gained = now.followers_gained;
  const lost = now.followers_lost;
  const net = gained || lost ? gained - lost : now.followers - (before?.followers ?? now.followers);
  const nonFollowerShare = now.views ? now.non_follower_views / now.views : null;
  const engagementRate = now.reach ? interactions / now.reach : null;

  const metrics = {
    followers: now.followers,
    followersGained: gained,
    followersLost: lost,
    reach: now.reach,
    views: now.views,
    profileViews: now.profile_views,
    linkClicks: now.link_clicks,
    interactions,
    nonFollowerViews: now.non_follower_views,
  };
  const previousMetrics = before
    ? {
        followers: before.followers,
        followersGained: before.followers_gained,
        reach: before.reach,
        views: before.views,
        profileViews: before.profile_views,
        linkClicks: before.link_clicks,
        interactions: previousInteractions,
        nonFollowerViews: before.non_follower_views,
      }
    : null;

  const topPosts = [...monthPosts]
    .sort((a, b) => number(b.views) - number(a.views))
    .slice(0, 6)
    .map((post) => ({
      ...post,
      platform,
      day: postDay(post),
      type: postType(post),
      interactions: postInteractions(post),
      engagementRate: number(post.reach) > 0 ? postInteractions(post) / number(post.reach) : 0,
    }));

  return {
    platform,
    label: platformLabel(platform),
    handle: account?.handle ?? "",
    displayName: account?.display_name ?? "",
    status: account?.status ?? "demo",
    isDemo: (account?.status ?? "demo") !== "connected",
    ...metrics,
    net,
    posts,
    nonFollowerShare,
    engagementRate,
    audience: now.audience,
    traffic: now.traffic,
    topSearches: now.top_searches,
    bestHours: now.best_hours,
    byType: groupByType(monthPosts),
    topPosts,
    previous: previousMetrics,
    delta: previousMetrics
      ? {
          followers: percentChange(metrics.followers, previousMetrics.followers),
          followersGained: percentChange(gained, previousMetrics.followersGained),
          reach: percentChange(metrics.reach, previousMetrics.reach),
          views: percentChange(metrics.views, previousMetrics.views),
          profileViews: percentChange(metrics.profileViews, previousMetrics.profileViews),
          linkClicks: percentChange(metrics.linkClicks, previousMetrics.linkClicks),
          interactions: percentChange(metrics.interactions, previousMetrics.interactions),
          nonFollowerViews: percentChange(metrics.nonFollowerViews, previousMetrics.nonFollowerViews),
        }
      : null,
  };
}

export function buildMonthlyReport(data, brand, monthKey) {
  const period = monthBounds(monthKey);
  const previousMonthKey = shiftMonthKey(monthKey, -1);
  const accounts = data?.accounts ?? [];
  const insights = data?.insights ?? [];
  const posts = data?.posts ?? [];

  const networks = accounts
    .map((account) => {
      const accountInsights = insights.filter((row) => row.account_id === account.id);
      const current = accountInsights.find((row) => String(row.period_start).slice(0, 7) === monthKey) ?? null;
      const previous = accountInsights.find((row) => String(row.period_start).slice(0, 7) === previousMonthKey) ?? null;
      const monthPosts = posts.filter(
        (post) => post.social_account_id === account.id && inRange(postDay(post), period.start, period.end),
      );
      const previousPosts = posts.filter(
        (post) =>
          post.social_account_id === account.id
          && inRange(postDay(post), monthBounds(previousMonthKey).start, monthBounds(previousMonthKey).end),
      );
      const dailyRows = (data?.daily ?? []).filter(
        (row) => row.account_id === account.id && inRange(row.metric_date, period.start, period.end),
      );
      return buildNetwork({ platform: account.platform, account, current, previous, monthPosts, previousPosts, dailyRows });
    })
    .filter((network) => network.followers || network.views || network.posts);

  const instagram = networks.find((network) => network.platform === "instagram") ?? null;
  const tiktok = networks.find((network) => network.platform === "tiktok") ?? null;

  const instagramAccount = accounts.find((account) => account.platform === "instagram");
  const instagramDaily = instagramAccount
    ? (data?.daily ?? []).filter(
        (row) => row.account_id === instagramAccount.id && inRange(row.metric_date, period.start, period.end),
      )
    : [];

  const events = (data?.events ?? []).filter((row) => inRange(row.event_date, period.start, period.end));
  const campaigns = (data?.campaigns ?? []).filter((row) => {
    const start = row.start_date ?? period.start;
    const end = row.end_date ?? period.end;
    return start <= period.end && end >= period.start;
  });

  const topPosts = networks
    .flatMap((network) => network.topPosts.slice(0, 3))
    .sort((a, b) => number(b.views) - number(a.views));

  // The proposal slide needs the campaign that comes after the reported month,
  // not only the ones that overlapped it.
  const upcomingCampaign =
    (data?.campaigns ?? [])
      .filter((row) => row.start_date && row.start_date > period.end)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))[0] ?? null;

  const sumBy = (field) => networks.reduce((total, network) => total + (network[field] ?? 0), 0);

  const coverage = instagramDaily.length
    ? {
        start: instagramDaily[0].metric_date,
        end: instagramDaily.at(-1).metric_date,
        days: instagramDaily.length,
      }
    : { start: period.start, end: period.end, days: 0 };

  const colors = data?.colors ?? [];
  const primary = colors.find((color) => color.role === "primary")?.hex ?? "#2F4A3E";
  const accent = colors.find((color) => color.role === "accent")?.hex ?? "#B4552D";
  const neutral = colors.find((color) => color.role === "neutral")?.hex ?? "#F3EBDD";

  return {
    monthKey,
    previousMonthKey,
    label: monthLabel(monthKey),
    shortLabel: monthLabel(monthKey, "short"),
    previousLabel: monthLabel(previousMonthKey),
    period,
    coverage,
    complete: coverage.days >= period.days && coverage.start === period.start,
    brand,
    palette: { primary, accent, neutral },
    audienceCity: instagram?.audience?.top_city ?? null,
    networks,
    instagram,
    tiktok,
    instagramDaily,
    events,
    campaigns,
    upcomingCampaign,
    topPosts,
    totalViews: sumBy("views"),
    totalInteractions: sumBy("interactions"),
    totalFollowersGained: sumBy("followersGained"),
    totalPosts: sumBy("posts"),
    isDemo: networks.some((network) => network.isDemo),
    generatedAt: new Date().toISOString(),
  };
}

export function percentChange(current, previous) {
  if (!previous) return null;
  return (current - previous) / previous;
}

export const formatNumber = (value) => new Intl.NumberFormat(LOCALE).format(Math.round(number(value)));

export const formatPercent = (value) => {
  if (value === null || value === undefined) return "—";
  return `${value > 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
};

export const formatShare = (value) => {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(1)}%`;
};

export { ZONE };
