# mcp-google_calendar

Google Calendar MCP Pack

Part of the [Pipeworx](https://pipeworx.io) open MCP gateway.

## Tools

| Tool | Description |
|------|-------------|
| `gcal_list_events` | List events from a Google Calendar. Optionally filter by time range. Returns event summaries, times, attendees, and locations. |
| `gcal_get_event` | Get a specific Google Calendar event by ID. Returns full event details including summary, description, start/end times, attendees, location, and conferencing info. |
| `gcal_create_event` | Create a new event on a Google Calendar. Specify summary, start/end times, and optional description, location, and attendees. |
| `gcal_list_calendars` | List all calendars accessible by the authenticated user. Returns calendar IDs, summaries, time zones, and access roles. |
| `gcal_search_events` | Search for events across a calendar using a text query. Matches against event summary, description, location, and attendees. |

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "google_calendar": {
      "url": "https://gateway.pipeworx.io/google_calendar/mcp"
    }
  }
}
```

Or use the CLI:

```bash
npx pipeworx use google_calendar
```

## License

MIT
