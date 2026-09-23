// Build a standard ZIP using only Node's built-in modules; no platform-specific zip command.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { deflateRawSync } from "node:zlib";
const root = "dist";
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? files(join(directory, entry.name))
        : [join(directory, entry.name)],
    ),
  );
  return groups.flat().sort();
}
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
const paths = await files(root);
if (
  !paths.includes(join(root, "index.html")) ||
  !paths.includes(join(root, "THIRD_PARTY_LICENSES.txt"))
)
  throw new Error("Build is incomplete. Run npm run build first.");
const localRecords = [],
  centralRecords = [];
let offset = 0;
for (const path of paths) {
  const name = Buffer.from(relative(root, path).replaceAll("\\", "/"));
  const raw = await readFile(path),
    compressed = deflateRawSync(raw),
    crc = crc32(raw);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x800, 6);
  header.writeUInt16LE(8, 8);
  header.writeUInt16LE(33, 12); // Valid deterministic DOS date: 1980-01-01.
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(compressed.length, 18);
  header.writeUInt32LE(raw.length, 22);
  header.writeUInt16LE(name.length, 26);
  localRecords.push(header, name, compressed);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(33, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(raw.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(offset, 42);
  centralRecords.push(central, name);
  offset += header.length + name.length + compressed.length;
}
const directory = Buffer.concat(centralRecords),
  end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(paths.length, 8);
end.writeUInt16LE(paths.length, 10);
end.writeUInt32LE(directory.length, 12);
end.writeUInt32LE(offset, 16);
await writeFile(
  "framebreak-itch.zip",
  Buffer.concat([...localRecords, directory, end]),
);
console.log(
  `Created framebreak-itch.zip with ${paths.length} files and index.html at its root.`,
);
