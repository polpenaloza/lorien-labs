import assert from 'node:assert/strict';
import { test } from 'node:test';
import { youtubeId } from '../src/lib/youtube.ts';

const ID = 'dQw4w9WgXcQ';

test('reads the id from every YouTube link shape', () => {
  for (const url of [
    `https://www.youtube.com/watch?v=${ID}`,
    `https://www.youtube.com/watch?list=PL1&v=${ID}&t=30s`,
    `https://youtube.com/shorts/${ID}?feature=share`,
    `https://youtu.be/${ID}?si=abc`,
    `https://www.youtube.com/live/${ID}`,
  ]) {
    assert.equal(youtubeId(url), ID, url);
  }
});

test('rejects anything that is not a video link', () => {
  for (const url of [
    'https://www.youtube.com/@noghostsfound',
    'https://www.tiktok.com/@noghostsfound/video/123',
    'https://youtu.be/tooshort',
    `https://youtu.be/${ID}extra`,
  ]) {
    assert.throws(() => youtubeId(url), /Not a YouTube video URL/, url);
  }
});
