# Setup notes

Things you configure once, outside the code.

## emailjs-template.html

The body of the EmailJS template the Send a Tip window sends through.

To install it: EmailJS dashboard → Email Templates → `template_wv6adad` →
switch the content editor to **Code / HTML** → paste the whole file in.

Also set, in the same template:

| Field | Value |
|---|---|
| Subject | `{{subject}}` |
| To email | NorthDurhamCensus@outlook.com |
| From name | `North Durham Census` |
| Reply To | `{{reply_to}}` |

Reply-To matters: with it set, hitting reply in Outlook answers the person who
sent the tip rather than the robot.

### The variables

`js/apps/mail.js` sends all of these. A template may use any subset; anything it
does not mention is simply ignored.

| Variable | What it holds |
|---|---|
| `{{subject}}` | `[North Durham Census] A place for the census` |
| `{{kind}}` | Which of the five kinds of submission it is |
| `{{place}}` | The place or event named |
| `{{message}}` | What they wrote |
| `{{from_name}}` | Their name, or "(no name given)" |
| `{{reply_to}}` | Their email, or the project address if they left it blank |
| `{{name}}` | Same as `from_name` — EmailJS's starter template uses this name |
| `{{time}}` | When it was sent |
| `{{to_name}}` | "North Durham Census" |

`name` and `time` are there so EmailJS's own default template produces a
readable email without being edited at all. Nothing breaks if you never swap it.
