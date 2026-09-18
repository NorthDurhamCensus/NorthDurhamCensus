# Asking an organisation for a calendar feed

The importer can only read calendars that publish a feed. Several of the biggest
calendars in North Durham do not, and no amount of code fixes that — someone has
to ask. This is the highest-value contribution anyone can make to the calendar.

**Who to ask first**, in order of how much difference it would make:

1. **Township of Scugog** — `clerks@scugog.ca` · the main calendar for Port Perry, Blackstock and Caesarea
2. **Durham Region** — already aggregates North Durham events, so one feed covers many organisations
3. **Township of Brock** — covers Beaverton, Cannington and Sunderland
4. **North Durham Chamber of Commerce** — runs GrowthZone, which supports feeds; likely just a setting
5. **Scugog Memorial Public Library** — publishes a full programme every month as a PDF

All three townships run the same website platform, so if one says yes the others
have a precedent to point at. Worth mentioning.

Check the current contact address on the organisation's own site before sending.

---

## The letter

> **Subject: Adding your events calendar to the North Durham Census**
>
> Hello,
>
> I volunteer with the North Durham Census, a free community project that maps
> what already exists across Scugog, Uxbridge and Brock — markets, trails, halls,
> classes, clinics, the lot. It is run by neighbours, costs nothing to use, and
> carries no advertising.
>
> We would like to include your events so more residents see them. Rather than
> copying them by hand, which goes stale quickly and risks getting details wrong,
> we would rather read them straight from you.
>
> **What we are asking for:** a calendar feed. That usually means one of:
>
> - an **iCalendar (.ics)** link — the same thing as a "Subscribe" or "Add to
>   Outlook" button
> - an **RSS feed** of the events listing
>
> Most website platforms can produce one; it is often a setting rather than a
> development job. If your calendar already has a subscribe option, the link
> behind it is all we need.
>
> **What we would do with it:** check it once a day and show your events with
> your organisation's name on them, linking back to your page. We would not
> republish your content as our own, and we would stop the moment you asked.
> If it helps, we can list them as unverified until someone local confirms the
> details.
>
> The Township of Uxbridge already publishes a feed like this, so there is a
> working example nearby.
>
> If a feed is not possible, we would still be glad to hear how you would prefer
> us to list your events.
>
> Thank you for considering it.
>
> [your name]
> North Durham Census · NorthDurhamCensus@outlook.com

---

## If they say yes

Add the feed to `tools/sources.json`, test it, and note in the `note` field that
permission was given and by whom. That record matters if anyone asks later.

```bash
node tools/fetch-events.mjs --only=<the-new-id> --verbose --dry-run
```

## If they say no, or do not reply

Set the source `enabled: false` and write what happened in the `note`. A "no" is
worth recording so the next volunteer does not ask again next year. Their events
can still be added by hand, the same as any other listing.

## If they ask what the project is

Point them at the README, the repository, or the site itself. Everything about
the census is public: the code, the data, and the fact that a person verifies
each listing. That tends to answer the question better than another email.
