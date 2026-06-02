# mcp-google_calendar

Google Calendar MCP Pack

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 673+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `gcal_list_events` | List calendar events with optional date filtering. Returns event summaries, start/end times, attendees, and locations. Use to view upcoming or past events. |
| `gcal_get_event` | Get full details of a specific event by ID (e.g., "event_12345"). Returns summary, description, times, attendees, location, and video conferencing links. |
| `gcal_create_event` | Create a new calendar event with summary, start/end times, optional description, location, and attendee emails. Returns the created event ID. |
| `gcal_list_calendars` | List all accessible calendars. Returns calendar IDs, names, time zones, and your access level for each. Use to identify which calendar to query or modify. |
| `gcal_search_events` | Search events by keyword across summaries, descriptions, locations, and attendees. Returns matching event details and times. Use to find events by topic or participant. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "google_calendar": {
      "url": "https://gateway.pipeworx.io/google_calendar/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 673+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Google_calendar data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
