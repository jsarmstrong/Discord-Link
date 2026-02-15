# Discord-Link

A lightweight Discord bot that bridges slash commands to an Excel VBA application
via a local queue file.  The VBA side polls the file, processes commands, and
deletes it when done.

## Architecture

```
Discord  ──►  Node.js Bot  ──►  Local text file  ──►  Excel VBA poller
                │                                         │
                └── Webhook status messages ◄─────────────┘
```

## Commands

| Command      | Description                        |
|--------------|------------------------------------|
| `/golive #`  | Send a **golive** command          |
| `/gopaper #` | Send a **gopaper** command         |
| `/stop #`    | Send a **stop** command            |
| `/status #`  | Send a **status** command          |
| `/stats #`   | Send a **stats** command           |

Each command requires a mandatory integer parameter (`number`).

## Queue File Format

Commands are appended to the queue file as plain text, one per line:

```
golive 1
stop 3
status 2
```

The VBA application reads and deletes this file after processing.

## File Monitor

After writing the queue file the bot starts a timer:

1. **Initial wait** (default 120 s) — if the file still exists, a warning is
   posted to the status webhook: *"Trading software didn't respond after 120
   seconds."*
2. **Repeat interval** (default 300 s) — the warning repeats every interval
   until the VBA side deletes the file.
3. **File consumed** — once the file disappears the bot posts: *"Trading
   software back on line — queue file consumed."*

Both timers are configurable via environment variables.

## Setup

### 1. Create a Discord Application & Bot

1. Go to <https://discord.com/developers/applications> and create a new
   application.
2. Under **Bot**, click **Reset Token** and copy the token.
3. Under **OAuth2 → URL Generator**, select the `bot` and
   `applications.commands` scopes, then the `Send Messages` permission.
4. Use the generated URL to invite the bot to your server.

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable                  | Required | Default                          |
|---------------------------|----------|----------------------------------|
| `DISCORD_BOT_TOKEN`      | Yes      | —                                |
| `DISCORD_CLIENT_ID`      | Yes      | —                                |
| `DISCORD_GUILD_ID`       | No       | (global commands if blank)       |
| `STATUS_WEBHOOK_URL`     | Yes      | —                                |
| `QUEUE_DIR`              | No       | `G:\My Drive\TDJ\Discord-Link`  |
| `QUEUE_FILENAME`         | No       | `commands.txt`                   |
| `INITIAL_WAIT_SECONDS`   | No       | `120`                            |
| `REPEAT_INTERVAL_SECONDS`| No       | `300`                            |

### 3. Install Dependencies

```bash
npm install
```

### 4. Register Slash Commands

Run once (or whenever you change command definitions):

```bash
npm run register
```

> If `DISCORD_GUILD_ID` is set, commands appear instantly in that server.
> Global commands may take up to one hour to propagate.

### 5. Start the Bot

```bash
npm start
```

## Development

```
src/
├── config.js              # Environment → config object
├── index.js               # Bot entry point & interaction handler
├── monitor.js             # Queue-file watchdog timer
├── queue.js               # File append / existence helpers
├── register-commands.js   # One-shot slash command registration
└── webhook.js             # Discord webhook POST helper
```
