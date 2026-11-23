/**
 * Publishes the page's variants beside it, in `gx-variants.json` (Dynamic Sites, D28).
 *
 * Runs after `next build` as the last step of `npm run export`. It reads what the
 * exported page itself carries (`__NEXT_DATA__` in `index.html`: the project as the
 * public API served it) and writes the dimensions and values the page switches on,
 * so GX Ads can read them from the page's own URL instead of anyone typing them twice.
 *
 *   { "version": 1, "parameter": "gx_v", "separator": ".",
 *     "dimensions": [{ "id": "occasion", "name": "Occasion",
 *                      "values": [{ "id": "performance", "name": "Performance" }] }] }
 *
 * A page with no variants gets the file too, with `"dimensions": []`: "this page
 * publishes none" is then a fact GX Ads can read, not a missing file it has to guess
 * about. The file is written in every build mode; it holds nothing the page's own
 * CSS does not already name. Contract: docs/dynamic-sites/03-page-contract.md.
 *
 * Usage: node scripts/gx-variants.mjs [export folder, default _static]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FILE_NAME = 'gx-variants.json';
export const FILE_VERSION = 1;
/** The page contract's id shape: a `gx_v` value, also a CSS attribute value. */
const ID = /^[a-z0-9-]{1,32}$/;
const MAX_NAME = 200;

const nameOr = (name, id) => {
  const trimmed = typeof name === 'string' ? name.trim().slice(0, MAX_NAME) : '';
  return trimmed === '' ? id : trimmed;
};

/** The page data Next embedded in an exported HTML file, or null when there is none. */
export function nextDataOf(html) {
  const match = /<script id="__NEXT_DATA__" type="application\/json"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/**
 * The file's content for a project's `variants` as the page received them
 * (`{ dimensions: [{ id, name?, values: string[], valueNames? }] }`). Ids that are
 * not slugs are left out, as the page ignores them; a value id already used by an
 * earlier dimension is left out too; a dimension left with no value is dropped.
 * A missing name (an older public API sent ids only) is published as the id.
 */
export function gxVariantsFile(variants) {
  const seen = new Set();
  const dimensions = [];
  for (const dimension of variants?.dimensions ?? []) {
    if (!dimension || !ID.test(dimension.id) || !Array.isArray(dimension.values)) continue;
    const values = [];
    for (const id of dimension.values) {
      if (typeof id !== 'string' || !ID.test(id) || seen.has(id)) continue;
      seen.add(id);
      values.push({ id, name: nameOr(dimension.valueNames?.[id], id) });
    }
    if (values.length > 0) dimensions.push({ id: dimension.id, name: nameOr(dimension.name, dimension.id), values });
  }
  return { version: FILE_VERSION, parameter: 'gx_v', separator: '.', dimensions };
}

/** Writes `<folder>/gx-variants.json` from `<folder>/index.html`; returns the file's content, or null when it could not. */
export function writeGxVariants(folder, log = console) {
  const html = join(folder, 'index.html');
  if (!existsSync(html)) {
    log.warn(`gx-variants: ${html} does not exist; no ${FILE_NAME} written`);
    return null;
  }
  const data = nextDataOf(readFileSync(html, 'utf8'));
  if (data === null) {
    log.warn(`gx-variants: ${html} carries no page data; no ${FILE_NAME} written`);
    return null;
  }
  const file = gxVariantsFile(data.props?.pageProps?.project?.variants);
  writeFileSync(join(folder, FILE_NAME), `${JSON.stringify(file, null, 2)}\n`);
  const values = file.dimensions.reduce((sum, dimension) => sum + dimension.values.length, 0);
  log.info(`gx-variants: ${join(folder, FILE_NAME)} (${file.dimensions.length} dimensions, ${values} values)`);
  return file;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeGxVariants(process.argv[2] ?? '_static');
}
