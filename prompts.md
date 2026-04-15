"I have a massive index.html (17k+ lines) and we need to Modularize the project to make it maintainable and ready for the miniPaint & Stable Diffusion integrations.

Step 1: File Structure
Create a directory structure: /src/core, /src/ui, /src/data.

Step 2: Component Extraction

Extract the Collaboration/Socket logic from the main script into src/core/collaboration.js.

Extract the Property Inspector UI into src/ui/Inspector.js.

Extract the Section Templates (Hero, Testimonials, etc.) into a JSON/JS file named src/data/showcase.js.

Step 3: Main Script Cleanup

Keep only the initialization logic in the main <script> tag.

Use import/export (ES Modules) to bring in the logic.

Ensure the data-pc-id logic remains intact during the move.

Start with extracting the 'Share & Collaborate' logic and the 'Feature Flags' UI into their own modules first."