// Prefer source-provided H.264 MP4 + AAC. Merging these streams copies
// packets; it does not encode the picture again. Unknown codecs fall back to
// the source's best format and the existing verification/conversion step.
const video='bv*[ext=mp4][vcodec~="^(avc1|h264)"][acodec~="^(mp4a|aac|none)"]';
const audio='ba[ext=m4a][acodec~="^(mp4a|aac)"]';
export const DOWNLOAD_POLICY='source-mp4-first-v1';
export const SOURCE_FORMAT=video+'+'+audio+'[asr=48000]/'+video+'+'+audio+'/b[ext=mp4][vcodec~="^(avc1|h264)"][acodec~="^(mp4a|aac)"]/bv*+ba/b';
