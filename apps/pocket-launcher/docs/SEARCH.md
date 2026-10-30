# Global search

`GET /api/search?q=<term>` returns matches grouped by category:

`Apps`, `Books`, `Videos`, `Music`, `Games`, `Files`, `Settings`.

Empty or whitespace-only `q` returns `400 invalid_query`; the UI only calls the endpoint for a non-empty query.

## Response

```json
{
  "groups": {
    "Apps": [{"id":"reader","title":"Pocket Reader","appId":"reader","category":"Apps","available":true,"kind":"app","mock":true}],
    "Books": [{"id":"book-1","title":"The Quiet Device","appId":"reader","category":"Books","available":true,"kind":"content","mock":true}]
  },
  "categories": ["Apps", "Books"],
  "mock": true
}
```

Apps come from the live app registry, so pin state and availability stay consistent with the Apps surface. Content comes from `mockSearchCatalog`.

## UI behaviour

- Typing filters with a 100 ms debounce; results are rendered as grouped sections, not one flat list.
- The client keeps the matched term and shows an explicit empty state when no group matches.
- Selecting a result hands off with `appId`. A result whose owning app is missing still renders, marked `Unavailable`.
- Keyboard: `Ctrl/Cmd+K` opens search, arrows move focus, `Enter` activates, `Escape` clears or leaves the page. D-Pad directions map onto the same movement.

Search never crosses into a target app's internal search implementation.
