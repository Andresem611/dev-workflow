# Test Immutability Override Protocol

When a locked test is provably wrong (test was authored before requirement clarified, or DOCUMENT generated an off-target test), follow this 4-step override:

## Override steps

1. **Identify the locked test file and reason.** Reason must be one sentence describing why the test is wrong (not "it failed" — explain why the test is incorrect).

2. **Run the override command:**

   ```bash
   node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js override-test \
     <feature-dir> \
     --plugin frontend \
     --task T-NN \
     --reason "<one-sentence reason>"
   ```

   The command will surface the exact attestation string you must type next.

3. **Re-run with the typed attestation:**

   The tool will display: `OVERRIDE T-NN: <reason>`. Re-run with `--attestation "<that exact string>"` appended:

   ```bash
   node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js override-test \
     <feature-dir> --plugin frontend --task T-NN \
     --reason "<reason>" \
     --attestation "OVERRIDE T-NN: <reason>"
   ```

   Mismatched attestation FAILs without side effects. **No `--force` flag.** No bypass.

4. **Re-author the test and re-run DOCUMENT:**

   ```bash
   /dev:document --task T-NN
   ```

   DOCUMENT regenerates the test's `@sha256` frontmatter line. After this completes, `verify-test-immutability` returns res.valid=true again.

## What happens internally

- An immutable line is appended to `<feature>/.dev/test-overrides.log` with timestamp, task ID, and reason.
- The test file's `@sha256` line is replaced with `<UNLOCKED — pending re-DOCUMENT>` so subsequent BUILD Layer 0 checks FAIL until DOCUMENT re-locks the test.

## Why no bypass

The strict-edit guardrail's value comes from the inability to silently edit a test that no longer matches a requirement. A `--force` flag would convert this gate to advisory — exactly the AP-13 anti-pattern. The typed-attestation requirement makes overrides intentional and audit-trailable.

## Audit trail

`.dev/test-overrides.log` is append-only. Format:

```
2026-05-09T14:23:01.000Z	T-05	requirement R-12 was rewritten in U-23 amendment
2026-05-09T15:08:42.000Z	T-08	test asserted dependency that PLAN moved to wave-04
```

This log persists across pause/resume and is committed with the feature. SHIP audits the log size as a soft signal of test-spec drift during build.
