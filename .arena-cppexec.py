#!/usr/bin/env python3
"""Compiles every dumped C++ string with the system g++ and compares what it prints with what the
lesson claims. Usage: npx vite-node .arena-cppexec.ts && python3 .arena-cppexec.py

Each program is compiled in its own temporary directory with `g++ -std=c++20 -pthread -O0` (the
standard the course itself names in its project solutions and gap lessons; GCC 12 is the toolchain
available here), then executed with stdin closed and its two output streams merged into one, because
that is what a person reading a console sees: `std::cerr` is unbuffered and `std::cout` is flushed at
exit, so a merged capture reproduces the transcript a lesson may quote.

The rows are judged by what they are:

  complete programs (`int main` present)
    ordinary samples   must compile, run, and print exactly the declared output
    deliberately broken samples (title says "broken")
                       must fail to compile or run; a broken sample that matches would be the
                       surprise, because the lesson tells the learner to hunt for a defect that is
                       not there
  structural fragments (no `int main`)
    C++ fragments      syntax-checked with -fsyntax-only; their declared result is a description of
                       the shape ("A CMake target sketch"), not a console transcript, so nothing is
                       compared. A fragment that names several files with `// name.cpp` markers is
                       written out as those files and each translation unit is syntax-checked with
                       its own include directory, so a header/source pair is checked as the pair it
                       claims to be
    other languages    reported and not compiled (a CMake snippet is not C++)
  starters             syntax-checked as fragments and classified: a plain scaffold parses, a debug
                       lesson's deliberate break does not, and a fill-in scaffold whose call sites
                       wait for the learner's definitions is listed for review rather than counted
                       as a pass or a failure
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

BROKEN = re.compile(r"broken|deliberate", re.I)
FILE_MARKER = re.compile(r"^\s*//\s*([\w.-]+\.(?:hpp|h|cpp|cc|cxx))\s*$", re.M)
PROGRAM = re.compile(r"\bint\s+main\s*\(")
CPP_LIKE = re.compile(r"#\s*include|std::|struct\s+\w|class\s+\w|template\s*<|namespace\s")
TIMEOUT_RUN = 10
TIMEOUT_COMPILE = 60

rows = json.load(open("/tmp/cpp_exec.json"))
stats = {
    "matched": 0,
    "mismatch": 0,
    "unexpected-failure": 0,
    "broken-as-designed": 0,
    "surprising-pass": 0,
    "fragment-ok": 0,
    "multi-file-ok": 0,
    "not-cpp": 0,
    "fragment-anomaly": 0,
    "starter-parses": 0,
    "starter-deliberate-break": 0,
    "starter-needs-learner": 0,
}
anomalies = []
for_review = []


def compile_source(code, mode):
    """Returns (ok, detail). mode is "program" (full compile) or "syntax" (-fsyntax-only)."""
    workdir = tempfile.mkdtemp(prefix="cppexec")
    try:
        source = os.path.join(workdir, "main.cpp")
        with open(source, "w", encoding="utf-8") as handle:
            handle.write(code)
        command = ["g++", "-std=c++20", "-pthread", "-O0"] + (["-fsyntax-only", source] if mode == "syntax" else ["-o", os.path.join(workdir, "prog"), source])
        result = subprocess.run(command, capture_output=True, text=True, cwd=workdir, timeout=TIMEOUT_COMPILE)
        if result.returncode != 0:
            messages = [line.strip() for line in result.stderr.splitlines() if " error:" in line or "error:" in line]
            detail = messages[0] if messages else " | ".join(line.strip() for line in result.stderr.strip().splitlines()[:2])
            return False, detail
        return True, ""
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


def run_binary(code):
    """Compile and run for real. Returns ("ran", "", stdout) or ("compile-error"|"run-error", detail, "")."""
    workdir = tempfile.mkdtemp(prefix="cppexec")
    try:
        source = os.path.join(workdir, "main.cpp")
        binary = os.path.join(workdir, "prog")
        with open(source, "w", encoding="utf-8") as handle:
            handle.write(code)
        compiled = subprocess.run(
            ["g++", "-std=c++20", "-pthread", "-O0", "-o", binary, source],
            capture_output=True,
            text=True,
            cwd=workdir,
            timeout=TIMEOUT_COMPILE,
        )
        if compiled.returncode != 0:
            messages = [line.strip() for line in compiled.stderr.splitlines() if "error:" in line]
            return "compile-error", messages[0] if messages else "no compiler message", ""
        try:
            executed = subprocess.run(
                [binary], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=workdir, stdin=subprocess.DEVNULL, timeout=TIMEOUT_RUN
            )
        except subprocess.TimeoutExpired:
            return "run-error", f"still running after {TIMEOUT_RUN}s", ""
        if executed.returncode != 0:
            return "run-error", f"exit {executed.returncode}", executed.stdout
        return "ran", "", executed.stdout
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


def syntax_check_multi_file(code, markers):
    """Writes a `// file.cpp`-marked sample out as real files and syntax-checks every unit."""
    workdir = tempfile.mkdtemp(prefix="cppmulti")
    try:
        sources = []
        for index, marker in enumerate(markers):
            name = marker.group(1)
            start = marker.end()
            end = markers[index + 1].start() if index + 1 < len(markers) else len(code)
            path = os.path.join(workdir, name)
            with open(path, "w", encoding="utf-8") as handle:
                handle.write(code[start:end].strip() + "\n")
            if re.search(r"\.cpp$|\.cc$|\.cxx$", name):
                sources.append(name)
        if not sources:
            return False, "the sample names no translation unit to check"
        for name in sources:
            result = subprocess.run(
                ["g++", "-std=c++20", "-pthread", "-fsyntax-only", "-I", workdir, name],
                capture_output=True,
                text=True,
                cwd=workdir,
                timeout=TIMEOUT_COMPILE,
            )
            if result.returncode != 0:
                messages = [line.strip() for line in result.stderr.splitlines() if "error:" in line]
                return False, f"{name}: " + (messages[0] if messages else "compiler reported an error")
        return True, ""
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


for row in rows:
    where = row["where"]
    kind = row["kind"]
    code = row["code"]
    expected = (row.get("expected") or "").strip()
    broken = bool(BROKEN.search(where))
    is_program = bool(PROGRAM.search(code))

    if kind == "starter":
        ok, detail = compile_source(code, "syntax")
        if ok:
            stats["starter-parses"] += 1
        elif row.get("lessonHasBrokenExample"):
            stats["starter-deliberate-break"] += 1
        else:
            stats["starter-needs-learner"] += 1
            for_review.append(f"{where} ({row.get('lessonKind')}): {detail[:120]}")
        continue

    if is_program:
        status, detail, stdout = run_binary(code)
        if broken:
            if status == "ran" and stdout.strip() == expected:
                stats["surprising-pass"] += 1
                anomalies.append(f"BROKEN SAMPLE MATCHES  {where}: compiles and prints {expected!r}")
            else:
                stats["broken-as-designed"] += 1
            continue
        if status != "ran":
            stats["unexpected-failure"] += 1
            anomalies.append(f"FAILED   {where}: {status} — {detail}")
            continue
        if stdout.strip() == expected:
            stats["matched"] += 1
        else:
            stats["mismatch"] += 1
            anomalies.append(f"MISMATCH {where}\n           got:      {stdout.strip()[:200]!r}\n           declared: {expected[:200]!r}")
        continue

    if not CPP_LIKE.search(code):
        stats["not-cpp"] += 1
        continue

    markers = list(FILE_MARKER.finditer(code))
    if markers and re.search(r"\.cpp\b|\.cc\b|\.cxx\b", code):
        ok, detail = syntax_check_multi_file(code, markers)
        if ok:
            stats["multi-file-ok"] += 1
        else:
            stats["fragment-anomaly"] += 1
            anomalies.append(f"MULTI-FILE FAILED {where}: {detail[:160]}")
        continue

    ok, detail = compile_source(code, "syntax")
    if ok:
        stats["fragment-ok"] += 1
    else:
        stats["fragment-anomaly"] += 1
        anomalies.append(f"FRAGMENT FAILED {where}: {detail[:160]}")

print(f"{len(rows)} C++ strings checked with g++ (GCC 12, -std=c++20)")
print(
    " | ".join(
        [
            f"{stats['matched']} programs matched",
            f"{stats['mismatch']} mismatched",
            f"{stats['unexpected-failure']} unexpected failures",
            f"{stats['broken-as-designed']} broken samples failed as designed",
            f"{stats['surprising-pass']} surprising passes",
        ]
    )
)
print(
    " | ".join(
        [
            f"fragments: {stats['fragment-ok']} syntax-clean",
            f"{stats['multi-file-ok']} header/source pairs checked as files",
            f"{stats['not-cpp']} not C++ (not compiled)",
            f"{stats['fragment-anomaly']} anomalies",
        ]
    )
)
print(
    " | ".join(
        [
            f"starters: {stats['starter-parses']} parse",
            f"{stats['starter-deliberate-break']} are a debug lesson's deliberate break",
            f"{stats['starter-needs-learner']} wait for the learner's definitions",
        ]
    )
)
if for_review:
    print("\nStarters that need the learner's definitions before they can parse (reviewed, expected):")
    for line in for_review:
        print("  " + line)
if anomalies:
    print("\nAnomalies:")
    for line in anomalies:
        print("  " + line)
sys.exit(1 if (stats["mismatch"] or stats["unexpected-failure"] or stats["surprising-pass"] or stats["fragment-anomaly"]) else 0)
