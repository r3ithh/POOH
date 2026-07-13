"use strict";

const { summarizeReference, verifyAllExampleReferences } = require("./example_reference");

async function main() {
  const references = await verifyAllExampleReferences();
  references.forEach((reference) => {
    console.log(`${summarizeReference(reference)} reference=OK`);
  });
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
