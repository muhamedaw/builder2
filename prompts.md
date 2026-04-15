"We are implementing the Wix Free-Composition Engine using Fabric.js. Based on the uploaded images, the user needs to add elements (Icons, Text, Shapes) ON TOP of an image and move them anywhere with total freedom.

1. Modular Architecture (New Files Only):
Create src/core/CompositionEngine.js (The logic for handling multiple objects).

Create src/ui/ElementPicker.js (A sidebar to add icons, stickers, and shapes).

2. Features to Implement (The Wix Experience):
Canvas Promotion: When an image is selected, 'Promote' it to a Fabric Canvas that allows adding child objects.

Absolute Freedom: Any element added to the image (Text, Stickers, Icons) must be draggable, rotatable, and scalable with 8-point handles.

Smart Layers: Implement a 'Layers Panel' to change the stack order (Bring to Front / Send to Back) for every icon or text added.

Snapping & Guides: Add visual 'Snap-to-Center' lines when the user moves elements around the picture.

3. The Toolset (Matching the Images):
Add Text: Multi-font support with curved text options.

Add Shapes: Circles, squares, and decorative lines.

Stickers/Icons: A library of SVG icons that can be colored and moved anywhere.

4. Critical Sync:
When the user is done, the entire composition (Image + Icons + Text) must be flattened and saved as a single high-quality version in .pagecraft.json.

Mandatory: Do not edit the 17k-line file. Link these new modules and follow the CLAUDE.md mandate."