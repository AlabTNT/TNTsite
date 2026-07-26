#!/usr/bin/env python3
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Optional

from mcp.server.fastmcp import FastMCP

AUTH_TOKEN = os.environ.get("MCP_AUTH_TOKEN", "Bearer YAKP0218sB4rLcegDFX8Ng==")

mcp = FastMCP(
    "tnt-server",
    instructions="AlabTNT remote server management - screen sessions, code push, file operations, service control",
    host="0.0.0.0",
    port=8766,
    mount_path="/mcp",
)

# ── helpers ────────────────────────────────────────────────────────────

def _run(cmd: list[str], timeout: int = 30, check: bool = False) -> dict:
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return {
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
            "returncode": result.returncode,
            "success": result.returncode == 0,
        }
    except subprocess.TimeoutExpired:
        return {"stdout": "", "stderr": "command timed out", "returncode": -1, "success": False}
    except Exception as e:
        return {"stdout": "", "stderr": str(e), "returncode": -1, "success": False}


def _safe_path(p: str, base: str = "/") -> str:
    resolved = os.path.realpath(os.path.join(base, p))
    if not resolved.startswith(os.path.realpath(base) + os.sep) and resolved != os.path.realpath(base):
        raise ValueError(f"path {p} escapes base directory")
    return resolved


# ── screen tools ───────────────────────────────────────────────────────

@mcp.tool()
def screen_list() -> dict:
    """List all screen sessions with their PIDs and names."""
    result = _run(["screen", "-ls"])
    lines = result["stdout"].split("\n") if result["stdout"] else []
    sessions = []
    for line in lines:
        stripped = line.strip()
        if stripped and ("\t" in stripped or "Detached" in stripped or "Attached" in stripped):
            parts = stripped.split("\t")
            if len(parts) >= 2:
                sessions.append({
                    "id": parts[0].split(".")[0].strip(),
                    "name": parts[0].split(".")[-1].strip() if "." in parts[0] else parts[0].strip(),
                    "status": parts[1].strip() if len(parts) > 1 else "unknown",
                })
    return {"sessions": sessions, "raw": result["stdout"]}


@mcp.tool()
def screen_create(name: str, command: Optional[str] = None) -> dict:
    """Create a new detached screen session. If command is provided, runs it in the screen."""
    args = ["screen", "-dmS", name]
    if command:
        args.extend(["bash", "-c", command])
    result = _run(args, check=True)
    if result["success"]:
        pid_result = _run(["screen", "-ls"])
        for line in (pid_result["stdout"] or "").split("\n"):
            if name in line and "\t" in line:
                pid = line.strip().split(".")[0].strip()
                return {"success": True, "name": name, "pid": pid}
        return {"success": True, "name": name, "message": "screen created"}
    return {"success": False, "error": result["stderr"]}


@mcp.tool()
def screen_send(session_name: str, command: str) -> dict:
    """Send a command to a running screen session."""
    result = _run(["screen", "-S", session_name, "-X", "stuff", command + "\n"])
    return {"success": result["success"], "error": result["stderr"] if not result["success"] else None}


@mcp.tool()
def screen_kill(session_name: str) -> dict:
    """Kill a screen session by name or PID."""
    result = _run(["screen", "-S", session_name, "-X", "quit"])
    return {"success": result["success"], "error": result["stderr"] if not result["success"] else None}


@mcp.tool()
def screen_get_window_content(session_name: str, lines: int = 50) -> dict:
    """Get recent terminal output from a screen session (first window)."""
    tmpfile = f"/tmp/screen_dump_{session_name}.txt"
    _run(["screen", "-S", session_name, "-X", "hardcopy", tmpfile])
    try:
        content = Path(tmpfile).read_text(errors="replace")
        content_lines = content.split("\n")
        recent = "\n".join(content_lines[-lines:]) if len(content_lines) > lines else content
        return {"output": recent, "total_lines": len(content_lines)}
    except Exception as e:
        return {"output": "", "error": str(e)}


# ── command / system tools ─────────────────────────────────────────────

@mcp.tool()
def run_command(command: str, cwd: str = "/root", timeout: int = 60) -> dict:
    """Execute a shell command on the server. Use with caution."""
    result = _run(["bash", "-lc", command], timeout=timeout)
    return result


@mcp.tool()
def restart_service(service_name: str) -> dict:
    """Restart a systemd service. Common: alabtnt-web, alabtnt-tools, alabtnt-mcp."""
    result = _run(["systemctl", "restart", service_name])
    status = _run(["systemctl", "is-active", service_name])
    return {"success": result["success"], "active": status["stdout"].strip(), "error": result["stderr"] if not result["success"] else None}


@mcp.tool()
def service_status(service_name: str = "") -> dict:
    """Get status of systemd services. If no name given, shows all alabtnt services."""
    if service_name:
        result = _run(["systemctl", "status", service_name, "--no-pager", "-l"])
        return {"status": result["stdout"][:2000], "service": service_name}
    services = ["alabtnt-web", "alabtnt-tools", "alabtnt-mcp", "nginx"]
    output = {}
    for svc in services:
        r = _run(["systemctl", "is-active", svc])
        output[svc] = r["stdout"].strip() if r["stdout"] else "not found"
    return {"services": output}


