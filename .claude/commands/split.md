# /split — Split Oversized File

Split the file mentioned in the argument (or the current file if none given) into logical sub-modules, keeping each under 3000 lines.

## Steps:
1. Read the target file fully
2. Identify logical sections (by feature, responsibility, or domain)
3. Propose a split plan with new file names and line ranges
4. Ask for confirmation before writing
5. After splitting:
   - Create the new sub-files
   - Update the `/* @include */` references in `builder.html` if applicable
   - Delete or empty the original file if fully replaced

## Rules:
- Each new file must be under 3000 lines
- Keep related logic together (don't split a function across files)
- Name files clearly: `feature-name-part.js` or `feature-name-utils.js`
- Never break existing function references or global names
