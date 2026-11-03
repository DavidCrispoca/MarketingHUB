import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatInTimeZone } from "date-fns-tz";
import { supabase } from "../../lib/supabase.js";

const ZONE = "America/Bogota";
const LOCALE = "es-CO";

export const reportsKey = (brandId) => ["reports", brandId];

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
      return {
        accounts: results[0].data ?? [],
        daily: results[1].data ?? [],
        posts: results[2].data ?? [],
        events: results[3].data ?? [],
        campaigns: results[4].data ?? [],
        reports: results[5].data ?? [],
        colors: results[6].data ?? [],
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

function sum(rows, field) {
  return rows.reduce((total, row) => total + number(row[field]), 0);
}

function aggregate(rows, posts, events, campaigns, period) {
  const followersOpening = rows.length ? number(rows[0].followers) : 0;
  const followersClosing = rows.length ? number(rows[rows.length - 1].followers) : 0;
  const net = followersClosing - followersOpening;
  const gained = sum(rows, "followers_gained");
  const lost = sum(rows, "followers_lost");
  const reach = sum(rows, "reach");
  const views = sum(rows, "views");
  const profileViews = sum(rows, "profile_views");
  const interactions = sum(rows, "total_interactions");
  const monthPosts = posts.filter((post) => inRange(postDay(post), period.start, period.end));

  return {
    followersOpening,
    followersClosing,
    net,
    gained: gained || Math.max(net, 0),
    lost: lost || Math.max(-net, 0),
    reach,
    views,
    profileViews,
    interactions,
    posts: monthPosts.length,
    monthPosts,
    events,
    campaigns,
  };
}

export function buildMonthlyReport(data, brand, monthKey) {
  const period = monthBounds(monthKey);
  const accounts = data?.accounts ?? [];
  const account = accounts.find((row) => row.platform === "instagram") ?? accounts[0] ?? null;
  const accountDaily = (data?.daily ?? []).filter((row) => !account || row.account_id === account.id);
  const daily = accountDaily.filter((row) => inRange(row.metric_date, period.start, period.end));
  const posts = data?.posts ?? [];
  const events = (data?.events ?? []).filter((row) => inRange(row.event_date, period.start, period.end));
  const campaigns = (data?.campaigns ?? []).filter((row) => {
    const start = row.start_date ?? period.start;
    const end = row.end_date ?? period.end;
    return start <= period.end && end >= period.start;
  });
  const current = aggregate(daily, posts, events, campaigns, period);

  const previousPeriod = monthBounds(shiftMonthKey(monthKey, -1));
  const previousDaily = accountDaily.filter((row) =>
    inRange(row.metric_date, previousPeriod.start, previousPeriod.end),
  );
  const previous = aggregate(
    previousDaily,
    posts,
    [],
    [],
    previousPeriod,
  );

  // Opening balance is the last snapshot before the period. It is more accurate
  // than the first day inside it, because Meta may not return every day.
  const before = accountDaily.filter((row) => row.metric_date < period.start).at(-1) ?? null;
  if (before) {
    current.followersOpening = number(before.followers);
    current.net = current.followersClosing - current.followersOpening;
  }

  const topPosts = [...current.monthPosts]
    .sort((a, b) => postInteractions(b) - postInteractions(a))
    .slice(0, 5)
    .map((post) => ({
      ...post,
      day: postDay(post),
      interactions: postInteractions(post),
      engagementRate: number(post.reach) > 0 ? postInteractions(post) / number(post.reach) : 0,
    }));

  const mediaTypes = current.monthPosts.reduce((accumulator, post) => {
    const key = post.media_product_type || post.media_type || "POST";
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  const colors = data?.colors ?? [];
  const primary = colors.find((color) => color.role === "primary")?.hex ?? "#2F4A3E";
  const accent = colors.find((color) => color.role === "accent")?.hex ?? "#B4552D";
  const neutral = colors.find((color) => color.role === "neutral")?.hex ?? "#F3EBDD";

  const coverage = daily.length
    ? { start: daily[0].metric_date, end: daily[daily.length - 1].metric_date, days: daily.length }
    : { start: period.start, end: period.end, days: 0 };

  return {
    monthKey,
    label: monthLabel(monthKey),
    shortLabel: monthLabel(monthKey, "short"),
    previousLabel: monthLabel(shiftMonthKey(monthKey, -1)),
    period,
    coverage,
    complete: coverage.days >= period.days && coverage.start === period.start,
    brand,
    account,
    palette: { primary, accent, neutral },
    ...current,
    daily,
    previous,
    topPosts,
    mediaTypes,
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

export { ZONE };
