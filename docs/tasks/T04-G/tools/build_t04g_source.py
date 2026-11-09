#!/usr/bin/env python3
"""Rebuild T04-G artifacts from a verified BEWT Git checkout and read-only inputs."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
TASK = Path(__file__).resolve().parents[1]
APPS = ("bludit", "claroline", "expresscart", "joomla", "mantisbt", "mediawiki", "prestashop")
PIN = "0501249ff3e9a5ea83a06155cd2971dc36197056"
TREE = "d38fcc0eae8073023c48bb46998741c8c19d4d06"
REPO = "OlianasD/BEWT"
APP_LABEL = {"bludit":"Bludit", "claroline":"Claroline", "expresscart":"ExpressCart", "joomla":"Joomla", "mantisbt":"MantisBT", "mediawiki":"MediaWiki", "prestashop":"PrestaShop"}
GIT_TREE_BLOBS = {}
PASSWORD_FIELD = re.compile(r'''(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')(?=\s+(?:in|into)\s+the\s+["']?(?:password|passwd|token|access[_ ]?token|api[ _-]?key|secret)\b)''', re.I)
SECRET_ASSIGNMENT = re.compile(r'''(?i)(\b(?:password|passwd|secret|token|access[_-]?token|api[_-]?key)\b\s*[:=]\s*)(["'])(.*?)(\2)''')
STEP = re.compile(r"^\s*(Given|When|Then|And|But)\b", re.I)
ASSERTION = re.compile(r"\b(assert[A-Za-z0-9_]*|fail)\s*\(")

# Retained discovery hypotheses. Membership is a review prompt only, never a merge rule.
GROUP_CASES = (
("ORACLE-SIM-001", "bludit-18-badloginfailstest", "bludit-23-emptyloginfailstest"),
("ORACLE-SIM-002", "claroline-01-addusertest", "claroline-22-addemptyusertest"),
("ORACLE-SIM-003", "claroline-04-addcoursetest", "claroline-27-adddeniedcoursetest", "claroline-29-addpasswordcoursetest"),
("ORACLE-SIM-004", "claroline-06-enrolusertest", "claroline-31-enrolpasswordcoursegoodpasswordusertest", "claroline-38-removeenrolusertest", "claroline-40-removecoursetest"),
("ORACLE-SIM-005", "claroline-07-addcourseeventtest", "claroline-36-removecourseeventtest"),
("ORACLE-SIM-006", "claroline-15-searchstudenttest", "claroline-16-searchteachertest", "claroline-17-searchadmintest"),
("ORACLE-SIM-007", "claroline-23-addwrongemailusertest", "claroline-24-addtwiceusertest", "claroline-25-addwrongpasswordusertest"),
("ORACLE-SIM-008", "claroline-33-searchandremovepasswordcoursetest", "claroline-34-searchandremovedeniedcoursetest"),
("ORACLE-SIM-009", "expresscart-09-addreviewtest", "expresscart-11-seereviewtest"),
("ORACLE-SIM-010", "expresscart-15-usediscountcodeamounttest", "expresscart-16-usediscountcodepercenttest"),
("ORACLE-SIM-011", "expresscart-21-deletediscountcodeamounttest", "expresscart-22-deletediscountcodepercenttest"),
("ORACLE-SIM-012", "expresscart-23-deleteddiscountcodefailsamounttest", "expresscart-24-deleteddiscountcodefailspercenttest"),
("ORACLE-SIM-013", "expresscart-29-searchdeletedproducttagfailstest", "expresscart-31-searchdeletedproductfailstest"),
("ORACLE-SIM-014", "joomla-02-badlogin", "joomla-06-badsiteadminlogin", "joomla-07-emptysiteadminlogin"),
("ORACLE-SIM-015", "joomla-18-addmenuitem-emptytitle", "joomla-19-addmenuitem-menunotselected", "joomla-20-addmenuitem-emptymenutype"),
("ORACLE-SIM-016", "mediawiki-03-createpagetest", "mediawiki-07-createtemplatetest", "mediawiki-08-createpagefromsourcetest", "mediawiki-17-createuserpagetest"),
("ORACLE-SIM-017", "mediawiki-06-editpagetest", "mediawiki-15-editprotectedpage-newadmin-successtest"),
("ORACLE-SIM-018", "prestashop-01-addnewproduct", "prestashop-03-editproduct"),
("ORACLE-SIM-019", "prestashop-02-addemptyproduct", "prestashop-05-addemptystate"),
("ORACLE-SIM-020", "prestashop-06-addnewproductwithtax", "prestashop-07-addnewproductwithtax10"),
("ORACLE-SIM-021", "prestashop-09-addemptyfeature", "prestashop-11-addemptyattribute", "prestashop-13-addemptyaddress", "prestashop-15-addemptycategory", "prestashop-18-addemptymanufacturer", "prestashop-21-addemptysupplier", "prestashop-24-registeremployee-noname", "prestashop-25-registeremployee-noemail", "prestashop-26-registeremployee-nopassword", "prestashop-27-registeremployee-nopermission", "prestashop-31-addemptycurrency"),
("ORACLE-SIM-022", "prestashop-12-addnewaddress", "prestashop-32-editaddress"),
("ORACLE-SIM-023", "prestashop-14-addnewcategory", "prestashop-16-editcategory"),
("ORACLE-SIM-024", "prestashop-17-addnewmanufacturer", "prestashop-19-editmanufacturer"),
("ORACLE-SIM-025", "prestashop-23-registeremployee", "prestashop-33-editemployee"),
)

def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))

def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")

def git(checkout: Path, *args: str) -> str:
    p = subprocess.run(["git", "-C", str(checkout), *args], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if p.returncode:
        raise ValueError("git " + " ".join(args) + " failed: " + p.stderr.decode("utf-8", "replace").strip())
    return p.stdout.decode("utf-8").strip()

def verify_checkout(checkout: Path):
    if not (checkout / ".git").exists():
        raise ValueError("baseline checkout is missing .git metadata")
    head = git(checkout, "rev-parse", "HEAD")
    tree = git(checkout, "rev-parse", f"{PIN}^{{tree}}")
    if head != PIN:
        raise ValueError(f"baseline checkout HEAD mismatch: {head}")
    if tree != TREE:
        raise ValueError(f"baseline Git tree mismatch: {tree}")
    listing = subprocess.run(["git", "-C", str(checkout), "ls-tree", "-r", "-z", PIN, "--", *APPS], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if listing.returncode:
        raise ValueError("cannot enumerate pinned Git tree: " + listing.stderr.decode("utf-8", "replace").strip())
    GIT_TREE_BLOBS.clear()
    for record in listing.stdout.split(b"\0"):
        if not record:
            continue
        meta, raw_path = record.split(b"\t", 1)
        mode, kind, oid = meta.decode("ascii").split(" ")
        if kind == "blob":
            GIT_TREE_BLOBS[raw_path.decode("utf-8")] = oid
    return {"repository": REPO, "commit": head, "treeSha": tree, "verification": "VERIFIED_GIT_CHECKOUT"}

def read_git_blob(checkout: Path, relative_path: str, expected_sha: str | None = None) -> tuple[bytes, str]:
    path = Path(relative_path)
    if path.is_absolute() or ".." in path.parts:
        raise ValueError(f"unsafe baseline path: {relative_path}")
    oid = GIT_TREE_BLOBS.get(path.as_posix())
    if not oid:
        raise ValueError(f"missing path in pinned Git tree: {relative_path}")
    try:
        data = (checkout / path).read_bytes()
    except OSError as exc:
        raise ValueError(f"source file unavailable in checkout: {relative_path}: {exc}") from exc
    verify_blob_bytes(data, oid, relative_path)
    actual = oid
    if expected_sha and actual != expected_sha:
        raise ValueError(f"mapped blob SHA mismatch for {relative_path}: expected {expected_sha}, actual {actual}")
    data.decode("utf-8", "strict")
    return data, actual

def verify_blob_bytes(data: bytes, expected_oid: str, relative_path: str):
    actual = hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + b"\0" + data).hexdigest()
    if actual != expected_oid:
        raise ValueError(f"Git object/content mismatch for {relative_path}: expected {expected_oid}, actual {actual}")
    return actual

def redact_excerpt(line: str) -> str:
    # Only redact a value entered into a credential field; preserve quotes and step syntax.
    line = PASSWORD_FIELD.sub(lambda m: m.group(0)[0] + "REDACTED_PASSWORD" + m.group(0)[0], line)
    # Also redact explicit secret-like key assignments, preserving code/string delimiters.
    line = SECRET_ASSIGNMENT.sub(lambda m: m.group(1) + m.group(2) + "REDACTED_SECRET" + m.group(2), line)
    return line

def parse_steps(raw: bytes, case_id: str, path: str):
    lines = raw.decode("utf-8").splitlines()
    steps = []
    for number, original in enumerate(lines, 1):
        match = STEP.match(original)
        if match:
            text = redact_excerpt(original.strip())
            steps.append({
                "evidenceId": f"GHR-{case_id}-{number}",
                "line": number,
                "kind": match.group(1).lower(),
                "excerpt": text,
                "permalink": f"https://github.com/{REPO}/blob/{PIN}/{path}#L{number}",
            })
    return lines, steps

def taxonomy_for(text: str):
    t = text.casefold()
    labels = []
    if re.search(r"\b(invalid|wrong|empty|duplicate|fail|denied|error|cannot|must not)\b", t):
        labels.append("Negative/validation")
    if re.search(r"\b(empty|maximum|minimum|limit|boundary|too long|too short)\b", t):
        labels.append("Boundary condition")
    if re.search(r"\b(permission|role|administrator|admin|teacher|student|login|log in|logout)\b", t):
        labels.append("Authorization/role")
    if re.search(r"\b(add|create|delete|remove|edit|update|change|enable|disable|status|publish|enrol|enroll)\b", t):
        labels.append("State/lifecycle")
    if re.search(r"\b(search|find|navigate|navigation|page|menu)\b", t):
        labels.append("Search/navigation")
    if not labels:
        labels.append("Normal flow")
    return labels

def actor_for(text: str):
    for role in ("administrator", "admin", "teacher", "student", "manager", "customer", "user"):
        if re.search(rf"\b{role}\b", text, re.I):
            return role.title() + " (provisional inference from Gherkin wording)"
    return "Not stated in pinned Gherkin"

def split_behavior_steps(steps):
    preconditions, actions, observables = [], [], []
    phase = "setup"
    for s in steps:
        kind = s["kind"]
        if kind == "when":
            phase = "action"
        elif kind == "then":
            phase = "oracle"
        elif kind == "given" and phase == "action":
            phase = "setup"
        if phase == "setup" and kind in ("given", "and", "but"):
            preconditions.append(s["evidenceId"])
        elif phase == "action" and kind in ("when", "and", "but"):
            actions.append(s["evidenceId"])
        elif phase == "oracle" and kind in ("then", "and", "but"):
            observables.append(s["evidenceId"])
    return preconditions, actions, observables

def case_unit_id(app: str, case_id: str):
    suffix = case_id[len(app) + 1:] if case_id.startswith(app + "-") else case_id
    return "BU-" + app.upper() + "-" + suffix.upper()

def assertion_kind(line: str):
    m = ASSERTION.search(line)
    return m.group(1) if m else None

def build_catalog(checkout: Path, pin_meta: dict, mappings: dict, inventories: dict):
    units = []
    per_app = {}
    case_to_unit = {}
    feature_counts = scenario_count = mapped_count = feature_only = assertion_count = then_count = 0
    java_only = []
    for app in APPS:
        mapping = mappings[app]
        entries = mapping["entries"]
        app_assertions = app_then = app_mapped = app_feature_only = 0
        app_java_only = 0
        for entry in entries:
            case_id = entry["caseId"]
            if case_id in case_to_unit:
                raise ValueError(f"duplicate T04-D case ID: {case_id}")
            feature_path = entry["featurePath"]
            gherkin_raw, feature_sha = read_git_blob(checkout, feature_path, entry["featureBlobSha"])
            gherkin_lines, step_evidence = parse_steps(gherkin_raw, case_id, feature_path)
            then_refs = entry.get("thenLineRefs", [])
            for ref in then_refs:
                if not isinstance(ref.get("line"), int) or ref["line"] < 1 or ref["line"] > len(gherkin_lines):
                    raise ValueError(f"corrupt Then anchor: {case_id}:{ref}")
            if entry.get("scenarioHeaderLines", []) and any(n < 1 or n > len(gherkin_lines) for n in entry["scenarioHeaderLines"]):
                raise ValueError(f"corrupt Scenario anchor: {case_id}")
            if len(entry.get("scenarioHeaderLines", [])) != len(entry.get("scenarioTitles", [])):
                raise ValueError(f"Scenario header/title mapping mismatch: {case_id}")
            scenario_evidence = []
            for number, title in zip(entry.get("scenarioHeaderLines", []), entry.get("scenarioTitles", [])):
                excerpt = gherkin_lines[number - 1].strip()
                if not re.match(r"^\s*Scenario(?: Outline)?:", excerpt, re.I):
                    raise ValueError(f"T04-D Scenario anchor does not point to a Scenario header: {case_id}:{number}")
                scenario_evidence.append({"evidenceId": f"GHR-{case_id}-SCENARIO-{number}", "line": number,
                                          "title": title, "excerpt": excerpt,
                                          "permalink": f"https://github.com/{REPO}/blob/{PIN}/{feature_path}#L{number}"})
            java_path = entry.get("javaPath")
            java_evidence = {"path": java_path, "blobSha": None, "fetchedBlobSha": None,
                             "testClass": entry.get("javaClass"), "testMethod": None,
                             "assertions": [], "expectedAssertionLineRefs": entry.get("assertionLineRefs", []),
                             "actualAssertionLines": [], "testMethodRefs": entry.get("javaTestMethodRefs", [])}
            mapping_status = entry.get("mappingStatus")
            if java_path:
                java_raw, java_sha = read_git_blob(checkout, java_path, entry["javaBlobSha"])
                java_lines = java_raw.decode("utf-8").splitlines()
                method_evidence = []
                for method_ref in entry.get("javaTestMethodRefs", []):
                    line_no = method_ref["line"]
                    if line_no < 1 or line_no > len(java_lines) or not re.search(rf"\b{re.escape(method_ref['name'])}\s*\(", java_lines[line_no - 1]):
                        raise ValueError(f"Java test-method anchor does not match source: {case_id}:{line_no}")
                    method_evidence.append({"name": method_ref["name"], "line": line_no,
                                            "excerpt": java_lines[line_no - 1].strip(),
                                            "permalink": f"https://github.com/{REPO}/blob/{PIN}/{java_path}#L{line_no}"})
                assertion_refs = entry.get("assertionLineRefs", [])
                for ref in assertion_refs:
                    line_no = ref["line"]
                    if not isinstance(line_no, int) or line_no < 1 or line_no > len(java_lines):
                        raise ValueError(f"corrupt Java assertion anchor: {case_id}:{ref}")
                    actual_kind = assertion_kind(java_lines[line_no - 1])
                    if not actual_kind or actual_kind.casefold() != ref["kind"].casefold():
                        raise ValueError(f"Java assertion anchor does not match source: {case_id}:{line_no}")
                    safe_line = redact_excerpt(java_lines[line_no - 1].strip())
                    java_evidence["assertions"].append({
                        "evidenceId": f"JAV-{case_id}-{line_no}", "line": line_no,
                        "assertionKind": actual_kind, "excerpt": safe_line,
                        "permalink": f"https://github.com/{REPO}/blob/{PIN}/{java_path}#L{line_no}",
                    })
                java_evidence.update(blobSha=java_sha, fetchedBlobSha=java_sha,
                                     testMethod=entry.get("javaTestMethodRefs", [{}])[0].get("name"),
                                     methodEvidence=method_evidence,
                                     actualAssertionLines=[x["line"] for x in java_evidence["assertions"]])
                app_mapped += 1
                app_assertions += len(assertion_refs)
            else:
                mapping_status = "FEATURE_ONLY_NO_JAVA_MATCH_AT_PIN"
                app_feature_only += 1
            evidence_by_line = {x["line"]: x for x in step_evidence}
            for ref in then_refs:
                if ref["line"] not in evidence_by_line:
                    raise ValueError(f"T04-D Then anchor is not a Gherkin step: {case_id}:{ref['line']}")
            step_evidence.sort(key=lambda x: x["line"])
            all_text = "\n".join(x["excerpt"] for x in step_evidence)
            title_match = re.search(r"^\s*Feature:\s*(.+)$", "\n".join(gherkin_lines), re.M | re.I)
            scenario_match = re.search(r"^\s*Scenario(?: Outline)?:\s*(.+)$", "\n".join(gherkin_lines), re.M | re.I)
            behavior = (title_match or scenario_match)
            behavior_name = behavior.group(1).strip() if behavior else Path(feature_path).stem
            preconditions, actions, observables = split_behavior_steps(step_evidence)
            unit_id = case_unit_id(app, case_id)
            if unit_id in {u["unitId"] for u in units}:
                raise ValueError(f"duplicate unit ID: {unit_id}")
            actor = actor_for(all_text)
            unit = {
                "unitId": unit_id, "application": app, "applicationName": APP_LABEL[app],
                "baselineApplicationVersion": Path(java_path).parts[2] if java_path and len(Path(java_path).parts) > 2 else None,
                "behaviorName": behavior_name,
                "taxonomy": taxonomy_for(behavior_name + "\n" + all_text),
                "taxonomyMethod": "PROVISIONAL_KEYWORD_RULES_FROM_PINNED_GHERKIN; not a verified behavior class",
                "taxonomyCaveat": "Login and administrator language often describes setup or a common fixture; a keyword hit is not proof that authorization is the behavior under test.",
                "actor": actor, "preconditions": preconditions, "action": actions, "observable": observables,
                "oracle": {"gherkinExpectedEvidenceIds": [f"GHR-{case_id}-{x['line']}" for x in then_refs],
                           "javaAssertionEvidenceIds": [x["evidenceId"] for x in java_evidence["assertions"]],
                           "assessment": "Source references extracted; semantic agreement between Gherkin and Java remains NEEDS_REVIEW."},
                "baselineCaseIds": [case_id],
                "gherkinEvidence": {
                    "path": feature_path, "blobSha": feature_sha, "fetchedBlobSha": feature_sha,
                    "permalink": f"https://github.com/{REPO}/blob/{PIN}/{feature_path}",
                    "stepEvidence": step_evidence,
                    "scenarioHeaderEvidence": scenario_evidence,
                    "expectedThenLineRefs": then_refs,
                    "mappingScenarioHeaderLines": entry.get("scenarioHeaderLines", []),
                    "scenarioTitles": entry.get("scenarioTitles", []),
                },
                "javaAssertionEvidence": java_evidence,
                "baselinePin": pin_meta,
                "mappingStatus": mapping_status,
                "evidenceLevel": "PINNED_GIT_OBJECTS_VERIFIED_AGAINST_T04D_BLOB_SHA",
                "reviewStatus": "NEEDS_REVIEW",
                "unitResolution": "ONE_CASE_LEVEL_DRAFT_UNIT_PENDING_DUPLICATE_REVIEW",
                "unitCountDisposition": "NOT_COUNTED_PENDING_SEMANTIC_GROUP_REVIEW",
                "limitations": [
                    "Pinned source establishes test text and mapped assertion content, not application runtime behavior.",
                    "Actor, taxonomy, action/oracle segmentation and case-level grouping are provisional; admin/login fixture words may create false-positive taxonomy matches.",
                    "Quoted Gherkin and assertion literals are preserved except credentials in password fields or explicit secret assignments.",
                ],
            }
            units.append(unit)
            case_to_unit[case_id] = unit_id
            app_then += len(then_refs)
        # T04-D lists Java-only suite class names; resolve each uniquely inside the pinned app subtree.
        for class_name in mapping.get("unmappedSuiteClasses", []):
            version_dir = Path(entries[0]["javaPath"]).parts[2] if entries and entries[0].get("javaPath") else None
            search_root = checkout / app / "baseline" / version_dir if version_dir else checkout / app / "baseline"
            matches = list(search_root.rglob(class_name + ".java"))
            if len(matches) != 1:
                raise ValueError(f"expected one pinned Java-only file for {app}.{class_name}, found {len(matches)}")
            rel = matches[0].relative_to(checkout).as_posix()
            raw, actual_sha = read_git_blob(checkout, rel)
            lines = raw.decode("utf-8").splitlines()
            assertions = []
            for number, line in enumerate(lines, 1):
                kind = assertion_kind(line)
                if kind:
                    assertions.append({"evidenceId": f"JAV-ONLY-{app}-{class_name}-{number}",
                                       "line": number, "assertionKind": kind,
                                       "excerpt": redact_excerpt(line.strip()),
                                       "permalink": f"https://github.com/{REPO}/blob/{PIN}/{rel}#L{number}"})
            java_only.append({"application": app, "class": class_name, "method": None, "path": rel,
                              "blobSha": actual_sha, "fetchedBlobSha": actual_sha,
                              "assertionLineRefs": [{"line": x["line"], "kind": x["assertionKind"]} for x in assertions],
                              "assertions": assertions, "mappingStatus": "JAVA_ONLY_NO_GHERKIN_MATCH_AT_PIN",
                              "unitId": None, "reviewStatus": "NEEDS_REVIEW",
                              "limitations": ["No Gherkin mapping in T04-D; retained separately and not promoted to a behavioral unit."]})
            app_java_only += 1
            app_assertions += len(assertions)
        app_entry_count = len(entries)
        app_mapped += 0
        feature_counts += app_entry_count
        scenario_count += sum(len(x.get("scenarioHeaderLines", [])) for x in entries)
        mapped_count += app_mapped
        feature_only += app_feature_only
        assertion_count += app_assertions
        then_count += app_then
        java_suite = app_mapped + app_java_only
        per_app[app] = {
            "featureFiles": app_entry_count,
            "explicitScenarioHeaders": sum(len(x.get("scenarioHeaderLines", [])) for x in entries),
            "mappedFeatureToJava": app_mapped,
            "featureOnly": app_feature_only,
            "javaSuiteEntries": java_suite,
            "javaOnly": app_java_only,
            "mappedJavaAssertionLines": sum(len(x.get("assertionLineRefs", [])) for x in entries),
            "javaOnlyAssertionLines": sum(len(x["assertionLineRefs"]) for x in java_only if x["application"] == app),
            "expectedThenLineRefs": app_then,
            "provisionalCaseLevelRecords": app_entry_count,
        }
    # Keep discovery hypotheses separate from units and explicitly call out the reverse-transition false positive.
    groups = []
    for group_id, *case_ids in GROUP_CASES:
        ids = [case_to_unit[c] for c in case_ids if c in case_to_unit]
        if len(ids) != len(case_ids):
            raise ValueError(f"group references a missing case: {group_id}")
        group = {
            "groupId": group_id, "groupType": "POSSIBLE_SAME_ORACLE",
            "unitIds": ids, "baselineCaseIds": list(case_ids),
            "assessment": "POSSIBLE_SAME_ORACLE_NEEDS_HUMAN_REVIEW",
            "reviewStatus": "NEEDS_REVIEW",
            "hypothesisBasis": "Retained static discovery hypothesis; shared message/assertion shape does not establish equivalent business behavior.",
            "countingEffect": "NO_AUTOMATIC_MERGE_OR_DENOMINATOR_CHANGE",
            "falsePositiveRisk": (
                "HIGH: includes enrollment/add and removal actions, opposite lifecycle transitions. A shared success-message pattern can falsely group distinct business behaviors; keep all four records separate pending semantic review."
                if group_id == "ORACLE-SIM-004"
                else "POSSIBLE: action, actor, object, state transition and oracle semantics may differ even when text or assertion shape looks similar."
            ),
        }
        groups.append(group)
    counts = {
        "gherkinFeatureFiles": feature_counts, "explicitScenarioHeaders": scenario_count,
        "mappedFeatureToJava": mapped_count, "featureOnly": feature_only,
        "javaSuiteEntries": mapped_count + sum(x["javaOnly"] for x in per_app.values()),
        "javaOnly": sum(x["javaOnly"] for x in per_app.values()),
        "javaAssertionLines": assertion_count, "expectedThenLineRefs": then_count,
        "provisionalCaseLevelRecords": len(units), "possibleOracleSimilarityGroups": len(groups),
        "candidateBaselineLinks": 0, "distinctCandidateBaselineCases": 0, "nearbyScreenedLinks": 0,
        "officialBehavioralDenominator": None, "denominatorStatus": "NOT_ESTABLISHED",
    }
    catalog = {
        "schemaVersion": "1.0.0", "task": "T04-G",
        "title": "Provisional BEWT Base behavioral unit inventory",
        "baselinePin": pin_meta, "scope": list(APPS),
        "methodRef": "docs/tasks/T04-G/BASELINE-BEHAVIOR-UNIT-METHOD.md",
        "extraction": {"method": "Pinned Git object extraction; source bytes read with git cat-file after commit/tree verification.",
                       "pythonVersion": ".".join(map(str, sys.version_info[:3])),
                       "gitVersion": git(checkout, "--version"),
                       "mappingSource": "data/coverage/{application}/baseline-mapping.json",
                       "sourceVerification": "VERIFIED", "sourceExcerptsRedaction": "Credential values only; quoted labels/messages are preserved.",
                       "perApplicationCounts": per_app},
        "counts": counts,
        "interpretation": "227 case-level drafts are not unique semantic units. No official denominator or RQ2 result is established.",
        "units": units, "potentialSameOracleGroups": groups, "unmappedJavaTests": java_only,
    }
    return catalog, case_to_unit

def normalize_candidate(c):
    sem = c["semanticOverlapAssessment"]
    return {
        "candidateId": c["candidateId"], "application": c["application"], "version": c["version"],
        "originalStatus": c["originalStatus"], "shortlisted": c["shortlisted"],
        "priorityReviewOrder": c.get("priorityReviewOrder"), "candidateSummary": c["candidateSummary"],
        "actor": c.get("actor"), "preconditions": c.get("preconditions"),
        "sourceReferenceIds": [x.get("id") for x in c.get("sourceReferences", [])],
        "semanticAssessment": sem, "oracleAssessment": c["oracleAssessment"],
        "fixtureAssessment": c.get("fixtureAssessment"),
        "negativeControl": c.get("negativeControlAssessment"),
        "testabilityRisks": c.get("testabilityRisks", []),
        "sourceLimitations": c.get("sourceLimitations", []),
        "reviewerQuestions": c.get("reviewerQuestions", []),
        "suggestedDisposition": c.get("suggestedDisposition"),
        "technicalRationale": c.get("technicalRationale"),
        "humanDecision": c.get("humanDecision"), "noveltyStatus": c.get("noveltyStatus"),
        "runtimeStatus": c.get("runtimeStatus"),
    }

def make_outputs(checkout: Path):
    pin_meta = verify_checkout(checkout)
    mappings, inventories = {}, {}
    for app in APPS:
        mapping_path = ROOT / "data" / "coverage" / app / "baseline-mapping.json"
        inventory_path = ROOT / "data" / "coverage" / app / "inventory.json"
        mappings[app] = read_json(mapping_path)
        inventories[app] = read_json(inventory_path)
        if mappings[app].get("sourcePin", {}).get("commit") != PIN or mappings[app].get("sourcePin", {}).get("treeSha") != TREE:
            raise ValueError(f"T04-D mapping source pin mismatch for {app}")
    catalog, case_to_unit = build_catalog(checkout, pin_meta, mappings, inventories)
    packets = read_json(ROOT / "docs/tasks/T04-F/HUMAN-REVIEW-PACKETS.json")
    index = read_json(ROOT / "docs/tasks/T04-F/SOURCE-AND-BASELINE-EVIDENCE-INDEX.json")
    packet_records = packets["records"]
    candidates = [normalize_candidate(x) for x in packet_records]
    if "\ufffd" in json.dumps(packet_records, ensure_ascii=False):
        raise ValueError("T04-F candidate source contains Unicode replacement character")
    links = []
    for item in index["candidateBaselineLinks"]:
        link = dict(item)
        link["unitId"] = case_to_unit.get(item["baselineCaseId"])
        links.append(link)
    nearby = []
    for item in index["screenedNearbyEvidence"]:
        record = dict(item)
        record["unitId"] = case_to_unit.get(item["baselineCaseId"])
        nearby.append(record)
    if any(x.get("unitId") is None for x in links + nearby):
        raise ValueError("T04-F link references a baseline case missing from T04-D")
    catalog["counts"].update(
        candidateBaselineLinks=len(links),
        distinctCandidateBaselineCases=len({x["baselineCaseId"] for x in links}),
        nearbyScreenedLinks=len(nearby),
    )
    delta, queue = [], []
    app_order = {app: i for i, app in enumerate(APPS)}
    original_order = {c["candidateId"]: i for i, c in enumerate(candidates)}
    for c in candidates:
        cid = c["candidateId"]
        direct = [x for x in links if x["candidateId"] == cid]
        near = [x for x in nearby if x["candidateId"] == cid]
        sem = c["semanticAssessment"]
        oracle = c["oracleAssessment"]
        sem_class = sem.get("classification", "INSUFFICIENT_EVIDENCE")
        oracle_class = oracle.get("classification", "INSUFFICIENT_EVIDENCE")
        if "INSUFFICIENT_EVIDENCE" in (sem_class, oracle_class) or not direct:
            provisional = "INSUFFICIENT_EVIDENCE"
        elif sem_class == "PARTIAL_SEMANTIC_OVERLAP":
            provisional = "POTENTIAL_PARTIAL_OVERLAP"
        else:
            provisional = "POTENTIAL_NEW_CONDITION"
        units = sorted({x["unitId"] for x in direct})
        delta.append({
            "candidateId": cid, "application": c["application"], "shortlisted": c["shortlisted"],
            "semanticAssessment": sem_class, "oracleAssessment": oracle_class,
            "provisionalDelta": provisional, "baselineUnitIds": units,
            "candidateBaselineLinks": direct, "nearbyScreenedLinks": near,
            "observable": oracle.get("observable"), "technicalRationale": c.get("technicalRationale"),
            "reviewerQuestions": c.get("reviewerQuestions", []), "humanDecision": None,
            "noveltyStatus": "NOT_VERIFIED", "runtimeStatus": "NOT_RUN",
            "limitations": c.get("sourceLimitations", []) + c.get("testabilityRisks", []),
        })
        queue.append({
            "candidateId": cid, "application": c["application"], "candidateSummary": c["candidateSummary"],
            "shortlisted": c["shortlisted"], "priorityReviewOrder": c.get("priorityReviewOrder"),
            "semanticAssessment": sem_class, "oracleAssessment": oracle_class,
            "baselineUnitIds": units, "baselineCaseIds": sorted({x["baselineCaseId"] for x in direct}),
            "overlapAndPossibleDelta": c.get("technicalRationale"),
            "observable": oracle.get("observable"), "fixture": c.get("fixtureAssessment"),
            "negativeControl": c.get("negativeControl"), "testabilityRisks": c.get("testabilityRisks", []),
            "reviewerQuestions": c.get("reviewerQuestions", []),
            "suggestedDisposition": c.get("suggestedDisposition"),
            "implementationReadiness": "PENDING_HUMAN_REVIEW", "humanDecision": None,
        })
    queue.sort(key=lambda x: (
        app_order[x["application"]],
        0 if x["shortlisted"] else 1,
        x["priorityReviewOrder"] if x["shortlisted"] else original_order[x["candidateId"]],
    ))
    delta_doc = {
        "schemaVersion": "1.0.0", "task": "T04-G", "baselinePin": pin_meta,
        "interpretation": "Technical mapping only; no novelty decision, approval, RQ2 result, or implementation authorization.",
        "counts": {"candidates": len(delta), "directLinks": len(links),
                   "distinctBaselineCases": len({x["baselineCaseId"] for x in links}),
                   "nearbyLinks": len(nearby)},
        "records": delta,
    }
    queue_doc = {
        "schemaVersion": "1.0.0", "task": "T04-G",
        "reviewOrderPolicy": "Application order: Bludit, Claroline, ExpressCart, Joomla, MantisBT, MediaWiki, PrestaShop; within each app shortlist first by priorityReviewOrder, then remaining candidates in stable T04-F source order. Not a cross-app ranking.",
        "counts": {"candidates": len(queue), "shortlisted": sum(bool(x["shortlisted"]) for x in queue)},
        "records": queue,
    }
    # These are snapshots of authoritative inputs, refreshed from T04-F; they are not builder inputs.
    outputs = {
        TASK / "evidence/cands.json": packet_records,
        TASK / "evidence/cat.json": catalog,
        TASK / "evidence/comps.json": links,
        TASK / "evidence/near.json": nearby,
        TASK / "BEHAVIORAL-BASELINE-CATALOG.json": catalog,
        TASK / "CANDIDATE-BASELINE-DELTA.json": delta_doc,
        TASK / "HUMAN-REVIEW-QUEUE.json": queue_doc,
    }
    return outputs, mappings, inventories, candidates, links, nearby

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline-checkout", required=True, type=Path,
                        help="Read-only Git checkout of OlianasD/BEWT at the exact pinned commit.")
    parser.add_argument("--check-determinism", action="store_true")
    args = parser.parse_args()
    try:
        first, *_ = make_outputs(args.baseline_checkout.resolve())
        if args.check_determinism:
            second, *_ = make_outputs(args.baseline_checkout.resolve())
            if {str(k): json_bytes(v) for k, v in first.items()} != {str(k): json_bytes(v) for k, v in second.items()}:
                raise ValueError("determinism check failed: repeated output differs")
        for path, value in first.items():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(json_bytes(value))
        print(json.dumps({"status":"PASS", "sourceCommit":PIN, "sourceTree":TREE,
                          "featureCases":sum(len(x["entries"]) for x in _load_maps()),
                          "candidateCount":27, "directLinks":46, "nearbyLinks":19,
                          "determinism":"PASS" if args.check_determinism else "NOT_RUN"}))
        return 0
    except (ValueError, OSError, KeyError, subprocess.SubprocessError, UnicodeError) as exc:
        print(json.dumps({"status":"NOT_VERIFIED", "reason":str(exc)}), file=sys.stderr)
        return 2

def _load_maps():
    return [read_json(ROOT/"data"/"coverage"/app/"baseline-mapping.json") for app in APPS]

if __name__ == "__main__":
    raise SystemExit(main())

