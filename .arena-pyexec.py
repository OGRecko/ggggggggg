"""Executes the programs dumped by `.arena-pyexec.ts` and compares them with their declared output.

The input shim below is copied from the shipped Pyodide runner in `src/utils/pythonRunner.ts`:
`input(prompt)` prints the prompt with no newline, hands back the next supplied line, and never
echoes it. A program that reads input with nothing supplied therefore stops with
`EOFError: No more test input available`, which is the behaviour the course documents.

Usage:  npx vite-node .arena-pyexec.ts && python3 .arena-pyexec.py
"""
import json
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
        lines = (row.get("input") or "").split("\n") if reads_input and row.get("input") else []
        out, error = run_like_the_app(code, lines)
        if error and not lines and reads_input:
            # no input available to the Run button: the declared output must say so
            if "EOFError" in expected or "Sandbox" in expected:
                boundary += 1
                continue
            problems.append((row["where"], row["kind"], f"declares an output with no input line: {expected[:80]!r}", out, error))
            mismatch += 1
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
    print(f"{len(rows)} programs executed | {matched} matched | {boundary} documented input boundary | {mismatch} mismatched | {errored} errors")
    for where, kind, why, got, expected in problems[:20]:
        print(f"  [{kind}] {where}\n      {why}\n      got:      {got[:110]!r}\n      declared: {expected[:110]!r}")
    return 1 if problems else 0

if __name__ == "__main__":
    sys.exit(main())
