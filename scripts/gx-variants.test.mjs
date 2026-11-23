import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gxVariantsFile, nextDataOf, writeGxVariants } from './gx-variants.mjs';

const samsung = {
  dimensions: [{
    id: 'occasion',
    name: 'Occasion',
    values: ['performance', 'everyday-wellness', 'tech-forward'],
    valueNames: { performance: 'Performance', 'everyday-wellness': 'Everyday Wellness', 'tech-forward': 'Tech-Forward' }
  }]
};

const quiet = { info: () => {}, warn: () => {} };

const page = (project) =>
  `<html><head></head><body><div id="__next"></div><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
    props: { pageProps: { project } }
  })}</script></body></html>`;

test('the Samsung page publishes its occasions with their names, ids unchanged', () => {
  assert.deepEqual(gxVariantsFile(samsung), {
    version: 1,
    parameter: 'gx_v',
    separator: '.',
    dimensions: [{
      id: 'occasion',
      name: 'Occasion',
      values: [
        { id: 'performance', name: 'Performance' },
        { id: 'everyday-wellness', name: 'Everyday Wellness' },
        { id: 'tech-forward', name: 'Tech-Forward' }
      ]
    }]
  });
});

test('a page with no variants publishes an empty list', () => {
  assert.deepEqual(gxVariantsFile(undefined).dimensions, []);
  assert.deepEqual(gxVariantsFile({ dimensions: [] }).dimensions, []);
});

test('ids the page would ignore are left out, and a missing name is the id', () => {
  const file = gxVariantsFile({
    dimensions: [
      { id: 'Occasion', values: ['a'] },
      { id: 'gender', values: ['female', 'Male', 'female', 'x"]{}'], valueNames: { female: '  ' } },
      { id: 'audience', name: 'Audience', values: ['female'] }
    ]
  });
  assert.deepEqual(file.dimensions, [{ id: 'gender', name: 'gender', values: [{ id: 'female', name: 'female' }] }]);
});

test('the page data is read from the exported HTML', () => {
  assert.equal(nextDataOf('<html></html>'), null);
  assert.equal(nextDataOf('<script id="__NEXT_DATA__" type="application/json">{not json</script>'), null);
  assert.deepEqual(nextDataOf(page({ variants: samsung })).props.pageProps.project.variants, samsung);
});

test('writes gx-variants.json next to index.html', () => {
  const folder = mkdtempSync(join(tmpdir(), 'gx-variants-'));
  writeFileSync(join(folder, 'index.html'), page({ id: 'p', variants: samsung }));
  const file = writeGxVariants(folder, quiet);
  assert.deepEqual(JSON.parse(readFileSync(join(folder, 'gx-variants.json'), 'utf8')), file);
  assert.equal(file.dimensions[0].values.length, 3);
});

test('writes nothing, and does not fail the export, when there is no page to read', () => {
  const folder = mkdtempSync(join(tmpdir(), 'gx-variants-'));
  assert.equal(writeGxVariants(folder, quiet), null);
  writeFileSync(join(folder, 'index.html'), '<html></html>');
  assert.equal(writeGxVariants(folder, quiet), null);
  assert.equal(existsSync(join(folder, 'gx-variants.json')), false);
});
