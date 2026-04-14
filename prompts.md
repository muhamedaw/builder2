🚀 البرومبت "النووي" لإصلاح نظام الحركة (The Smart Layers Move)
أعطِ هذا البرومبت لـ Claude Code، وسيقوم ببناء محرك حركة يعتمد على الطبقات وليس فقط الإحداثيات:

"The current 'Absolute Freedom' engine is failing because it ignores the DOM hierarchy. We need to implement a Webflow-grade Drag & Drop Layer System.

1. The 'Smart Migration' Logic:
Implement Cross-Section Dragging: When I drag an element, it should be able to move from Section A to Section B.

DOM Re-parenting: Use element.appendChild() or insertBefore() dynamically during the drag. When an element is hovered over a new section, show a 'Blue Insertion Line' to indicate exactly where it will land.

2. Flex/Grid Awareness (No More Buggy Absolute):
If a section uses Flex or Grid, dragging an element should change its visual order instead of setting position: absolute.

Only use position: absolute if the user explicitly toggles 'Manual Overlay Mode' from the Sidebar.

3. The Navigator Sync:
As I drag an element on the canvas, the Left Navigator (Tree View) must update its hierarchy in real-time. If I move an image into a different div, the tree must reflect that move instantly.

4. Smart Snapping & Padding:
Add Collision Detection: Elements should 'snap' to the padding/grid lines of the section they are entering.

Ensure that moving an element into a new section automatically inherits that section's constraints (e.g., maximum width).

5. JSON & Code Cleanliness:
Every move must trigger a State.reorder(elementId, targetParentId, index) in the .pagecraft.json.

Zero Inline Styles: Avoid writing top/left unless in 'Manual Overlay Mode'. Use the natural DOM flow to keep the code clean and responsive."