#!/usr/bin/env python3
"""Lint the repo's skill, command, and settings files.

Run from anywhere: python tools/lint_skills.py

Checks:
- Every SKILL.md (.claude/skills/*, .agents/skills/*) has YAML frontmatter that
  parses, with non-empty `name` and `description` keys
- `allowed-tools` entries of the form `Bash(bun run <path> *)` point at files
  that exist (skill paths resolve relative to the repo root and to .agents/)
- Every .claude/commands/*.md starts with a `# /<name>` title
- .claude/settings.json is valid JSON with a permissions.allow list

Exit code 0 on success, 1 with a failure list otherwise.
"""

import json
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    class _FallbackYaml:
        class YAMLError(Exception):
            pass

        @staticmethod
        def safe_load(text: str):
            result: dict = {}
            lines = (text or "").splitlines()
            i = 0
            while i < len(lines):
                raw = lines[i]
                stripped = raw.strip()
                if not stripped or stripped.startswith("#"):
                    i += 1
                    continue
                if raw[0].isspace():
                    raise _FallbackYaml.YAMLError(f"unexpected indentation: {raw!r}")
                if ":" not in raw:
                    raise _FallbackYaml.YAMLError(f"expected key: value line, got {raw!r}")
                key, _, val = raw.partition(":")
                key = key.strip()
                val = val.split("#", 1)[0].strip() if not val.strip().startswith(('"', "'")) else val.strip()
                if val in (">", "|", ">-", "|-"):
                    folded = []
                    i += 1
                    while i < len(lines) and (not lines[i].strip() or lines[i][0].isspace()):
                        if lines[i].strip():
                            folded.append(lines[i].strip())
                        i += 1
                    result[key] = " ".join(folded)
                    continue
                if not val:
                    items = []
                    i += 1
                    while i < len(lines) and (not lines[i].strip() or lines[i][0].isspace()):
                        s = lines[i].strip()
                        if s.startswith("- "):
                            items.append(s[2:].strip().strip('"').strip("'"))
                        elif s and not s.startswith("#"):
                            raise _FallbackYaml.YAMLError(f"invalid block item: {lines[i]!r}")
                        i += 1
                    result[key] = items if items else None
                    continue
                if val.startswith("[") and val.endswith("]"):
                    inner = val[1:-1].strip()
                    result[key] = [x.strip().strip('"').strip("'") for x in inner.split(",") if x.strip()] if inner else []
                elif (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                    result[key] = val[1:-1]
                elif ": " in val:
                    raise _FallbackYaml.YAMLError(f"unquoted colon in scalar value: {raw!r}")
                elif val.lower() == "true":
                    result[key] = True
                elif val.lower() == "false":
                    result[key] = False
                else:
                    result[key] = val
                i += 1
            return result

    yaml = _FallbackYaml()

ROOT = Path(__file__).resolve().parent.parent
errors: list[str] = []


def rel(path: Path) -> str:
    return str(path.relative_to(ROOT))


def check_skill(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        errors.append(f"{rel(path)}: missing YAML frontmatter (file must start with ---)")
        return
    end = text.find("\n---", 4)
    if end == -1:
        errors.append(f"{rel(path)}: unterminated YAML frontmatter")
        return
    try:
        data = yaml.safe_load(text[4:end])
    except yaml.YAMLError as exc:
        errors.append(f"{rel(path)}: frontmatter is not valid YAML: {exc}")
        return
    if not isinstance(data, dict):
        errors.append(f"{rel(path)}: frontmatter did not parse to a mapping")
        return
    for key in ("name", "description"):
        if not data.get(key):
            errors.append(f"{rel(path)}: frontmatter missing required key '{key}'")

    allowed = data.get("allowed-tools", "")
    if isinstance(allowed, str):
        for match in re.finditer(r"bun run ([^\s)]+)", allowed):
            target = match.group(1).rstrip("*")
            if not target or target.endswith("/"):
                continue
            # Targets may contain globs (e.g. .agents/skills/*/cli/src/cli.ts);
            # require at least one existing file to match.
            if "*" in target:
                if not list(ROOT.glob(target)) and not list((ROOT / ".agents").glob(target)):
                    errors.append(f"{rel(path)}: allowed-tools glob matches no files: {target}")
            else:
                candidates = [ROOT / target, ROOT / ".agents" / target]
                if not any(c.is_file() for c in candidates):
                    errors.append(f"{rel(path)}: allowed-tools references a missing file: {target}")


def check_command(path: Path) -> None:
    lines = path.read_text(encoding="utf-8").lstrip().splitlines()
    first = lines[0] if lines else ""
    if not first.startswith("# /"):
        errors.append(f"{rel(path)}: command file must start with a '# /<name>' title (found: {first[:50]!r})")


def check_settings() -> None:
    path = ROOT / ".claude" / "settings.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f".claude/settings.json: {exc}")
        return
    if not isinstance(data, dict):
        errors.append(".claude/settings.json: expected top-level JSON value to be an object")
        return
    permissions = data.get("permissions", {})
    if not isinstance(permissions, dict):
        errors.append(".claude/settings.json: expected permissions to be an object")
        return
    if not isinstance(permissions.get("allow"), list):
        errors.append(".claude/settings.json: expected permissions.allow to be a list")


def main() -> int:
    skills = sorted(ROOT.glob(".claude/skills/*/SKILL.md")) + sorted(ROOT.glob(".agents/skills/*/SKILL.md"))
    commands = sorted((ROOT / ".claude" / "commands").glob("*.md"))
    if not skills:
        errors.append("no SKILL.md files found - glob roots are wrong or the tree moved")
    if not commands:
        errors.append("no command files found under .claude/commands/")

    for skill in skills:
        check_skill(skill)
    for command in commands:
        check_command(command)
    check_settings()

    if errors:
        print(f"lint_skills: {len(errors)} failure(s)")
        for err in errors:
            print(f"  - {err}")
        return 1
    print(f"lint_skills: OK ({len(skills)} skills, {len(commands)} commands, settings.json)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
