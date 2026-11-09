#!/usr/bin/env python3
"""Validate T04-G artifacts against T04-D mappings, T04-F packets, and pinned Git source."""
from __future__ import annotations

import argparse
import copy
import json
import re
import subprocess
import sys
from pathlib import Path

from build_t04g_source import (
    APPS, PIN, TASK, ROOT, make_outputs, read_json, json_bytes,
    read_git_blob, verify_blob_bytes, redact_excerpt, PASSWORD_FIELD, SECRET_ASSIGNMENT,
)

JSON_OUTPUTS = (
    "evidence/cands.json", "evidence/cat.json", "evidence/comps.json", "evidence/near.json",
    "BEHAVIORAL-BASELINE-CATALOG.json", "CANDIDATE-BASELINE-DELTA.json", "HUMAN-REVIEW-QUEUE.json",
)
TEXT_SUFFIXES = {".json", ".md", ".py", ".txt"}
TAXONOMY = {"Normal flow", "Negative/validation", "Boundary condition",
            "Authorization/role", "State/lifecycle", "Search/navigation"}

def model_docs(output_map):
    return {path.relative_to(TASK).as_posix(): value for path, value in output_map.items()}

def issue_scope_errors():
    errors = []
    base_proc = subprocess.run(["git", "-C", str(ROOT), "merge-base", "origin/main", "HEAD"],
                               capture_output=True, text=True)
    if base_proc.returncode:
        return ["scope cannot be checked: origin/main merge-base unavailable"]
    base = base_proc.stdout.strip()
    changed = set()
    for args in (["diff", "--name-only", base], ["diff", "--cached", "--name-only"]):
        p = subprocess.run(["git", "-C", str(ROOT), *args], capture_output=True, text=True)
        if p.returncode:
            errors.append("scope git diff failed")
        else:
            changed.update(x.strip() for x in p.stdout.splitlines() if x.strip())
    status = subprocess.run(["git", "-C", str(ROOT), "status", "--porcelain", "-uall"],
                            capture_output=True, text=True)
    if status.returncode:
        errors.append("scope git status failed")
    else:
        for line in status.stdout.splitlines():
            name = line[3:].split(" -> ")[-1].strip()
            if name:
                changed.add(name)
    outside = sorted(x for x in changed if not x.startswith("docs/tasks/T04-G/"))
    if outside:
        errors.append("out-of-scope changes: " + ", ".join(outside))
    return errors

def artifact_text_errors():
    errors = []
    for path in TASK.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        if "baseline-checkout" in path.parts or ".git" in path.parts:
            continue
        try:
            text = path.read_bytes().decode("utf-8", "strict")
        except UnicodeError:
            errors.append("invalid UTF-8: " + path.relative_to(TASK).as_posix())
            continue
        if "\ufffd" in text:
            errors.append("U+FFFD replacement character: " + path.relative_to(TASK).as_posix())
    return errors