@mcp.tool()
def system_info() -> dict:
    """Get server system info: uptime, disk, memory."""
    uptime = _run(["uptime"])
    disk = _run(["df", "-h", "/"])
    memory = _run(["free", "-h"])
    return {
        "uptime": uptime["stdout"],
        "disk": disk["stdout"],
        "memory": memory["stdout"],
    }


# ── git tools ──────────────────────────────────────────────────────────

@mcp.tool()
def git_status(repo_path: str = "/opt/alabtnt-web") -> dict:
    """Show git status of a repository."""
    _safe_path(repo_path, "/opt")
    result = _run(["git", "-C", repo_path, "status", "--short"])
    branch = _run(["git", "-C", repo_path, "branch", "--show-current"])
    return {"branch": branch["stdout"].strip(), "changes": result["stdout"], "success": result["success"]}


@mcp.tool()
def git_pull(repo_path: str = "/opt/alabtnt-web", branch: str = "master") -> dict:
    """Git pull from remote. Typically used before a redeploy."""
    _safe_path(repo_path, "/opt")
    fetch = _run(["git", "-C", repo_path, "fetch", "origin", branch], timeout=60)
    if not fetch["success"]:
        return {"success": False, "error": fetch["stderr"]}
    result = _run(["git", "-C", repo_path, "reset", "--hard", f"origin/{branch}"])
    return {"success": result["success"], "output": result["stdout"], "error": result["stderr"] if not result["success"] else None}


@mcp.tool()
def git_log(repo_path: str = "/opt/alabtnt-web", n: int = 10) -> dict:
    """Show recent git log."""
    _safe_path(repo_path, "/opt")
    result = _run(["git", "-C", repo_path, "log", f"-{n}", "--oneline", "--decorate"])
    return {"commits": result["stdout"], "success": result["success"]}


# ── file tools ─────────────────────────────────────────────────────────

@mcp.tool()
def read_file(path: str) -> dict:
    """Read a file from the server. Path must be within /opt."""
    safe = _safe_path(path, "/opt")
    try:
        content = Path(safe).read_text(errors="replace")
        return {"path": safe, "content": content[:50000], "size": len(content), "truncated": len(content) > 50000}
    except FileNotFoundError:
        return {"path": safe, "error": "file not found"}
    except Exception as e:
        return {"path": safe, "error": str(e)}


@mcp.tool()
def write_file(path: str, content: str) -> dict:
    """Write content to a file on the server. Path must be within /opt."""
    safe = _safe_path(path, "/opt")
    try:
        Path(safe).parent.mkdir(parents=True, exist_ok=True)
        Path(safe).write_text(content)
        return {"success": True, "path": safe, "size": len(content)}
    except Exception as e:
        return {"success": False, "path": safe, "error": str(e)}


@mcp.tool()
def list_directory(path: str = "/opt") -> dict:
    """List files and directories under a path."""
    safe = _safe_path(path, "/opt") if path.startswith("/opt") else path
    try:
        items = []
        for entry in sorted(Path(safe).iterdir()):
            try:
                stat = entry.stat()
                items.append({
                    "name": entry.name,
                    "type": "dir" if entry.is_dir() else "file",
                    "size": stat.st_size,
                    "modified": stat.st_mtime,
                })
            except Exception:
                items.append({"name": entry.name, "type": "unknown"})
        return {"path": safe, "items": items}
    except FileNotFoundError:
        return {"path": safe, "error": "directory not found"}
    except Exception as e:
        return {"path": safe, "error": str(e)}


# ── deploy helpers ─────────────────────────────────────────────────────

@mcp.tool()
def deploy_web() -> dict:
    """Full redeploy of alabtnt-web: git pull, npm install, build, restart."""
    repo = "/opt/alabtnt-web"

    pull = _run(["git", "-C", repo, "fetch", "origin", "master"], timeout=60)
    if not pull["success"]:
        return {"step": "git fetch", "success": False, "error": pull["stderr"]}

    _run(["git", "-C", repo, "reset", "--hard", "origin/master"])
    install = _run(["npm", "install"], timeout=120)
    if not install["success"]:
        return {"step": "npm install", "success": False, "error": install["stderr"][:1000]}

    build = _run(["npm", "run", "build"], timeout=300)
    if not build["success"]:
        return {"step": "npm build", "success": False, "error": build["stderr"][:2000]}

    _run(["systemctl", "restart", "alabtnt-web"])
    return {"step": "done", "success": True, "build_output": build["stdout"][-500:]}


@mcp.tool()
def deploy_tools() -> dict:
    """Redeploy alabtnt-tools: git pull, npm install, restart."""
    repo = "/opt/alabtnt-tools"

    pull = _run(["git", "-C", repo, "fetch", "origin", "master"], timeout=60)
    if not pull["success"]:
        return {"step": "git fetch", "success": False, "error": pull["stderr"]}

    _run(["git", "-C", repo, "reset", "--hard", "origin/master"])
    install = _run(["npm", "install"], timeout=60)
    if not install["success"]:
        return {"step": "npm install", "success": False, "error": install["stderr"][:1000]}

    _run(["systemctl", "restart", "alabtnt-tools"])
    return {"step": "done", "success": True}


# ── main ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    mcp.run(transport="sse")
