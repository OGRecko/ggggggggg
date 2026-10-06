from pathlib import Path

# ---------- C) javaAuthoredLessons.ts pattern repair ----------
p = Path('/home/user/ggggggggg/src/courses/javaAuthoredLessons.ts')
s = p.read_text()
old = r'''requiredPatterns: ["codeforge\\\\.jar", "System\\\\.out\\\\.println", "build|dependenc|packag|test"]'''
new = r'''requiredPatterns: ["codeforge\\\\.jar", "System\\\\.out\\\\.println"]'''
assert old in s, "java authored pattern not found"
s = s.replace(old, new, 1)
p.write_text(s)
print("java authored comment-pattern removed")

# ---------- D) cppAuthoredLessons.ts pattern repair ----------
p = Path('/home/user/ggggggggg/src/courses/cppAuthoredLessons.ts')
s = p.read_text()
old = r'''requiredPatterns: ["codeforge_app", "std::cout", "link"]'''
new = r'''requiredPatterns: ["codeforge_app", "std::cout"]'''
assert old in s, "cpp authored pattern not found"
s = s.replace(old, new, 1)
p.write_text(s)
print("cpp authored comment-pattern removed")

# ---------- E/F/G) remove ungradeable comment alternatives from project patterns ----------
def strip_comment_patterns(path):
    p = Path(path)
    s = p.read_text()
    before = s
    s = s.replace(r''', "//|/\\*"''', '')
    s = s.replace(r''', "//|/\\*|subgrid"''', '')
    s = s.replace(r'''["//|/\\*|subgrid"]''', '["subgrid"]')
    assert s != before, f"no comment patterns removed in {path}"
    p.write_text(s)
    print(f"{path}: comment-only pattern entries removed")

for target in ['java', 'javascript', 'cpp', 'htmlcss']:
    strip_comment_patterns(f'/home/user/ggggggggg/src/courses/{target}.ts')
