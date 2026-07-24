import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function migrate(oldCol, newCol) {
  const oldCount = (await p.$runCommandRaw({ count: oldCol })).n;
  const newCount = (await p.$runCommandRaw({ count: newCol })).n;
  console.log(`${oldCol} (${oldCount}) → ${newCol} (${newCount})`);

  if (oldCount === 0 && newCount === 0) {
    await p.$runCommandRaw({ drop: oldCol });
    console.log(`  → dropped empty ${oldCol}`);
    return;
  }

  if (oldCount > 0) {
    const docs = await p.$runCommandRaw({ find: oldCol });
    const batch = docs.cursor.firstBatch;
    if (batch.length > 0) {
      await p.$runCommandRaw({
        insert: newCol,
        documents: batch,
      });
      console.log(`  → copied ${batch.length} docs to ${newCol}`);
    }
    await p.$runCommandRaw({ drop: oldCol });
    console.log(`  → dropped ${oldCol}`);
  } else {
    await p.$runCommandRaw({ drop: oldCol });
    console.log(`  → dropped stale empty ${oldCol}`);
  }
}

async function main() {
  await p.$connect();

  const pairs = [
    ['auditlogs', 'audit_logs'],
    ['checkins', 'check_ins'],
    ['conferencehalls', 'conference_halls'],
    ['menuitems', 'menu_items'],
    ['stockitems', 'stock_items'],
    ['stockledgers', 'stock_ledgers'],
    ['tagconfigs', 'tag_configs'],
  ];

  for (const [oldCol, newCol] of pairs) {
    await migrate(oldCol, newCol);
  }

  await p.$disconnect();
  console.log('\nDone — duplicates merged and removed.');
}

main().catch(e => { console.error(e); process.exit(1); });
