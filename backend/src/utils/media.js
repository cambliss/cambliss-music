const fs = require("fs");
const path = require("path");
const { UPLOAD_ROOT } = require("./upload");

function isLocalTrackUrl(fileUrl) {
  return typeof fileUrl === "string" && fileUrl.startsWith("/uploads/tracks/");
}

function trackFileExists(fileUrl) {
  if (!isLocalTrackUrl(fileUrl)) return true;
  const filePath = path.join(UPLOAD_ROOT, "tracks", path.basename(fileUrl));
  return fs.existsSync(filePath);
}

function isTrackPlayable(track) {
  return trackFileExists(track?.fileUrl);
}

function filterPlayableTracks(tracks) {
  return (Array.isArray(tracks) ? tracks : []).filter(isTrackPlayable);
}

module.exports = {
  isTrackPlayable,
  filterPlayableTracks,
};
