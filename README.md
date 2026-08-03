# tutorializer

Command-line access to your tutorial-video data on
[app.tutorializer.com](https://app.tutorializer.com): projects, tutorial
definitions, rendered videos, the synthesized voiceover speeches behind them,
and per-project pronunciation rules.

## Install

```bash
npm install -g tutorializer   # global install
npx tutorializer --help       # or run without installing
```

Requires Node.js 18 or newer.

## Quick start

```bash
tutorializer login            # browser or API-key login (interactive chooser)
tutorializer projects list    # your projects with their ids
tutorializer videos list --projectId PROJECT_ID
```

```
Found 2 project(s):
1. Example App (64a1f2c9e4b0a1b2c3d4e5f6)
2. Example Docs (64a1f2c9e4b0a1b2c3d4e5f7)
```

## Signing up

No account yet? Create one from the terminal — the generated password prints
exactly once, and the session is stored so every other command works
immediately:

```bash
tutorializer signup --email founder@example.com --json
```

## Authentication

Two ways in:

- **Browser session** — `tutorializer login --browser` starts a temporary
  localhost server, opens your browser to app.tutorializer.com, and receives
  the session tokens on the redirect back. Tokens are stored in
  `~/.tutorializer/` and reused by every later command.
- **API key** — `tutorializer login --with-key` prompts (masked — never a
  command argument) for an API key secret created in the app, verifies it
  with one authenticated call, and stores it. Alternatively export
  `TUTORIALIZER_API_KEY=<key secret>` and skip the login step entirely — the
  key is read from the environment at request time. New keys default to
  read-only scopes; widen a key in the app before using write commands.

A stored browser session takes precedence over a stored key, which takes
precedence over `TUTORIALIZER_API_KEY`. `tutorializer logout` clears the
stored session and any stored key (an environment key stays in effect).

Without credentials, a command run in an interactive terminal starts the
browser login on its own; run non-interactively (no TTY) it fails immediately
with exit code 1 and login instructions on stderr — it never opens a browser
headlessly.

## Commands

### Session

```bash
tutorializer login              # choose browser or API key interactively
tutorializer login --browser    # log in via browser; tokens land in ~/.tutorializer/
tutorializer login --with-key   # paste an API key secret (masked prompt)
tutorializer logout             # clear the stored session and any stored key
```

### Projects

```bash
tutorializer projects list                    # list projects (-n/--limit, default 10)
tutorializer projects get [projectId]         # raw JSON for one project, or the first N
tutorializer projects read <projectId>        # formatted view: name, domain, timestamps
tutorializer projects create <name> --domain example.com   # --domain is optional
```

### Pronunciation rules

Project-wide dictionary entries applied when new voiceover audio is
generated:

```bash
tutorializer projects pronunciation list --projectId <id>
tutorializer projects pronunciation add <word> <phonemes> --projectId <id> --alphabet ipa
tutorializer projects pronunciation remove <word> --projectId <id>
```

`add` adds or replaces the rule for that exact word. `--alphabet` accepts
`ipa` (default) or `cmu`. Changing a rule does not regenerate existing audio
— use `speeches set-pronunciation` to regenerate one existing segment.

### Speeches

```bash
tutorializer speeches list --projectId <id> --language en -n 20   # default 10
tutorializer speeches get [speechId]      # raw JSON for one speech, or a filtered list
tutorializer speeches read <speechId>     # formatted view: text, language, url, duration
tutorializer speeches set-pronunciation <speechId> "<phonetic text>"
tutorializer speeches delete <speechId>
tutorializer speeches purge --contains <substring> --projectId <id> [--language en] [--dry-run] [--yes]
```

`set-pronunciation` stores the pronunciation hint and triggers a server-side
regeneration of that speech's audio. `delete` permanently removes the speech
record plus its audio and alignment files. `purge` deletes every speech in a
project whose text contains a substring (case-insensitive); it prints the
match list first, previews with `--dry-run`, and prompts for confirmation
unless `--yes` is passed.

### Videos

```bash
tutorializer videos list --projectId <id> --tutorialId <id> -n 20   # default 10
tutorializer videos get [videoId]       # raw JSON for one video, or a filtered list
tutorializer videos read <videoId>      # formatted view: status, times, url
tutorializer videos delete <videoId>    # permanently remove one rendered output
```

### Tutorials

```bash
tutorializer tutorials list --projectId <id> -n 20    # default 10
tutorializer tutorials get [tutorialId]   # raw JSON for one tutorial, or a filtered list
tutorializer tutorials read <tutorialId>  # formatted view
```

### Skills

```bash
tutorializer skills list               # names and descriptions of the bundled agent guides
tutorializer skills get tutorializer   # print a bundled SKILL.md to stdout
```

### Schema

```bash
tutorializer schema                    # the whole command tree as JSON
tutorializer schema speeches list      # just that command's options and arguments
```

## JSON output

Every data and mutation subcommand accepts `--json`: real, parseable JSON on
stdout with no color. Lists and reads print the records; mutations print a
small result object such as `{ "ok": true, "id": "…" }`. Failures print a
single-line JSON error object on stderr and exit with code 1:

```bash
tutorializer projects list --json
tutorializer speeches delete SPEECH_ID --json   # {"ok": true, "id": "…"}
```

## Configuration

A `tutorializer.json` in the working directory (or any parent) supplies the
default `--projectId`:

```json
{ "projectId": "64a1f2c9e4b0a1b2c3d4e5f6" }
```

Explicit `--projectId` flags win over the config file. `TUTORIALIZER_API_URL`
overrides the API endpoint (default `https://api.tutorializer.com`) and
`TUTORIALIZER_APP_URL` the browser-login origin (default
`https://app.tutorializer.com`) — only needed against a non-production
deployment. `TUTORIALIZER_API_KEY` supplies an API key secret for headless
use (see Authentication).

## Usage with AI agents

Install the Tutorializer agent skills — `tutorializer` (this CLI) and
`tutorial-library-audit` (the MCP-based audit workflow) — for Claude Code,
Cursor, Codex, and any other agent that supports the Skills standard:

```bash
npx skills add tutorializer/skills
```

The same guides ship inside the npm package, version-matched to the installed
CLI:

```bash
tutorializer skills list               # what is bundled
tutorializer skills get tutorializer   # the CLI guide matching this version
```

Or paste this into your `AGENTS.md` / `CLAUDE.md`:

```markdown
## Tutorial videos

Use the `tutorializer` CLI for tutorial-video data: projects, tutorial
definitions, rendered videos, voiceover speeches, and pronunciation rules.
Run `npx tutorializer skills get tutorializer` for the full guide, and
`tutorializer --help` for the command reference. Log in once with
`tutorializer login`.
```

Prefer a connector? The Tutorializer MCP server at
`https://mcp.tutorializer.com/mcp` exposes the same data as tools for Claude,
ChatGPT, and any MCP-capable host — see
[tutorializer.com/developers](https://www.tutorializer.com/developers/).

## License

[Apache-2.0](LICENSE)
