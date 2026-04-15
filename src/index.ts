interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Google Calendar MCP Pack
 *
 * Requires OAuth connection — gateway injects credentials via _context.google_calendar.
 * Tools: list events, get event, create event, list calendars, search events.
 */


interface CalendarContext {
  google_calendar?: { accessToken: string };
}

const API = 'https://www.googleapis.com/calendar/v3';

async function gFetch(ctx: CalendarContext, url: string, options: RequestInit = {}) {
  if (!ctx.google_calendar) {
    return { error: 'connection_required', message: 'Connect your Google account at https://pipeworx.io/account' };
  }
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${ctx.google_calendar.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar API error (${res.status}): ${text}`);
  }
  return res.json();
}

const tools: McpToolExport['tools'] = [
  {
    name: 'gcal_list_events',
    description: 'List events from a Google Calendar. Optionally filter by time range. Returns event summaries, times, attendees, and locations.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        calendar_id: { type: 'string', description: 'Calendar ID (default: "primary" for the user\'s main calendar)' },
        time_min: { type: 'string', description: 'Lower bound (inclusive) for event start time as RFC3339 timestamp (e.g., "2024-01-01T00:00:00Z")' },
        time_max: { type: 'string', description: 'Upper bound (exclusive) for event end time as RFC3339 timestamp' },
        max_results: { type: 'number', description: 'Maximum number of events to return (default 10, max 250)' },
        order_by: { type: 'string', enum: ['startTime', 'updated'], description: 'Sort order (default: startTime). startTime requires singleEvents=true.' },
      },
      required: [],
    },
  },
  {
    name: 'gcal_get_event',
    description: 'Get a specific Google Calendar event by ID. Returns full event details including summary, description, start/end times, attendees, location, and conferencing info.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        calendar_id: { type: 'string', description: 'Calendar ID (default: "primary")' },
        event_id: { type: 'string', description: 'The ID of the event to retrieve' },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'gcal_create_event',
    description: 'Create a new event on a Google Calendar. Specify summary, start/end times, and optional description, location, and attendees.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        calendar_id: { type: 'string', description: 'Calendar ID (default: "primary")' },
        summary: { type: 'string', description: 'Title of the event' },
        start: { type: 'string', description: 'Start time as RFC3339 timestamp (e.g., "2024-06-15T10:00:00-07:00") or date for all-day events ("2024-06-15")' },
        end: { type: 'string', description: 'End time as RFC3339 timestamp or date for all-day events' },
        description: { type: 'string', description: 'Description or notes for the event' },
        location: { type: 'string', description: 'Location of the event' },
        attendees: {
          type: 'array',
          description: 'List of attendee email addresses',
          items: { type: 'string' },
        },
        time_zone: { type: 'string', description: 'Time zone (e.g., "America/Los_Angeles"). Defaults to calendar\'s time zone.' },
      },
      required: ['summary', 'start', 'end'],
    },
  },
  {
    name: 'gcal_list_calendars',
    description: 'List all calendars accessible by the authenticated user. Returns calendar IDs, summaries, time zones, and access roles.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'gcal_search_events',
    description: 'Search for events across a calendar using a text query. Matches against event summary, description, location, and attendees.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        calendar_id: { type: 'string', description: 'Calendar ID (default: "primary")' },
        query: { type: 'string', description: 'Free-text search query to match against event fields' },
        time_min: { type: 'string', description: 'Lower bound for event start time as RFC3339 timestamp' },
        time_max: { type: 'string', description: 'Upper bound for event end time as RFC3339 timestamp' },
        max_results: { type: 'number', description: 'Maximum number of events to return (default 10, max 250)' },
      },
      required: ['query'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const context = (args._context ?? {}) as CalendarContext;
  delete args._context;

  switch (name) {
    case 'gcal_list_events': {
      const calendarId = (args.calendar_id as string) ?? 'primary';
      const maxResults = Math.min(250, Math.max(1, (args.max_results as number) ?? 10));
      const params = new URLSearchParams({
        maxResults: String(maxResults),
        singleEvents: 'true',
        orderBy: (args.order_by as string) ?? 'startTime',
      });
      if (args.time_min) params.set('timeMin', args.time_min as string);
      if (args.time_max) params.set('timeMax', args.time_max as string);
      return gFetch(context, `${API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
    }
    case 'gcal_get_event': {
      const calendarId = (args.calendar_id as string) ?? 'primary';
      const eventId = args.event_id as string;
      return gFetch(context, `${API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`);
    }
    case 'gcal_create_event': {
      const calendarId = (args.calendar_id as string) ?? 'primary';
      const { summary, start, end, description, location, attendees, time_zone } = args as {
        summary: string; start: string; end: string; description?: string; location?: string;
        attendees?: string[]; time_zone?: string;
      };

      const isAllDay = !start.includes('T');
      const event: Record<string, unknown> = { summary };

      if (isAllDay) {
        event.start = { date: start };
        event.end = { date: end };
      } else {
        event.start = { dateTime: start, timeZone: time_zone };
        event.end = { dateTime: end, timeZone: time_zone };
      }

      if (description) event.description = description;
      if (location) event.location = location;
      if (attendees?.length) event.attendees = attendees.map((email) => ({ email }));

      return gFetch(context, `${API}/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: 'POST',
        body: JSON.stringify(event),
      });
    }
    case 'gcal_list_calendars': {
      return gFetch(context, `${API}/users/me/calendarList`);
    }
    case 'gcal_search_events': {
      const calendarId = (args.calendar_id as string) ?? 'primary';
      const query = args.query as string;
      const maxResults = Math.min(250, Math.max(1, (args.max_results as number) ?? 10));
      const params = new URLSearchParams({
        q: query,
        maxResults: String(maxResults),
        singleEvents: 'true',
        orderBy: 'startTime',
      });
      if (args.time_min) params.set('timeMin', args.time_min as string);
      if (args.time_max) params.set('timeMax', args.time_max as string);
      return gFetch(context, `${API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool, meter: { credits: 10 }, provider: 'google_calendar' } satisfies McpToolExport;
