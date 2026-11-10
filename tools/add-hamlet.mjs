#!/usr/bin/env node
// Add, move or remove a hamlet label on the Moraine Map (geo/moraine-grid.json).
//
// The map is a grid of 500 m squares, so a place is stored as [column, row], not as
// latitude and longitude. This works out the square for you.
//
//   node tools/add-hamlet.mjs "Caesarea" 44.1562 -78.8277     add (or move) a hamlet
//   node tools/add-hamlet.mjs --remove "Caesarea"              take one off
//   node tools/add-hamlet.mjs --list                           show them all
//
// Find latitude and longitude on https://www.openstreetmap.org : right-click the spot,
// choose "Show address", and the two numbers are in the web address (latitude first).
// Node 20 or newer. Nothing to install.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "geo", "moraine-grid.json");
const args = process.argv.slice(2);
const g = JSON.parse(readFileSync(FILE, "utf8"));
g.hamlets ??= {};

const save = () => {
  g.hamlets = Object.fromEntries(Object.entries(g.hamlets).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(FILE, JSON.stringify(g));
};
const stop = (msg) => { console.error(msg); process.exit(1); };

if (args[0] === "--list" || args.length === 0) {
  console.log(`Towns (big labels): ${Object.keys(g.towns).join(", ")}`);
  console.log(`Hamlets (${Object.keys(g.hamlets).length}):`);
  for (const [n, [c, r]] of Object.entries(g.hamlets)) console.log(`  ${n}  [column ${c}, row ${r}]`);
  if (args.length === 0) console.log('\nTo add one: node tools/add-hamlet.mjs "Name" <latitude> <longitude>');
  process.exit(0);
}

if (args[0] === "--remove") {
  const name = args[1];
  if (!name) stop('Which one? e.g. node tools/add-hamlet.mjs --remove "Caesarea"');
  if (!(name in g.hamlets)) stop(`"${name}" isn't on the map. Check the spelling with --list.`);
  delete g.hamlets[name];
  save();
  console.log(`Removed ${name}.`);
  process.exit(0);
}

const [name, latText, lngText] = args;
const lat = Number(latText), lng = Number(lngText);
if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
  stop('Usage: node tools/add-hamlet.mjs "Name" <latitude> <longitude>\n  e.g. node tools/add-hamlet.mjs "Caesarea" 44.1562 -78.8277');
}
if (name.length > 30) stop("Please keep the name under 30 characters so the label fits.");
if (lat < 0 || lng > 0) stop("Latitude should be about 44 and longitude about -79. Did you swap them?");
if (name in g.towns) stop(`${name} is already one of the main towns.`);

const col = Math.floor((lng - g.west) / g.dlon);
const row = Math.floor((g.north - lat) / g.dlat);
if (col < 0 || col >= g.cols || row < 0 || row >= g.rows) {
  stop(`That spot is off the map (the map covers latitude ${(g.north - g.rows * g.dlat).toFixed(2)} to ${g.north} and longitude ${g.west} to ${(g.west + g.cols * g.dlon).toFixed(2)}).`);
}
const inside = /[A-Z]/.test(g.area[row][col]);
const moved = name in g.hamlets;
g.hamlets[name] = [col, row];
save();
console.log(`${moved ? "Moved" : "Added"} ${name} at column ${col}, row ${row}.`);
if (!inside) console.log("Note: that square is just outside North Durham, so its dot sits on the faded land next door.");
console.log("Next: commit geo/moraine-grid.json. The map picks it up within a few minutes of the push.");
