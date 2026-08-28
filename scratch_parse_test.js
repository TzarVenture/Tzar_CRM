function parseFileText(text) {
  // Strip null bytes if present
  const cleaned = text.replace(/\0/g, "");
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes("\t") ? "\t" : ",";

  const parseLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let k = 0; k < line.length; k++) {
      const char = line[k];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ""));
    return result;
  };

  const headers = parseLine(lines[0]);
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || "";
    });
    records.push(record);
  }

  return records;
}

const testHeaders = "id\tcreated_time\tad_id\tad_name\tcampaign_id\tform_id\temail\tfull_name\tphone_number\tcity";
const testRow = "l:83321222\t2026-08-12\tag:123\tVideo_1\tc:456\tf:1783\tvanish_555@yahoo.co.in\tVarsha Punjabi\tp:+919892469610\tThane";

const records = parseFileText(`${testHeaders}\n${testRow}`);
console.log("RECORDS COUNT:", records.length);
console.log("RECORD 1:", JSON.stringify(records[0], null, 2));
