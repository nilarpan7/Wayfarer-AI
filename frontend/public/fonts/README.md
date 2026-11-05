# Typography Assets: Fromage & Bacalar

Wayfarer AI is configured to use:
* **Headings (`h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `.font-heading`)**: **Fromage**
* **Sub-sentences / Body (`p`, `span`, `label`, `body`, `.font-sans`)**: **Bacalar**

## How the Fonts are Loaded

1. **System Installed Fonts (Instant)**:
   If you have **Fromage** and **Bacalar** installed on your operating system (via Adobe Creative Cloud, Adobe Fonts sync, or installed in Windows Fonts), the browser automatically detects and uses them immediately via `local('Fromage')` and `local('Bacalar')`.

2. **Webfont Files (Self-Hosted in this folder)**:
   You can place your `.woff2`, `.woff`, `.ttf`, or `.otf` font files directly into this directory (`frontend/public/fonts/`):
   * `Fromage.woff2` (or `Fromage.ttf` / `Fromage.otf`)
   * `Fromage-Bold.woff2` (or `Fromage-Bold.ttf`)
   * `Bacalar.woff2` (or `Bacalar.ttf` / `Bacalar.otf`)
   * `Bacalar-Medium.woff2` (or `Bacalar-Medium.ttf`)

3. **Adobe Fonts / Typekit Web Project**:
   If you have an Adobe Fonts web project ID containing Fromage and Bacalar, you can add it to `.env`:
   ```env
   NEXT_PUBLIC_TYPEKIT_ID=your-kit-id
   ```
   Wayfarer AI will automatically load the stylesheet from `https://use.typekit.net/{kit-id}.css`.

4. **Graceful Fallbacks**:
   If font files or local installations are not yet present, Wayfarer AI seamlessly falls back to **Outfit** for headings and **Inter** for body sentences with zero breaking layout shifts.
