"""Executes the programs dumped by `.arena-pyexec.ts` and compares them with their declared output.

The input shim below is copied from the shipped Pyodide runner in `src/utils/pythonRunner.ts`:
`input(prompt)` prints the prompt with no newline, hands back the next supplied line, and never
echoes it. The line list must be built exactly the way the runner builds it, because that is where a
subtle truth lives: the runner does `String(input || "").split("\n")`, and JavaScript splits the
empty string into one empty element. The Run button supplies no input, so its list is `[""]`, not
`[]`: the first `input()` therefore returns an empty string, and only a second read raises
`EOFError: No more test input available`. An audit that passed `[]` instead would report an EOFError
the product never shows.

Usage:  npx vite-node .arena-pyexec.ts && python3 .arena-pyexec.py
"""
import json
import re
import subprocess
import sys
import tempfile

SHIM = """import builtins
__codeforge_values = {values}
def __codeforge_input(prompt=''):
    print(prompt, end='')
    if not __codeforge_values:
        raise EOFError('No more test input available')
    return __codeforge_values.pop(0)
builtins.input = __codeforge_input
"""

def run_like_the_app(code, lines):
    setup = SHIM.format(values=json.dumps(lines))
    # Each program runs in its own empty directory, the way a fresh sandbox session starts:
    # otherwise a file-writing example would append to the previous run's file and report a
    # difference that only the audit itself caused.
    with tempfile.TemporaryDirectory(prefix="pyexec") as workdir:
        proc = subprocess.run(["python3", "-c", setup + code], capture_output=True, text=True, cwd=workdir)
    out = "\n".join(line.rstrip() for line in proc.stdout.split("\n")).strip()
    error = ""
    if proc.returncode != 0:
        error = proc.stderr.strip().split("\n")[-1][:120] if proc.stderr.strip() else f"exit {proc.returncode}"
    return out, error

def main():
    rows = json.load(open("/tmp/python_exec.json"))
    matched = boundary = mismatch = errored = 0
    problems = []
    for row in rows:
        code = row["code"]
        expected = (row.get("expected") or "").strip()
        reads_input = "input(" in code
        # Exactly the runner's own expression: String(input || "") then split on newline. An absent
        # input is the empty string, and "".split("\n") is [""] -- one empty line, never zero.
        lines = str(row.get("input") or "").split("\n")
        out, error = run_like_the_app(code, lines)
        if expected.startswith("Sandbox:"):
            # A declared sandbox boundary is prose, not a transcript, so it cannot be compared
            # literally. It is still checked: when the program stopped, the text must name the
            # exception the learner actually sees; when it ran to completion, the text must quote
            # what really reached the screen.
            if error:
                kind = re.search(r"([A-Za-z_]*Error)", error)
                if kind and kind.group(1) not in expected:
                    mismatch += 1
                    problems.append((row["where"], row["kind"], f"boundary text does not name {kind.group(1)}: {expected[:70]!r}", out, error))
                    continue
            elif out and out not in expected:
                mismatch += 1
                problems.append((row["where"], row["kind"], "boundary text does not quote the printed output", out, expected))
                continue
            boundary += 1
            continue
        if error:
            errored += 1
            problems.append((row["where"], row["kind"], f"error: {error}", out, expected))
            continue
        if out == expected:
            matched += 1
        else:
            mismatch += 1
            problems.append((row["where"], row["kind"], "declared output differs", out, expected))
    print(f"{len(rows)} programs executed | {matched} matched | {boundary} documented sandbox boundary | {mismatch} mismatched | {errored} errors")
    for where, kind, why, got, expected in problems[:20]:
        print(f"  [{kind}] {where}\n      {why}\n      got:      {got[:110]!r}\n      declared: {expected[:110]!r}")
    return 1 if problems else 0

if __name__ == "__main__":
    sys.exit(main())
