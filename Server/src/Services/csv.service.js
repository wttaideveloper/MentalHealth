function toCsv(rowsArray) {
  if (!rowsArray.length) return "";
  const headers = Object.keys(rowsArray[0]);
  const lines = [headers.join(",")];

  for (const row of rowsArray) {
    const line = headers.map((h) => JSON.stringify(row[h] ?? "")).join(",");
    lines.push(line);
  }
  return lines.join("\n");
}

module.exports = { toCsv };
