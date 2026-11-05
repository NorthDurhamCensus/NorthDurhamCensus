# Drop newsletters here

Save a newsletter email into this folder as a `.txt` or `.eml` file, then run:

```bash
node tools/parse-emails.mjs
```

Name files `YYYY-MM-DD-source.txt` (for example `2026-10-01-durham-tourism.txt`)
so the parser knows which year the events belong to, even if the email headers
were lost when you saved it.

**Everything in this folder except this README is gitignored on purpose.** A
newsletter carries unsubscribe and tracking links tied to your own email
address, and those should not end up in a public repository. Only the parsed
output, `data/events-email.js`, is committed.

Full instructions are in [../../tools/README.md](../../tools/README.md).
