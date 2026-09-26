import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".data");

async function main() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const files = [
    "playbooks.json",
    "clients.json",
    "actions.json",
    "captures.json",
    "assistant_messages.json",
  ];

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    await fs.writeFile(filePath, "[]\n", "utf-8");
    console.log(`✓ Cleared ${file}`);
  }

  console.log("\n[made. desk] All local studio data reset to clean blank state.");
}

main().catch(console.error);
