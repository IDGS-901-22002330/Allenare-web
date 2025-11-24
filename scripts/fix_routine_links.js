/*
Migration helper: Fix routine_exercises.routineID to point to the routine document id.

Usage (dry-run):
  node scripts/fix_routine_links.js /path/to/serviceAccountKey.json

Apply changes (destructive):
  node scripts/fix_routine_links.js /path/to/serviceAccountKey.json --apply

Notes:
- Requires Node.js and `npm i firebase-admin` in the workspace (or globally).
- The script will print a summary of actions it would take by default.
- Use with caution and a backup of your Firestore data.
*/

const admin = require("firebase-admin");
const path = require("path");

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error(
      "Usage: node scripts/fix_routine_links.js /path/to/serviceAccount.json [--apply]"
    );
    process.exit(1);
  }
  const serviceAccountPath = path.resolve(args[0]);
  const apply = args.includes("--apply");

  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  const db = admin.firestore();

  console.log(`Running ${apply ? "APPLY" : "DRY RUN"} mode`);

  const routinesSnap = await db.collection("routines").get();
  console.log(`Found ${routinesSnap.size} routines`);

  let totalFixed = 0;
  let totalChecked = 0;
  const problems = [];

  for (const rdoc of routinesSnap.docs) {
    const rdata = rdoc.data();
    const docId = rdoc.id;
    const routineField = rdata.routineID || docId;

    // Find exercises that refer to either the doc id or the routineID field
    const matches = new Map();

    const q1 = db
      .collection("routine_exercises")
      .where("routineID", "==", docId);
    const snap1 = await q1.get();
    for (const d of snap1.docs) matches.set(d.id, d);

    if (routineField !== docId) {
      const q2 = db
        .collection("routine_exercises")
        .where("routineID", "==", routineField);
      const snap2 = await q2.get();
      for (const d of snap2.docs) matches.set(d.id, d);
    }

    if (matches.size === 0) continue;

    console.log(
      `\nRoutine ${docId} (routineID field: ${routineField}) -> ${matches.size} child exercises found`
    );

    for (const [exId, exDoc] of matches) {
      totalChecked += 1;
      const exData = exDoc.data();
      if (exData.routineID !== docId) {
        problems.push({
          routineId: docId,
          exerciseId: exId,
          oldRoutineID: exData.routineID,
        });
        console.log(
          `  Will update exercise ${exId}: routineID ${exData.routineID} -> ${docId}`
        );
        if (apply) {
          await db
            .collection("routine_exercises")
            .doc(exId)
            .set({ routineID: docId }, { merge: true });
          totalFixed += 1;
        }
      } else {
        console.log(`  OK exercise ${exId} already points to ${docId}`);
      }
    }
  }

  console.log(`\nChecked ${totalChecked} exercises, fixed ${totalFixed}`);
  if (!apply)
    console.log("Dry run complete. Re-run with --apply to persist changes.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
