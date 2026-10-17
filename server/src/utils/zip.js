import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

// IEEE 802.3 CRC32 lookup table
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

function calculateCrc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const time =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((date.getSeconds() >> 1) & 0x1f);
  const d =
    (((date.getFullYear() - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f);
  return { time, date: d };
}

/**
 * Creates a standard PKZIP buffer from a directory.
 *
 * @param {string} sourceDir Directory to zip
 * @param {string} rootName Root folder name inside the zip archive
 * @returns {Buffer}
 */
export function createZipFromDirectory(sourceDir, rootName = "") {
  const fileEntries = [];

  function walk(currentDir, relativePrefix = "") {
    const dirents = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const dirent of dirents) {
      const fullPath = path.join(currentDir, dirent.name);
      const relativePath = relativePrefix
        ? `${relativePrefix}/${dirent.name}`
        : dirent.name;

      if (dirent.isDirectory()) {
        walk(fullPath, relativePath);
      } else if (dirent.isFile()) {
        const content = fs.readFileSync(fullPath);
        fileEntries.push({
          archivePath: rootName ? `${rootName}/${relativePath}` : relativePath,
          content,
        });
      }
    }
  }

  walk(sourceDir);

  const localHeaders = [];
  const centralHeaders = [];
  let currentOffset = 0;
  const { time: dosTime, date: dosDate } = dosDateTime();

  for (const entry of fileEntries) {
    const rawData = entry.content;
    const compressedData = zlib.deflateRawSync(rawData);
    const crc = calculateCrc32(rawData);
    const filenameBuf = Buffer.from(entry.archivePath.replace(/\\/g, "/"), "utf8");

    // Local file header (30 bytes + filename)
    const localHeader = Buffer.alloc(30 + filenameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
    localHeader.writeUInt16LE(20, 4);         // Version needed to extract (2.0)
    localHeader.writeUInt16LE(0, 6);          // General purpose bit flag
    localHeader.writeUInt16LE(8, 8);          // Compression method (8 = DEFLATE)
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressedData.length, 18);
    localHeader.writeUInt32LE(rawData.length, 22);
    localHeader.writeUInt16LE(filenameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);         // Extra field length
    filenameBuf.copy(localHeader, 30);

    localHeaders.push(localHeader, compressedData);

    // Central directory header (46 bytes + filename)
    const centralHeader = Buffer.alloc(46 + filenameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0); // Central file header signature
    centralHeader.writeUInt16LE(20, 4);         // Version made by
    centralHeader.writeUInt16LE(20, 6);         // Version needed to extract
    centralHeader.writeUInt16LE(0, 8);          // General purpose bit flag
    centralHeader.writeUInt16LE(8, 10);         // Compression method
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressedData.length, 20);
    centralHeader.writeUInt32LE(rawData.length, 24);
    centralHeader.writeUInt16LE(filenameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);         // Extra field length
    centralHeader.writeUInt16LE(0, 32);         // File comment length
    centralHeader.writeUInt16LE(0, 34);         // Disk number start
    centralHeader.writeUInt16LE(0, 36);         // Internal file attributes
    centralHeader.writeUInt32LE(0, 38);         // External file attributes
    centralHeader.writeUInt32LE(currentOffset, 42); // Relative offset of local header
    filenameBuf.copy(centralHeader, 46);

    centralHeaders.push(centralHeader);

    currentOffset += localHeader.length + compressedData.length;
  }

  const centralDirOffset = currentOffset;
  const centralDirSize = centralHeaders.reduce((sum, h) => sum + h.length, 0);

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);           // End of central dir signature
  eocd.writeUInt16LE(0, 4);                    // Number of this disk
  eocd.writeUInt16LE(0, 6);                    // Disk with start of central directory
  eocd.writeUInt16LE(fileEntries.length, 8);   // Total entries in central directory on this disk
  eocd.writeUInt16LE(fileEntries.length, 10);  // Total entries in central directory
  eocd.writeUInt32LE(centralDirSize, 12);      // Size of central directory
  eocd.writeUInt32LE(centralDirOffset, 16);    // Offset of start of central directory
  eocd.writeUInt16LE(0, 20);                   // Comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}
