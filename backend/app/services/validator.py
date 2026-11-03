import re
import os
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from bs4 import BeautifulSoup

from app.config import settings
from app.models.validation import ValidationCheck, ValidationReport
from app.services.storage import resolve_safe_path, StorageService

class CodeValidator:
    @staticmethod
    def validate_html(project_id: str, file_path: str, content: str) -> List[ValidationCheck]:
        checks = []
        # Check basic structure
        has_doctype = bool(re.search(r"<!doctype\s+html>", content, re.IGNORECASE))
        checks.append(ValidationCheck(
            name="HTML5 Doctype",
            category="structure",
            status="passed" if has_doctype else "warning",
            message="Document declares standard <!DOCTYPE html>" if has_doctype else "Missing standard <!DOCTYPE html> declaration",
            file=file_path,
            line=1
        ))

        # Check for matching basic tags with BeautifulSoup
        soup = BeautifulSoup(content, "html.parser")
        
        has_head = soup.find("head") is not None
        has_body = soup.find("body") is not None
        checks.append(ValidationCheck(
            name="HTML Document Structure",
            category="structure",
            status="passed" if (has_head and has_body) else "warning",
            message="Found <head> and <body> elements" if (has_head and has_body) else "Incomplete document structure: missing head or body tag",
            file=file_path
        ))

        title = soup.find("title")
        checks.append(ValidationCheck(
            name="Page Title Tag",
            category="structure",
            status="passed" if (title and title.text.strip()) else "warning",
            message=f"Document title set: '{title.text.strip()}'" if (title and title.text.strip()) else "Missing or empty <title> tag",
            file=file_path
        ))

        # Check local references (css and js)
        project_dir = settings.DATA_DIR / project_id
        
        for link in soup.find_all("link", rel=lambda r: r and "stylesheet" in r):
            href = link.get("href")
            if href and not href.startswith(("http://", "https://", "//", "data:")):
                # Local stylesheet reference
                clean_href = href.split("?")[0].split("#")[0].lstrip("./\\")
                ref_path = (project_dir / clean_href).resolve()
                if ref_path.exists() and ref_path.is_file():
                    checks.append(ValidationCheck(
                        name=f"Stylesheet Reference: {href}",
                        category="references",
                        status="passed",
                        message=f"Stylesheet reference verified: {href}",
                        file=file_path
                    ))
                else:
                    checks.append(ValidationCheck(
                        name=f"Stylesheet Reference: {href}",
                        category="references",
                        status="failed",
                        message=f"Referenced stylesheet not found in project: {href}",
                        file=file_path
                    ))

        for script in soup.find_all("script", src=True):
            src = script.get("src")
            if src and not src.startswith(("http://", "https://", "//", "data:")):
                clean_src = src.split("?")[0].split("#")[0].lstrip("./\\")
                ref_path = (project_dir / clean_src).resolve()
                if ref_path.exists() and ref_path.is_file():
                    checks.append(ValidationCheck(
                        name=f"Script Reference: {src}",
                        category="references",
                        status="passed",
                        message=f"Script reference verified: {src}",
                        file=file_path
                    ))
                else:
                    checks.append(ValidationCheck(
                        name=f"Script Reference: {src}",
                        category="references",
                        status="failed",
                        message=f"Referenced script file not found in project: {src}",
                        file=file_path
                    ))

        # Basic security checks in HTML
        if re.search(r"javascript:\s*void", content, re.IGNORECASE) or re.search(r"<iframe[^>]+src=[\"']http:", content, re.IGNORECASE):
            checks.append(ValidationCheck(
                name="Security: Insecure Protocol",
                category="security",
                status="warning",
                message="Insecure http: iframe or inline protocol detected",
                file=file_path
            ))
            
        return checks

    @staticmethod
    def validate_css(file_path: str, content: str) -> List[ValidationCheck]:
        checks = []
        # Check brace balance
        open_braces = content.count("{")
        close_braces = content.count("}")
        
        if open_braces == close_braces:
            checks.append(ValidationCheck(
                name="CSS Brace Balance",
                category="syntax",
                status="passed",
                message=f"All {open_braces} CSS rule blocks are properly closed",
                file=file_path
            ))
        else:
            checks.append(ValidationCheck(
                name="CSS Brace Balance",
                category="syntax",
                status="failed",
                message=f"Unmatched CSS braces: {open_braces} open vs {close_braces} closed",
                file=file_path
            ))

        # Check comment closures
        open_comments = content.count("/*")
        close_comments = content.count("*/")
        if open_comments != close_comments:
            checks.append(ValidationCheck(
                name="CSS Comment Syntax",
                category="syntax",
                status="failed",
                message="Unclosed CSS comment /* detected",
                file=file_path
            ))
        else:
            checks.append(ValidationCheck(
                name="CSS Comment Syntax",
                category="syntax",
                status="passed",
                message="All comments properly terminated",
                file=file_path
            ))

        return checks

    @staticmethod
    def validate_js(file_path: str, content: str) -> List[ValidationCheck]:
        checks = []
        stack = []
        pairs = {')': '(', '}': '{', ']': '['}
        i = 0
        quote = None
        n = len(content)
        error_msg = None
        
        while i < n:
            c = content[i]
            
            # Inside string or template literal
            if quote is not None:
                if c == '\\':
                    i += 2
                    continue
                if c == quote:
                    quote = None
                i += 1
                continue
                
            # Check comments & regex
            if c == '/' and i + 1 < n:
                next_c = content[i+1]
                if next_c == '/':
                    newline_pos = content.find('\n', i)
                    i = newline_pos if newline_pos != -1 else n
                    continue
                elif next_c == '*':
                    end_pos = content.find('*/', i + 2)
                    i = (end_pos + 2) if end_pos != -1 else n
                    continue
                elif i > 0 and content[i-1] in '=(,:[{;!&|?':
                    end_regex = content.find('/', i + 1)
                    if end_regex != -1 and '\n' not in content[i:end_regex]:
                        i = end_regex + 1
                        while i < n and content[i].isalpha():
                            i += 1
                        continue

            if c in ("'", '"', '`'):
                quote = c
                i += 1
                continue
                
            if c in '({[':
                stack.append((c, i))
            elif c in ')}]':
                if not stack:
                    error_msg = f"Unexpected closing token '{c}' without matching opening token"
                    break
                last, _ = stack.pop()
                if pairs[c] != last:
                    error_msg = f"Mismatched closing '{c}', expected matching '{pairs[c]}'"
                    break
                    
            i += 1
            
        if not error_msg and stack:
            error_msg = f"Unclosed token '{stack[-1][0]}' remaining at end of file"
            
        if error_msg:
            checks.append(ValidationCheck(
                name="JavaScript Syntax Balance",
                category="syntax",
                status="failed",
                message=error_msg,
                file=file_path
            ))
        else:
            checks.append(ValidationCheck(
                name="JavaScript Syntax Balance",
                category="syntax",
                status="passed",
                message="Braces, brackets, and parentheses are balanced",
                file=file_path
            ))

        # Security check: eval
        if re.search(r"\beval\s*\(", content):
            checks.append(ValidationCheck(
                name="Security: Dangerous eval()",
                category="security",
                status="warning",
                message="Use of eval() detected, which is discouraged for security reasons",
                file=file_path
            ))

        return checks

    @classmethod
    def validate_project(cls, project_id: str) -> ValidationReport:
        """Run comprehensive validation across all files in a project."""
        project_dir = settings.DATA_DIR / project_id
        if not project_dir.exists():
            return ValidationReport(
                project_id=project_id,
                total_checks=0,
                passed=0,
                failed=1,
                warnings=0,
                checks=[ValidationCheck(
                    name="Project Directory Exists",
                    category="structure",
                    status="failed",
                    message="Project folder does not exist"
                )],
                is_valid=False
            )

        checks: List[ValidationCheck] = []
        
        # Check required files for standard web application
        index_html = project_dir / "index.html"
        if index_html.exists():
            checks.append(ValidationCheck(
                name="Entrypoint HTML",
                category="structure",
                status="passed",
                message="Found index.html in project root",
                file="index.html"
            ))
        else:
            checks.append(ValidationCheck(
                name="Entrypoint HTML",
                category="structure",
                status="failed",
                message="Missing required entrypoint file 'index.html'",
                file="index.html"
            ))

        # Scan all files
        for root, _, files in os.walk(project_dir):
            for file in files:
                if file == "project.json" or file.endswith(".tmp"):
                    continue
                full_path = Path(root) / file
                rel_path = full_path.relative_to(project_dir).as_posix()
                ext = full_path.suffix.lower()
                
                try:
                    with open(full_path, "r", encoding="utf-8") as f:
                        content = f.read()
                except UnicodeDecodeError:
                    continue
                except Exception as e:
                    checks.append(ValidationCheck(
                        name=f"File Readability: {rel_path}",
                        category="structure",
                        status="failed",
                        message=f"Failed to read file: {e}",
                        file=rel_path
                    ))
                    continue

                if ext in [".html", ".htm"]:
                    checks.extend(cls.validate_html(project_id, rel_path, content))
                elif ext in [".css"]:
                    checks.extend(cls.validate_css(rel_path, content))
                elif ext in [".js", ".mjs"]:
                    checks.extend(cls.validate_js(rel_path, content))

        passed = sum(1 for c in checks if c.status == "passed")
        failed = sum(1 for c in checks if c.status == "failed")
        warnings = sum(1 for c in checks if c.status == "warning")
        is_valid = failed == 0

        report = ValidationReport(
            project_id=project_id,
            total_checks=len(checks),
            passed=passed,
            failed=failed,
            warnings=warnings,
            checks=checks,
            is_valid=is_valid,
        )
        return report
