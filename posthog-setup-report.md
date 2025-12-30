# PostHog post-wizard report

The analytics layer now focuses on the full media lifecycle (create → edit → organize → playlist) with consistent, schema-driven events. PostHog runs through the shared `instrumentation-client.ts` entrypoint, which bootstraps a persistent anonymous ID, disables autocapture, and fires controlled events from a centralized `lib/analytics.ts` helper.

## Files Created

| File | Purpose |
|------|---------|
| `instrumentation-client.ts` | Client-side PostHog initialization + anonymous ID + `app_opened` dispatch |
| `lib/analytics.ts` | Normalizes tag data and exposes strongly typed tracking helpers |
| `.env` | Environment variables for PostHog API key and host |

## Events Integrated

| Event Name | Description | File |
|------------|-------------|------|
| `app_opened` | Fired once on bootstrap after `posthog.identify` to mark the start of a session | `instrumentation-client.ts` |
| `media_created` | Emitted for every media insert (manual modal + recommended bundles) with media/source metadata | `app/page.tsx`, `components/recommended-tags.tsx` |
| `media_updated` | Tracks edits to existing media along with diff flags for tags/metadata | `components/media-grid.tsx` |
| `media_tags_updated` | Records tag diffs (added/removed/final) for create & update flows | `app/page.tsx`, `components/recommended-tags.tsx`, `components/media-grid.tsx` |
| `media_metadata_multi_field_edit` | Captures which metadata fields change in a single save action | `app/page.tsx`, `components/media-grid.tsx` |
| `playlist_generated` | Reports playlist creation attempts, including failures due to missing valid videos | `components/media-grid.tsx` |
| `ui_error` | Unified surface for user-facing failures (media add/edit/delete, recommended bundle, tag ops) | `app/page.tsx`, `components/media-grid.tsx`, `components/recommended-tags.tsx`, `app/tags/[name]/page.tsx` |

## Error Tracking

PostHog error tracking (`capture_exceptions: true`) remains enabled globally. In addition, `trackUiError` provides structured UI-layer diagnostics with `where`, `error_code`, and `message_short` fields across:
- `app/page.tsx` – add-media modal failures
- `components/media-grid.tsx` – edit/delete/playist actions
- `components/recommended-tags.tsx` – curated bundle ingestion
- `app/tags/[name]/page.tsx` – tag operations (rename, merge, delete)

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/274924/dashboard/954152) - Main dashboard with all insights

### Insights
- [Media Library Growth](https://us.posthog.com/project/274924/insights/CcuOLfa4) - Tracks media additions vs deletions over time
- [Playlist Engagement Funnel](https://us.posthog.com/project/274924/insights/BkQZnim1) - Conversion funnel from tag filtering to playlist creation
- [Recommended Tags Adoption](https://us.posthog.com/project/274924/insights/JRtkMbGW) - Tracks how often users adopt curated recommendations
- [Tag Management Activity](https://us.posthog.com/project/274924/insights/XR9VCWcC) - Monitors tag organization activities
- [User Engagement Overview](https://us.posthog.com/project/274924/insights/g8Ga7cle) - Key engagement metrics at a glance

## Configuration

PostHog is configured with:
- **API Key**: Set via `NEXT_PUBLIC_POSTHOG_KEY` environment variable
- **Host**: Set via `NEXT_PUBLIC_POSTHOG_HOST` environment variable (https://us.i.posthog.com)
- **Autocapture**: Disabled (all events are dispatched manually through `lib/analytics.ts`)
- **Distinct ID**: Stable `mozaiq_anon_id` stored in `localStorage` and used via `posthog.identify`
- **Error Tracking**: Enabled (`capture_exceptions: true`)
- **Debug Mode**: Enabled in development environment
