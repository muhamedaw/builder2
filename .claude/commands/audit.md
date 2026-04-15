# /audit — File Size Audit

Check all project files and report which ones are approaching or exceeding the 3000-line limit.

Run this command and report the results in a clear table:

```bash
find /c/Users/Muhammed/Desktop/github/bulider -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/tests/visual/report/data/*" -not -path "*/tests/visual/baselines/*" \( -name "*.js" -o -name "*.html" -o -name "*.css" \) | xargs wc -l 2>/dev/null | sort -rn | grep -v "^[[:space:]]*0 " | head -30
```

Format the output as a table with columns: Lines | File | Status
- 🔴 OVER LIMIT — above 3000 lines (must split now)
- 🟡 WARNING — 2500–3000 lines (plan to split soon)
- 🟢 OK — below 2500 lines

Then suggest which files need to be split and into what logical sub-modules.