def validate_documents(docs, expected, mappings, candidates, direct_links, nearby):
    errors = []
    expected_docs = {path.relative_to(TASK).as_posix(): value for path, value in expected.items()}
    for name in JSON_OUTPUTS:
        if name not in docs:
            errors.append("missing output: " + name)
        elif name not in expected_docs:
            errors.append("missing expected output: " + name)
        elif json_bytes(docs[name]) != json_bytes(expected_docs[name]):
            errors.append("output differs from pinned-source rebuild: " + name)

    catalog = docs.get("BEHAVIORAL-BASELINE-CATALOG.json", {})
    delta = docs.get("CANDIDATE-BASELINE-DELTA.json", {})
    queue = docs.get("HUMAN-REVIEW-QUEUE.json", {})
    units = catalog.get("units", [])
    records = delta.get("records", [])
    qrecords = queue.get("records", [])

    # Completeness and one-case/one-draft-unit integrity against all seven T04-D maps.
    mapped = {}
    expected_by_app = {}
    for app in APPS:
        entries = mappings[app].get("entries", [])
        expected_by_app[app] = {x["caseId"]: x for x in entries}
        for entry in entries:
            if entry["caseId"] in mapped:
                errors.append("duplicate case ID in T04-D: " + entry["caseId"])
            mapped[entry["caseId"]] = (app, entry)
    actual_unit_ids = [u.get("unitId") for u in units]
    if len(actual_unit_ids) != len(set(actual_unit_ids)):
        errors.append("duplicate unitId")
    actual_cases = []
    for unit in units:
        cases = unit.get("baselineCaseIds", [])
        if len(cases) != 1:
            errors.append("case-level draft must contain exactly one baseline case")
        for case_id in cases:
            actual_cases.append(case_id)
            owner = mapped.get(case_id)
            if owner is None:
                errors.append("unit contains unknown T04-D case: " + str(case_id))
            elif unit.get("application") != owner[0]:
                errors.append("case assigned to wrong application: " + case_id)
            elif unit.get("unitId") != "BU-" + owner[0].upper() + "-" + case_id[len(owner[0])+1:].upper():
                errors.append("case assigned to wrong unitId: " + case_id)
            elif unit.get("gherkinEvidence", {}).get("path") != owner[1].get("featurePath"):
                errors.append("feature path differs from T04-D: " + case_id)
            elif unit.get("gherkinEvidence", {}).get("blobSha") != owner[1].get("featureBlobSha"):
                errors.append("feature blob SHA differs from T04-D: " + case_id)
            elif unit.get("gherkinEvidence", {}).get("expectedThenLineRefs") != owner[1].get("thenLineRefs", []):
                errors.append("Then anchors differ from T04-D: " + case_id)
            if owner:
                entry = owner[1]
                ja = unit.get("javaAssertionEvidence", {})
                if entry.get("javaPath") != ja.get("path"):
                    errors.append("Java path differs from T04-D: " + case_id)
                if entry.get("javaBlobSha") != ja.get("blobSha"):
                    errors.append("Java blob SHA differs from T04-D: " + case_id)
                if entry.get("assertionLineRefs", []) != ja.get("expectedAssertionLineRefs", []):
                    errors.append("Java assertion anchors differ from T04-D: " + case_id)
        if unit.get("reviewStatus") != "NEEDS_REVIEW":
            errors.append("unit review status elevated")
        if unit.get("baselinePin", {}).get("commit") != PIN:
            errors.append("unit baseline pin mismatch")
        if unit.get("unitCountDisposition") != "NOT_COUNTED_PENDING_SEMANTIC_GROUP_REVIEW":
            errors.append("unit is incorrectly counted")
        if not str(unit.get("taxonomyMethod", "")).startswith("PROVISIONAL_") or not unit.get("taxonomyCaveat"):
            errors.append("taxonomy is not clearly provisional")
        if not set(unit.get("taxonomy", [])).issubset(TAXONOMY):
            errors.append("unknown taxonomy label")
        gh = unit.get("gherkinEvidence", {})
        ja = unit.get("javaAssertionEvidence", {})
        g_ids = {x.get("evidenceId") for x in gh.get("stepEvidence", [])}
        g_ids.update(x.get("evidenceId") for x in gh.get("scenarioHeaderEvidence", []))
        j_ids = {x.get("evidenceId") for x in ja.get("assertions", [])}
        j_ids.update(x.get("evidenceId") for x in ja.get("methodEvidence", []))
        cited = (unit.get("preconditions", []) + unit.get("action", []) + unit.get("observable", [])
                 + unit.get("oracle", {}).get("gherkinExpectedEvidenceIds", [])
                 + unit.get("oracle", {}).get("javaAssertionEvidenceIds", []))
        if any(x not in g_ids | j_ids for x in cited):
            errors.append("unit cites missing evidence ID")
        step_lines = {x.get("line") for x in gh.get("stepEvidence", [])}
        if any(x.get("line") not in step_lines for x in gh.get("expectedThenLineRefs", [])):
            errors.append("Then anchor does not resolve to extracted Gherkin step")
        assertion_lines = {x.get("line") for x in ja.get("assertions", [])}
        if ja.get("path") and any(x.get("line") not in assertion_lines for x in ja.get("expectedAssertionLineRefs", [])):
            errors.append("Java assertion anchor does not resolve to extracted assertion")

    if len(actual_cases) != len(set(actual_cases)):
        errors.append("duplicate baseline case assigned to multiple units")
    if set(actual_cases) != set(mapped):
        errors.append("catalog case ID set differs from complete T04-D mapping set")

    # Derive aggregate and per-app totals instead of trusting declared counts.
    cat_counts = catalog.get("counts", {})
    expected_java_only = {app: mappings[app].get("unmappedSuiteClasses", []) for app in APPS}
    java_only_records = catalog.get("unmappedJavaTests", [])
    for app in APPS:
        entry_list = mappings[app].get("entries", [])
        actual_app_cases = [u for u in units if u.get("application") == app]
        app_java_only = [x for x in java_only_records if x.get("application") == app]
        app_count = catalog.get("extraction", {}).get("perApplicationCounts", {}).get(app, {})
        recomputed = {
            "featureFiles": len(entry_list),
            "explicitScenarioHeaders": sum(len(x.get("scenarioHeaderLines", [])) for x in entry_list),
            "mappedFeatureToJava": sum(bool(x.get("javaPath")) for x in entry_list),
            "featureOnly": sum(not bool(x.get("javaPath")) for x in entry_list),
            "javaSuiteEntries": sum(bool(x.get("javaPath")) for x in entry_list) + len(app_java_only),
            "javaOnly": len(app_java_only),
            "mappedJavaAssertionLines": sum(len(x.get("assertionLineRefs", [])) for x in entry_list),
            "javaOnlyAssertionLines": sum(len(x.get("assertionLineRefs", [])) for x in app_java_only),
            "expectedThenLineRefs": sum(len(x.get("thenLineRefs", [])) for x in entry_list),
            "provisionalCaseLevelRecords": len(actual_app_cases),
        }
        if app_count != recomputed:
            errors.append("per-application counts not derived from mapping: " + app)
        actual_only_classes = sorted(x.get("class") for x in app_java_only)
        if actual_only_classes != sorted(expected_java_only[app]):
            errors.append("Java-only test set differs from T04-D: " + app)
    recomputed_total = {
        "gherkinFeatureFiles": sum(len(mappings[a].get("entries", [])) for a in APPS),
        "explicitScenarioHeaders": sum(len(x.get("scenarioHeaderLines", [])) for a in APPS for x in mappings[a]["entries"]),
        "mappedFeatureToJava": sum(bool(x.get("javaPath")) for a in APPS for x in mappings[a]["entries"]),
        "featureOnly": sum(not bool(x.get("javaPath")) for a in APPS for x in mappings[a]["entries"]),
        "javaSuiteEntries": sum(bool(x.get("javaPath")) for a in APPS for x in mappings[a]["entries"]) + len(java_only_records),
        "javaOnly": len(java_only_records),
        "javaAssertionLines": sum(len(x.get("assertionLineRefs", [])) for a in APPS for x in mappings[a]["entries"])
                               + sum(len(x.get("assertionLineRefs", [])) for x in java_only_records),
        "expectedThenLineRefs": sum(len(x.get("thenLineRefs", [])) for a in APPS for x in mappings[a]["entries"]),
        "provisionalCaseLevelRecords": len(units),
        "possibleOracleSimilarityGroups": len(catalog.get("potentialSameOracleGroups", [])),
        "candidateBaselineLinks": len(direct_links),
        "distinctCandidateBaselineCases": len({x["baselineCaseId"] for x in direct_links}),
        "nearbyScreenedLinks": len(nearby),
        "officialBehavioralDenominator": None,
        "denominatorStatus": "NOT_ESTABLISHED",
    }
    if cat_counts != recomputed_total:
        errors.append("aggregate counts differ from recomputation")
    if catalog.get("baselinePin", {}).get("commit") != PIN:
        errors.append("catalog pin mismatch")
    if len(units) != 227 or cat_counts.get("officialBehavioralDenominator") is not None:
        errors.append("catalog unit count or denominator policy invalid")
    if len(java_only_records) != 2 or sum(x.get("mappingStatus") == "FEATURE_ONLY_NO_JAVA_MATCH_AT_PIN" for x in units) != 1:
        errors.append("feature-only/Java-only cases not preserved")
    if len(direct_links) != 46 or len({x["baselineCaseId"] for x in direct_links}) != 35 or len(nearby) != 19:
        errors.append("candidate link totals differ from required values")

    # Candidate/source traceability and precise queue order.
    source_ids = {x["candidateId"] for x in candidates}
    delta_ids = [x.get("candidateId") for x in records]
    queue_ids = [x.get("candidateId") for x in qrecords]
    if len(source_ids) != 27 or len(delta_ids) != 27 or set(delta_ids) != source_ids:
        errors.append("candidate IDs/count differ from T04-F")
    if len(queue_ids) != 27 or set(queue_ids) != source_ids:
        errors.append("queue candidate IDs/count differ from T04-F")
    if sum(bool(x.get("shortlisted")) for x in candidates) != 20:
        errors.append("T04-F shortlist count changed")
    expected_order = [x["candidateId"] for x in expected_docs.get("HUMAN-REVIEW-QUEUE.json", {}).get("records", [])]
    if queue_ids != expected_order:
        errors.append("review queue order differs from app/shortlist/priority/source ordering")
    for candidate in candidates:
        if candidate.get("humanDecision") is not None or candidate.get("noveltyStatus") not in ("NOT_VERIFIED", None):
            errors.append("T04-F candidate approval/novelty state elevated")
    if any(x.get("humanDecision") is not None or x.get("noveltyStatus") != "NOT_VERIFIED"
           or x.get("runtimeStatus") != "NOT_RUN" for x in records):
        errors.append("candidate delta status elevated")
    if any(x.get("humanDecision") is not None for x in qrecords):
        errors.append("queue human decision populated")
    group = next((x for x in catalog.get("potentialSameOracleGroups", []) if x.get("groupId") == "ORACLE-SIM-004"), None)
    if not group or "opposite lifecycle" not in group.get("falsePositiveRisk", "").lower() or group.get("countingEffect") != "NO_AUTOMATIC_MERGE_OR_DENOMINATOR_CHANGE":
        errors.append("ORACLE-SIM-004 false-positive warning or no-merge rule missing")
    if any(x.get("groupType") != "POSSIBLE_SAME_ORACLE" or x.get("reviewStatus") != "NEEDS_REVIEW"
           for x in catalog.get("potentialSameOracleGroups", [])):
        errors.append("oracle grouping hypothesis elevated")
    for name, obj in docs.items():
        for text in iter_strings(obj):
            for match in PASSWORD_FIELD.finditer(text):
                if "REDACTED_PASSWORD" not in match.group(0):
                    errors.append("unredacted credential-field value: " + name)
            for match in SECRET_ASSIGNMENT.finditer(text):
                if match.group(3) != "REDACTED_SECRET":
                    errors.append("unredacted secret assignment: " + name)
    return sorted(set(errors))

