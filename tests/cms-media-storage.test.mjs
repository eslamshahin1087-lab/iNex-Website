import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_CMS_IMAGE_BYTES,
  toCmsMediaBytes,
  storeCmsMedia,
  getCmsMedia,
  deleteCmsMedia
} from "../functions/cms/media-storage.mjs";

const KEY = "00000000-0000-4000-8000-000000000001.png";
const PNG = Uint8Array.from([137,80,78,71,13,10,26,10]);

test("D1 BLOB arrays are converted back to exact image bytes", () => {
  assert.deepEqual([...toCmsMediaBytes([137,80,78,71])], [137,80,78,71]);
  assert.deepEqual([...toCmsMediaBytes(PNG)], [...PNG]);
  assert.deepEqual([...toCmsMediaBytes(PNG.buffer)], [...PNG]);
  assert.equal(toCmsMediaBytes([256,-1,1.5]), null);
  assert.equal(toCmsMediaBytes("not bytes"), null);
});

test("stores an image as a D1 BLOB with its exact size", async () => {
  let statement = "";
  let bound = [];
  const database = {
    prepare(sql) {
      statement = sql;
      return {
        bind(...values) {
          bound = values;
          return { run: async () => ({ success: true }) };
        }
      };
    }
  };

  const result = await storeCmsMedia(database, KEY, "image/png", PNG);
  assert.match(statement, /INSERT INTO cms_media/);
  assert.equal(bound[0], KEY);
  assert.equal(bound[1], "image/png");
  assert.ok(bound[2] instanceof ArrayBuffer);
  assert.deepEqual([...new Uint8Array(bound[2])], [...PNG]);
  assert.equal(bound[3], PNG.byteLength);
  assert.deepEqual(result, { key: KEY, sizeBytes: PNG.byteLength });
});

test("reads a D1 BLOB and validates the stored byte count and MIME type", async () => {
  const database = {
    prepare(sql) {
      assert.match(sql, /SELECT content_type,image_data,size_bytes FROM cms_media/);
      return {
        bind(key) {
          assert.equal(key, KEY);
          return {
            first: async () => ({
              content_type: "image/png",
              image_data: [...PNG],
              size_bytes: PNG.byteLength
            })
          };
        }
      };
    }
  };

  const media = await getCmsMedia(database, KEY);
  assert.equal(media.contentType, "image/png");
  assert.equal(media.sizeBytes, PNG.byteLength);
  assert.deepEqual([...media.bytes], [...PNG]);
});

test("missing media returns null and corrupted BLOB metadata is rejected", async () => {
  const missingDatabase = { prepare: () => ({ bind: () => ({ first: async () => null }) }) };
  assert.equal(await getCmsMedia(missingDatabase, KEY), null);

  const corruptDatabase = {
    prepare: () => ({
      bind: () => ({
        first: async () => ({
          content_type: "image/png",
          image_data: [...PNG],
          size_bytes: PNG.byteLength + 1
        })
      })
    })
  };
  await assert.rejects(() => getCmsMedia(corruptDatabase, KEY), /stored CMS image data is invalid/);
});

test("deletes an image from the D1 media table by key", async () => {
  let statement = "";
  let deletedKey = "";
  const database = {
    prepare(sql) {
      statement = sql;
      return {
        bind(key) {
          deletedKey = key;
          return { run: async () => ({ success: true }) };
        }
      };
    }
  };
  await deleteCmsMedia(database, KEY);
  assert.match(statement, /DELETE FROM cms_media/);
  assert.equal(deletedKey, KEY);
});

test("the CMS media cap leaves headroom below D1's 2 MB row limit", () => {
  assert.equal(MAX_CMS_IMAGE_BYTES, 1_500_000);
  assert.ok(MAX_CMS_IMAGE_BYTES < 2_000_000);
});
