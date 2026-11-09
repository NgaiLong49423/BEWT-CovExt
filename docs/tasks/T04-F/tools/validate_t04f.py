import copy
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
TASK = ROOT / "docs/tasks/T04-F"
APPS = ["bludit", "claroline", "expresscart", "joomla", "mantisbt", "mediawiki", "prestashop"]
BASE_SHA = "0501249ff3e9a5ea83a06155cd2971dc36197056"
BASE_TREE = "d38fcc0eae8073023c48bb46998741c8c19d4d06"
ALLOWED_DISPOSITIONS = {"RECOMMEND_FOR_HUMAN_REVIEW", "RECOMMEND_REVISION", "RECOMMEND_REJECTION_REVIEW", "NEEDS_MORE_EVIDENCE"}
FORBIDDEN_STATUS = {"VALIDATED", "ACCEPTED", "ACCEPTED_FOR_IMPLEMENTATION", "RUNTIME_PASS", "E2E_PASS", "RQ2_EVALUATED"}


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def load_inputs():
    proposals, shortlist, mappings = {}, {}, {}
    for app in APPS:
        proposals[app] = read_json(ROOT / f"data/coverage/{app}/source-backed-gap-proposals.json")
        shortlist[app] = read_json(ROOT / f"data/coverage/{app}/source-backed-gap-shortlist.json")
        mappings[app] = read_json(ROOT / f"data/coverage/{app}/baseline-mapping.json")
    source_index = read_json(ROOT / "docs/tasks/T04-E/source-reference-index.json")
    return proposals, shortlist, mappings, source_index


def expected_permalink(path, commit, line_refs):
    url = f"https://github.com/OlianasD/BEWT/blob/{commit}/{path}"
    nums = [ref.get("line") for ref in line_refs]
    if nums:
        url += f"#L{nums[0]}" + (f"-L{nums[-1]}" if nums[-1] != nums[0] else "")
    return url