def iter_strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for child in value.values():
            yield from iter_strings(child)
    elif isinstance(value, list):
        for child in value:
            yield from iter_strings(child)

def load_current_docs():
    docs = {}
    for name in JSON_OUTPUTS:
        path = TASK / name
        if path.exists():
            docs[name] = read_json(path)
    return docs

def run_negative_tests(checkout, expected, mappings, inventories, candidates, links, nearby):
    base_docs = model_docs(expected)
    tests = []
    def add(name, mutate):
        docs = copy.deepcopy(base_docs)
        maps = copy.deepcopy(mappings)
        mutate(docs, maps)
        errors = validate_documents(docs, expected, maps, candidates, links, nearby)
        if errors:
            tests.append((name, True))
        else:
            tests.append((name, False))
    # Remove a case-level unit that is not used by any candidate link.
    linked = {x["baselineCaseId"] for x in links}
    unreferenced = next(u for u in expected[TASK/"BEHAVIORAL-BASELINE-CATALOG.json"]["units"]
                        if u["baselineCaseIds"][0] not in linked)
    add("remove-unreferenced-unit", lambda d,m: d["BEHAVIORAL-BASELINE-CATALOG.json"]["units"].remove(
        next(x for x in d["BEHAVIORAL-BASELINE-CATALOG.json"]["units"] if x["unitId"] == unreferenced["unitId"])))
    add("duplicate-unit-id", lambda d,m: d["BEHAVIORAL-BASELINE-CATALOG.json"]["units"][1].update(
        unitId=d["BEHAVIORAL-BASELINE-CATALOG.json"]["units"][0]["unitId"]))
    add("duplicate-case-id", lambda d,m: d["BEHAVIORAL-BASELINE-CATALOG.json"]["units"][1]["baselineCaseIds"].append(
        d["BEHAVIORAL-BASELINE-CATALOG.json"]["units"][0]["baselineCaseIds"][0]))
    add("feature-blob-sha", lambda d,m: d["BEHAVIORAL-BASELINE-CATALOG.json"]["units"][0]["gherkinEvidence"].update(blobSha="0"*40))
    add("java-assertion-anchor", lambda d,m: d["BEHAVIORAL-BASELINE-CATALOG.json"]["units"][0]["javaAssertionEvidence"]["assertions"][0].update(line=99999))
    add("aggregate-count", lambda d,m: d["BEHAVIORAL-BASELINE-CATALOG.json"]["counts"].update(gherkinFeatureFiles=226))
    add("queue-priority-order", lambda d,m: d["HUMAN-REVIEW-QUEUE.json"]["records"].reverse())
    add("candidate-baseline-link", lambda d,m: d["CANDIDATE-BASELINE-DELTA.json"]["records"][0]["candidateBaselineLinks"][0].update(baselineCaseId="missing-case"))
    add("nearby-link", lambda d,m: d["CANDIDATE-BASELINE-DELTA.json"]["records"][0]["nearbyScreenedLinks"].append({"candidateId":"bogus","baselineCaseId":"bogus"}))
    add("human-decision", lambda d,m: d["HUMAN-REVIEW-QUEUE.json"]["records"][0].update(humanDecision="ACCEPTED_FOR_IMPLEMENTATION"))
    add("shortlist-membership", lambda d,m: d["HUMAN-REVIEW-QUEUE.json"]["records"][0].update(shortlisted=False))
    add("replacement-character", lambda d,m: d["evidence/cands.json"][1]["reviewerQuestions"].__setitem__(0, "bad\ufffdtext"))
    def remove_credential_redaction(d, m):
        for unit in d["BEHAVIORAL-BASELINE-CATALOG.json"]["units"]:
            for step in unit["gherkinEvidence"]["stepEvidence"]:
                if "REDACTED_PASSWORD" in step["excerpt"]:
                    step["excerpt"] = step["excerpt"].replace("REDACTED_PASSWORD", "test-password")
                    return
        raise AssertionError("no password-field test fixture available")
    add("credential-redaction", remove_credential_redaction)
    add("missing-baseline-mapping", lambda d,m: m["prestashop"]["entries"].pop())
    add("then-anchor", lambda d,m: d["BEHAVIORAL-BASELINE-CATALOG.json"]["units"][0]["gherkinEvidence"]["expectedThenLineRefs"][0].update(line=99999))
    add("mismatched-output", lambda d,m: d["CANDIDATE-BASELINE-DELTA.json"]["records"][0].update(technicalRationale="altered"))
    try:
        first_app = next(iter(mappings))
        first_entry = mappings[first_app]["entries"][0]
        read_git_blob(checkout, first_entry["featurePath"], "0"*40)
        tests.append(("incorrect-blob-sha", False))
    except ValueError:
        tests.append(("incorrect-blob-sha", True))
    try:
        app = next(iter(mappings))
        entry = mappings[app]["entries"][0]
        blob, oid = read_git_blob(checkout, entry["featurePath"], entry["featureBlobSha"])
        verify_blob_bytes(blob[:-1], oid, entry["featurePath"])
        tests.append(("truncated-source", False))
    except ValueError:
        tests.append(("truncated-source", True))
    # The redactor must preserve ordinary quoted labels/messages and keep credential quotes balanced.
    plain = 'Then "Saved successfully" is shown in the "Status" field'
    password = 'When the user enters "fixture-pass" in the "Password" field'
    password_apostrophe = 'When the user enters "fixture\'pass" in the "Password" field'
    token = 'When the user enters "opaque" in the "Access token" field'
    java = 'String password = "fixture-pass";'
    redaction_ok = (redact_excerpt(plain) == plain
                    and redact_excerpt(password) == 'When the user enters "REDACTED_PASSWORD" in the "Password" field'
                    and redact_excerpt(password_apostrophe) == 'When the user enters "REDACTED_PASSWORD" in the "Password" field'
                    and redact_excerpt(token) == 'When the user enters "REDACTED_PASSWORD" in the "Access token" field'
                    and redact_excerpt(java) == 'String password = "REDACTED_SECRET";'
                    and "\ufffd" not in redact_excerpt(plain))
    tests.append(("quoted-string-redaction-and-syntax", redaction_ok))
    failed = [name for name, detected in tests if not detected]
    return tests, failed

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline-checkout", required=True, type=Path)
    parser.add_argument("--negative-tests", action="store_true")
    args = parser.parse_args()
    checkout = args.baseline_checkout.resolve()
    try:
        expected, mappings, inventories, candidates, links, nearby = make_outputs(checkout)
    except Exception as exc:
        print(json.dumps({"status":"NOT_VERIFIED","reason":str(exc)}, ensure_ascii=False))
        return 2
    current = load_current_docs()
    errors = validate_documents(current, expected, mappings, candidates, links, nearby)
    errors.extend(artifact_text_errors())
    errors.extend(issue_scope_errors())
    report = (TASK / "TASK-REPORT.md").read_text(encoding="utf-8") if (TASK / "TASK-REPORT.md").exists() else ""
    for required in (
        "Agent / Task: Agent 2 / T04-G", "Docker target: GOOGLE_CLOUD_ONLY",
        "Local Docker allowed: NO", "Cloud VM verified: NO", "Runtime lease owner: Agent 1",
        "Runtime performed: NO", "Changes required: apply this policy to future runtime tasks.",
        "Next action: complete static correction",
    ):
        if required not in report:
            errors.append("missing Cloud-only policy acknowledgement: " + required)
    test_output = []
    if args.negative_tests:
        results, failures = run_negative_tests(checkout, expected, mappings, inventories, candidates, links, nearby)
        test_output = [{"test": n, "result": "PASS" if ok else "FAIL"} for n, ok in results]
        if failures:
            errors.append("negative tests not detected: " + ", ".join(failures))
    if errors:
        print(json.dumps({"status":"FAIL", "errors":sorted(set(errors)), "negativeTests":test_output}, ensure_ascii=False))
        return 1
    cat = current["BEHAVIORAL-BASELINE-CATALOG.json"]
    d = current["CANDIDATE-BASELINE-DELTA.json"]
    q = current["HUMAN-REVIEW-QUEUE.json"]
    print(json.dumps({
        "status":"PASS", "sourceCommit":PIN, "sourceTree":cat["baselinePin"]["treeSha"],
        "units":len(cat["units"]), "candidates":len(d["records"]),
        "shortlist":sum(bool(x["shortlisted"]) for x in q["records"]),
        "directLinks":len(links), "distinctBaselineCases":len({x["baselineCaseId"] for x in links}),
        "nearbyLinks":len(nearby), "officialBehavioralDenominator":None,
        "negativeTests":test_output,
    }, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
