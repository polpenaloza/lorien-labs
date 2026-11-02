const VIDEO_ID =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})(?:[?&#/]|$)/;

export function youtubeId(url: string): string {
  const id = url.match(VIDEO_ID)?.[1];
  if (!id) throw new Error(`Not a YouTube video URL: ${url}`);
  return id;
}