def validate_data(packets_doc, index, proposals, shortlist_docs, mappings, source_index):
    errors = []
    records = packets_doc.get("records", [])
    by_id = {r.get("candidateId"): r for r in records}
    proposal_by_id = {c["candidateId"]: (app, proposal, c) for app, proposal in proposals.items() for c in proposal.get("candidates", [])}
    if len(records) != 27: errors.append(f"expected 27 records; got {len(records)}")
    if len(by_id) != len(records): errors.append("duplicate packet candidate IDs")
    if set(by_id) != set(proposal_by_id): errors.append("packet IDs do not exactly match proposal IDs")
    expected_short = {}
    for app, sdoc in shortlist_docs.items():
        for entry in sdoc.get("topCandidates", []): expected_short[entry["candidateId"]] = entry["priorityOrder"]
    if len(expected_short) != 20: errors.append(f"input shortlist expected 20; got {len(expected_short)}")
    if sum(bool(r.get("shortlisted")) for r in records) != 20: errors.append("packet shortlist count is not 20")

    src_refs = source_index.get("apps", {})
    for cid, (app, prop, original) in proposal_by_id.items():
        r = by_id.get(cid)
        if not r: continue
        if r.get("application") != app: errors.append(f"{cid}: wrong application")
        if r.get("originalStatus") != original.get("scenarioStatus"): errors.append(f"{cid}: original status differs from T04-E")
        if r.get("version") != original.get("version"): errors.append(f"{cid}: candidate version differs from T04-E")
        if r.get("shortlisted") != (cid in expected_short): errors.append(f"{cid}: shortlist membership mismatch")
        if r.get("priorityReviewOrder") != expected_short.get(cid): errors.append(f"{cid}: shortlist priority mismatch")
        if r.get("sourcePin") != prop.get("sourcePin"): errors.append(f"{cid}: source pin mismatch")
        if r.get("baselinePin") != prop.get("baselinePin") or r.get("baselinePin", {}).get("commit") != BASE_SHA or r.get("baselinePin", {}).get("treeSha") != BASE_TREE: errors.append(f"{cid}: baseline pin mismatch")
        if r.get("humanDecision") is not None or r.get("humanDecisionOwner") != "Team Lead / human reviewer": errors.append(f"{cid}: human decision mutated")
        if r.get("noveltyStatus") != "NOT_VERIFIED" or r.get("runtimeStatus") != "NOT_RUN": errors.append(f"{cid}: novelty/runtime status escalated")
        if r.get("suggestedDisposition") not in ALLOWED_DISPOSITIONS: errors.append(f"{cid}: invalid suggestedDisposition")
        if r.get("semanticOverlapAssessment", {}).get("classification") == "PARTIAL_SEMANTIC_OVERLAP" and not r.get("baselineCaseComparisons"): errors.append(f"{cid}: partial semantic overlap has no comparator evidence")
        if r.get("shortlisted"):
            questions = r.get("reviewerQuestions", [])
            if len(questions) < 3 or any("closest comparator" in q.lower() or "which source-backed observable" in q.lower() for q in questions): errors.append(f"{cid}: reviewer questions are generic/incomplete")
        for key in ("scenarioStatus", "noveltyStatus", "runtimeStatus", "suggestedDisposition"):
            val = str(r.get(key, "")).upper()
            if any(term in val for term in FORBIDDEN_STATUS): errors.append(f"{cid}: forbidden status in {key}")
        for sr in r.get("sourceReferences", []):
            ref = src_refs.get(app, {}).get("sourceReferences", {}).get(sr.get("id"))
            if not ref or sr.get("commit") != ref.get("commit") or sr.get("treeSha") != ref.get("treeSha") or sr.get("path") != ref.get("path") or sr.get("blobSha") != ref.get("blobSha"): errors.append(f"{cid}: invalid source ref {sr.get('id')}")
            if ref and sr.get("permalink") != ref.get("permalink"): errors.append(f"{cid}: source permalink mismatch {sr.get('id')}")
            if sr.get("repository") != prop.get("sourcePin", {}).get("repository"): errors.append(f"{cid}: source repository mismatch {sr.get('id')}")
            if not re.fullmatch(r"[0-9a-f]{40}", str(sr.get("blobSha", ""))): errors.append(f"{cid}: malformed source blob SHA {sr.get('id')}")
            if not sr.get("lineRanges") or not re.fullmatch(r"https://github\.com/[^/]+/[^/]+/blob/[0-9a-f]{40}/.+", str(sr.get("permalink", ""))): errors.append(f"{cid}: invalid source path/permalink {sr.get('id')}")
            ranges = str(sr.get("lineRanges", "")).split(",")
            for part in ranges:
                m = re.fullmatch(r"(\d+)(?:-(\d+))?", part.strip())
                if not m or (m.group(2) and int(m.group(2)) < int(m.group(1))): errors.append(f"{cid}: malformed source line range {sr.get('id')}"); break

    baseline_records = index.get("baselineEvidenceRecords", [])
    evidence_by_id = {e.get("evidenceId"): e for e in baseline_records}
    record_keys = {(e.get("application"), e.get("caseId")) for e in baseline_records}
    if len(record_keys) != len(baseline_records): errors.append("duplicate baseline evidence records")
    links = index.get("candidateBaselineLinks", [])
    link_keys = [(x.get("candidateId"), x.get("baselineCaseId")) for x in links]
    if len(set(link_keys)) != len(link_keys): errors.append("duplicate candidate-baseline link rows")
    packet_links = []
    packet_pairs = {}
    for r in records:
        for c in r.get("baselineCaseComparisons", []):
            if c.get("candidateId") != r.get("candidateId"): errors.append(f"{r.get('candidateId')}: comparison candidateId mismatch")
            pair = (r.get("candidateId"), c.get("caseId"))
            packet_links.append(pair)
            packet_pairs[pair] = c
    if sorted(packet_links) != sorted(link_keys): errors.append("candidate-baseline links mismatch between packets and index")

    map_by_app_case = {}
    for app, doc in mappings.items(): map_by_app_case[app] = {e.get("caseId"): e for e in doc.get("entries", [])}
    for ev in baseline_records:
        app, case = ev.get("application"), ev.get("caseId")
        mapped = map_by_app_case.get(app, {}).get(case)
        if not mapped: errors.append(f"{ev.get('evidenceId')}: case not present in pinned baseline mapping"); continue
        if ev.get("baselinePin", {}).get("commit") != BASE_SHA or ev.get("baselinePin", {}).get("treeSha") != BASE_TREE: errors.append(f"{case}: evidence baseline pin mismatch")
        for field, mapped_field in (("featurePath", "featurePath"), ("featureBlobSha", "featureBlobSha"), ("javaPath", "javaPath"), ("javaBlobSha", "javaBlobSha")):
            if ev.get(field) != mapped.get(mapped_field): errors.append(f"{case}: {field} mismatch with T04-D pinned mapping")
        for path_field, refs_field, map_refs_field, permalink_field in (("featurePath", "gherkinLineRefs", "thenLineRefs", "gherkinPermalink"), ("javaPath", "javaAssertionLineRefs", "assertionLineRefs", "javaPermalink")):
            refs = ev.get(refs_field, [])
            known = mapped.get(map_refs_field, [])
            if [(x.get("line"), x.get("kind")) for x in refs] != [(x.get("line"), x.get("kind")) for x in known]: errors.append(f"{case}: {refs_field} mismatch with pinned mapping")
            if any(not isinstance(x.get("line"), int) or x["line"] < 1 for x in refs): errors.append(f"{case}: invalid line anchor")
            path = ev.get(path_field)
            if not path or path.startswith("/") or ".." in Path(path).parts: errors.append(f"{case}: unsafe or missing path")
            expected = expected_permalink(path, BASE_SHA, refs)
            if ev.get(permalink_field) != expected: errors.append(f"{case}: malformed/wrong-pin permalink {permalink_field}")
        if not re.fullmatch(r"[0-9a-f]{40}", str(ev.get("featureBlobSha", ""))) or not re.fullmatch(r"[0-9a-f]{40}", str(ev.get("javaBlobSha", ""))): errors.append(f"{case}: malformed blob SHA")
        if ev.get("directContentVerification") not in {"PINNED_CONTENT_VERIFIED", "NOT_VERIFIED"}: errors.append(f"{case}: invalid content verification status")
        if ev.get("directContentVerification") == "PINNED_CONTENT_VERIFIED":
            obs = ev.get("verifiedLineObservations", {})
            if obs.get("verifiedAtCommit") != BASE_SHA or not obs.get("gherkin", {}).get("lines") or not obs.get("java", {}).get("lines") or not obs.get("limits"):
                errors.append(f"{case}: direct-content evidence missing pin, line observations, or limits")
            for line in obs.get("gherkin", {}).get("lines", []) + obs.get("java", {}).get("lines", []):
                if not isinstance(line, int) or line < 1: errors.append(f"{case}: invalid directly verified source line")

    for link in links:
        cid, case, app = link.get("candidateId"), link.get("baselineCaseId"), link.get("application")
        if cid not in by_id: errors.append(f"link has unknown candidate {cid}"); continue
        if by_id[cid].get("application") != app: errors.append(f"{cid}/{case}: application mismatch")
        if link.get("baselinePin", {}).get("commit") != BASE_SHA or link.get("baselinePin", {}).get("treeSha") != BASE_TREE: errors.append(f"{cid}/{case}: link pin mismatch")
        ev = evidence_by_id.get(link.get("evidenceId"))
        if not ev or ev.get("application") != app or ev.get("caseId") != case: errors.append(f"{cid}/{case}: invalid evidenceId")
        pair = packet_pairs.get((cid, case))
        if pair and ev:
            if pair.get("baselinePin", {}).get("commit") != BASE_SHA: errors.append(f"{cid}/{case}: packet comparison pin mismatch")
            if pair.get("featurePath") != ev.get("featurePath") or pair.get("featureBlobSha") != ev.get("featureBlobSha") or pair.get("javaPath") != ev.get("javaPath") or pair.get("javaBlobSha") != ev.get("javaBlobSha"): errors.append(f"{cid}/{case}: packet/index source traceability mismatch")

    # The eight no-comparator entries must declare searched inventory and a bounded conclusion.
    searches = {x.get("candidateId"): x for x in index.get("baselineSearches", [])}
    for cid, scope in searches.items():
        if cid not in by_id: errors.append(f"search scope has unknown candidate {cid}"); continue
        if scope.get("searchDisposition") != "NO_RELEVANT_BASELINE_CASE_IDENTIFIED_AT_PIN": errors.append(f"{cid}: missing no-relevant-case disposition")
        app = by_id[cid].get("application"); expected_cases = {e.get("caseId") for e in mappings[app].get("entries", [])}
        expected_features = {e.get("featurePath") for e in mappings[app].get("entries", [])} | set(mappings[app].get("unmappedFeaturePaths", []))
        expected_java = {e.get("javaPath") for e in mappings[app].get("entries", []) if e.get("javaPath")} | {e.get("javaPath") for e in mappings[app].get("unmappedSuiteEvidence", []) if e.get("javaPath")}
        if set(scope.get("inventoryCaseIds", [])) != expected_cases: errors.append(f"{cid}: mapped inventory case scope incomplete")
        if set(scope.get("inventoryFeaturePaths", [])) != expected_features: errors.append(f"{cid}: feature path search scope incomplete")
        if set(scope.get("inventoryJavaPaths", [])) != expected_java: errors.append(f"{cid}: Java path search scope incomplete")
        if scope.get("featureEntriesEnumerated") != len(expected_features): errors.append(f"{cid}: feature inventory count mismatch")
        if scope.get("javaEntriesEnumerated") != len(expected_java): errors.append(f"{cid}: Java inventory count mismatch")
        if "does not establish novelty" not in scope.get("conclusionLimit", "").lower(): errors.append(f"{cid}: missing novelty limit")
    for r in records:
        if r.get("semanticOverlapAssessment", {}).get("searchDisposition") == "NO_RELEVANT_BASELINE_CASE_IDENTIFIED_AT_PIN" and r.get("candidateId") not in searches: errors.append(f"{r.get('candidateId')}: missing search scope record")

    # Candidate-specific nearby-case screens are provenance for bounded no-relevant-case searches,
    # not semantic comparison links and do not inflate the comparison-case count.
    nearby = index.get("screenedNearbyEvidence", [])
    nearby_keys = set()
    for item in nearby:
        cid, app, case = item.get("candidateId"), item.get("application"), item.get("baselineCaseId")
        mapped = map_by_app_case.get(app, {}).get(case)
        if cid not in by_id or not mapped: errors.append(f"invalid nearby search evidence link {cid}/{case}"); continue
        if by_id[cid].get("application") != app: errors.append(f"{cid}/{case}: nearby evidence application mismatch")
        if item.get("baselinePin", {}).get("commit") != BASE_SHA or item.get("baselinePin", {}).get("treeSha") != BASE_TREE: errors.append(f"{cid}/{case}: nearby evidence pin mismatch")
        for field, mapped_field in (("featurePath", "featurePath"), ("featureBlobSha", "featureBlobSha"), ("javaPath", "javaPath"), ("javaBlobSha", "javaBlobSha")):
            if item.get(field) != mapped.get(mapped_field): errors.append(f"{cid}/{case}: nearby {field} mismatch")
        for path_field, refs_field, map_refs_field, permalink_field in (("featurePath", "gherkinLineRefs", "thenLineRefs", "gherkinPermalink"), ("javaPath", "javaAssertionLineRefs", "assertionLineRefs", "javaPermalink")):
            refs=item.get(refs_field, [])
            known=mapped.get(map_refs_field, [])
            if [(x.get("line"),x.get("kind")) for x in refs] != [(x.get("line"),x.get("kind")) for x in known]: errors.append(f"{cid}/{case}: nearby {refs_field} mismatch")
            if item.get(permalink_field) != expected_permalink(item.get(path_field), BASE_SHA, refs): errors.append(f"{cid}/{case}: nearby permalink mismatch")
        if item.get("relationship") != "SCREENED_NEARBY_BUT_NOT_RELEVANT_TO_CANDIDATE_ORACLE": errors.append(f"{cid}/{case}: nearby case misclassified as direct comparison")
        nearby_keys.add((cid,case))
    packet_nearby={(r.get("candidateId"), item.get("baselineCaseId")) for r in records for item in r.get("semanticOverlapAssessment", {}).get("nearbyCaseEvidence", [])}
    if nearby_keys != packet_nearby: errors.append("nearby search evidence mismatch between packets and index")

    expected_counts = index.get("counts", {})
    if expected_counts.get("distinctBaselineCases") != len(record_keys): errors.append("distinct-baseline count mismatch")
    if expected_counts.get("candidateBaselineLinks") != len(links): errors.append("candidate-baseline link count mismatch")
    if expected_counts.get("screenedNearbyCandidateCaseLinks") != len(nearby): errors.append("screened-nearby evidence count mismatch")
    return errors


def negative_tests(packets_doc, index, proposals, shortlist_docs, mappings, source_index):
    tests = []
    def expect_error(name, mutate):
        p, i = copy.deepcopy(packets_doc), copy.deepcopy(index)
        mutate(p, i)
        errs = validate_data(p, i, proposals, shortlist_docs, mappings, source_index)
        tests.append((name, bool(errs), errs[:2]))
    expect_error("candidate ID", lambda p,i: p["records"][0].__setitem__("candidateId", "BAD-ID"))
    expect_error("original status", lambda p,i: p["records"][0].__setitem__("originalStatus", "ACCEPTED"))
    expect_error("missing candidate-baseline link", lambda p,i: i["candidateBaselineLinks"].pop())
    expect_error("incorrect candidate-baseline link", lambda p,i: i["candidateBaselineLinks"][0].__setitem__("candidateId", "BAD-ID"))
    expect_error("baseline pin", lambda p,i: i["baselineEvidenceRecords"][0]["baselinePin"].__setitem__("commit", "0"*40))
    expect_error("baseline blob SHA", lambda p,i: i["baselineEvidenceRecords"][0].__setitem__("featureBlobSha", "bad-sha"))
    expect_error("source pin/blob", lambda p,i: p["records"][0]["sourceReferences"][0].__setitem__("blobSha", "bad-sha"))
    expect_error("incorrect source pin", lambda p,i: p["records"][0]["sourceReferences"][0].__setitem__("commit", "0"*40))
    expect_error("anchor", lambda p,i: i["baselineEvidenceRecords"][0].__setitem__("gherkinPermalink", "https://github.com/OlianasD/BEWT/blob/main/bad.feature#L0"))
    expect_error("status", lambda p,i: p["records"][0].__setitem__("noveltyStatus", "ACCEPTED_FOR_IMPLEMENTATION"))
    expect_error("shortlist", lambda p,i: p["records"][0].__setitem__("shortlisted", not p["records"][0]["shortlisted"]))
    expect_error("shortlist priority", lambda p,i: p["records"][0].__setitem__("priorityReviewOrder", 999))
    expect_error("generic reviewer questions", lambda p,i: next(x for x in p["records"] if x.get("shortlisted")).__setitem__("reviewerQuestions", ["Which baseline case is the closest comparator?", "Which source-backed observable needs review?", "Which fixture may change the outcome?"]))
    expect_error("nearby evidence link", lambda p,i: i["screenedNearbyEvidence"][0].__setitem__("candidateId", "BAD-ID"))
    return tests


def scope_paths():
    merge_base = subprocess.check_output(["git", "merge-base", "HEAD", "origin/main"], cwd=ROOT, text=True).strip()
    committed = subprocess.check_output(["git", "diff", "--name-only", f"{merge_base}...HEAD"], cwd=ROOT, text=True).splitlines()
    staged = subprocess.check_output(["git", "diff", "--cached", "--name-only"], cwd=ROOT, text=True).splitlines()
    unstaged = subprocess.check_output(["git", "diff", "--name-only"], cwd=ROOT, text=True).splitlines()
    untracked = [line[3:] for line in subprocess.check_output(["git", "status", "--porcelain"], cwd=ROOT, text=True).splitlines() if line.startswith("?? ")]
    return merge_base, sorted(set(committed + staged + unstaged + untracked))


def secret_scan():
    patterns = {
        "GitHub token": re.compile(r"(?i)\bgh[pousr]_[A-Za-z0-9]{25,}\b"),
        "AWS access key": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
        "private key": re.compile(r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----"),
        "email address": re.compile(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b"),
    }
    findings = []
    for path in TASK.rglob("*"):
        if not path.is_file(): continue
        try: text = path.read_text(encoding="utf-8-sig")
        except UnicodeDecodeError: findings.append(f"unreadable text artifact: {path.relative_to(ROOT)}"); continue
        for label, pattern in patterns.items():
            if pattern.search(text): findings.append(f"{label} marker in {path.relative_to(ROOT)}")
    return findings


def validate_report_counts(packets, index):
    errors = []
    report = read_json(TASK / "PROPOSED-STATUS-UPDATE.json")
    records = packets.get("records", [])
    from collections import Counter
    semantic = Counter(r.get("semanticOverlapAssessment", {}).get("classification") for r in records)
    oracle = Counter(r.get("oracleAssessment", {}).get("classification") for r in records)
    sem_ids = {r["candidateId"] for r in records if r.get("semanticOverlapAssessment", {}).get("classification") == "INSUFFICIENT_EVIDENCE"}
    oracle_ids = {r["candidateId"] for r in records if r.get("oracleAssessment", {}).get("classification") == "INSUFFICIENT_EVIDENCE"}
    stats = report.get("candidateCounts", {})
    if stats.get("semanticOverlap") != {"PARTIAL_SEMANTIC_OVERLAP": semantic["PARTIAL_SEMANTIC_OVERLAP"], "INSUFFICIENT_EVIDENCE": semantic["INSUFFICIENT_EVIDENCE"], "LIKELY_DUPLICATE": semantic["LIKELY_DUPLICATE"], "NO_DIRECT_SEMANTIC_OVERLAP": semantic["NO_DIRECT_SEMANTIC_OVERLAP"]}: errors.append("proposed semantic counts do not match packets")
    if stats.get("oracle") != dict(oracle): errors.append("proposed oracle counts do not match packets")
    union = sem_ids | oracle_ids
    if stats.get("insufficientEvidenceUnion", {}).get("candidateIds") != sorted(union) or stats.get("insufficientEvidenceUnion", {}).get("count") != len(union): errors.append("proposed insufficient-evidence union is incorrect")
    if report.get("proposedStatus") != "PARTIAL_WITH_LIMITATIONS" or report.get("applyToSharedStatus") is not False: errors.append("proposed status or shared-status protection incorrect")
    if report.get("baselineTraceability", {}).get("candidateBaselineLinks") != len(index.get("candidateBaselineLinks", [])) or report.get("baselineTraceability", {}).get("distinctBaselineCases") != len(index.get("baselineEvidenceRecords", [])): errors.append("proposed baseline traceability counts mismatch")
    return errors


def main():
    proposals, shortlist_docs, mappings, source_index = load_inputs()
    packets = read_json(TASK / "HUMAN-REVIEW-PACKETS.json")
    index = read_json(TASK / "SOURCE-AND-BASELINE-EVIDENCE-INDEX.json")
    errors = validate_data(packets, index, proposals, shortlist_docs, mappings, source_index)
    errors += validate_report_counts(packets, index)
    secrets = secret_scan()
    errors += secrets
    tests = negative_tests(packets, index, proposals, shortlist_docs, mappings, source_index)
    failed_tests = [x for x in tests if not x[1]]
    if failed_tests: errors.append("negative tests failed: " + ", ".join(x[0] for x in failed_tests))
    try:
        merge_base, paths = scope_paths()
        outside = [x for x in paths if not x.startswith("docs/tasks/T04-F/")]
        if outside: errors.append("out-of-scope paths vs merge-base: " + ", ".join(outside))
    except Exception as ex:
        merge_base, paths = "NOT_VERIFIED", []
        errors.append(f"scope validation unavailable: {ex}")
    print(f"records={len(packets.get('records', []))}; shortlist={sum(bool(x.get('shortlisted')) for x in packets.get('records', []))}; baseline_links={len(index.get('candidateBaselineLinks', []))}; distinct_cases={len(index.get('baselineEvidenceRecords', []))}; screened_nearby_links={len(index.get('screenedNearbyEvidence', []))}")
    print(f"negative_tests={len(tests)}; passed={len(tests)-len(failed_tests)}; failed={len(failed_tests)}")
    print(f"secret_scan={'PASS' if not secrets else 'FAIL'}; findings={len(secrets)}")
    print(f"scope_merge_base={merge_base}; changed_paths={len(paths)}; out_of_scope=0" if not errors else f"scope_merge_base={merge_base}; changed_paths={len(paths)}")
    print("pinned content verification: " + ", ".join(sorted({x.get("caseId") for x in index.get("baselineEvidenceRecords", []) if x.get("directContentVerification") == "PINNED_CONTENT_VERIFIED"})) + "; other indexed line contents remain NOT_VERIFIED by this validator")
    if errors:
        print("FAIL")
        for e in errors: print("- " + e)
        return 1
    print("PASS")
    return 0

if __name__ == "__main__":
    sys.exit(main())
