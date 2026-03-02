---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code using Next.js and Tailwind CSS that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Use Tailwind's `font-` utilities to apply distinctive, high-quality fonts. Avoid generic families like Arial, Inter, Roboto, or system fonts. For custom fonts, import via CSS (preferred in your global stylesheet) and assign via Tailwind's `font-family` config, then use contextual `font-` classes in your markup. Always pair a unique display font (for headings) with a refined, legible body font. Do not use attribute selectors or inline CSS for font sizes or font-families—leverage Tailwind's utility classes.
- **Color & Theme**: Use Tailwind’s built-in color palette and extend it by adding custom colors as CSS variables in your Tailwind config (`./src/app/globals.css`). Assign and reference these via `bg-`, `text-`, and `border-` utilities, not attribute selectors (`[style]`). Emphasize strong, memorable color themes—bold accents with deliberate contrast—rather than scattered, timid palettes.
- **Motion**: Rely on Tailwind's transition, duration, delay, and animation utilities (`transition-`, `duration-`, `delay-`, `animate-`), and add keyframes via your `./src/app/globals.css` as needed. For React, prefer using the Framer Motion library. Focus on impactful, orchestrated high-level animations (e.g., staggered reveals with `delay-`) rather than scattered, minor micro-interactions. Use `hover:`, `focus:`, and `group-hover:` variants for interactivity.
- **Spatial Composition**: Use Tailwind's layout utilities (`grid`, `flex`, `gap`, `space-x-`, `space-y-`, `justify-`, `align-`, `p-`, `m-`, `w-`, `h-`) to build unexpected arrangements—play with negative space, asymmetry, overlays, z-stacking, and unconventional alignment. Avoid attribute selectors for sizing or spacing. Break from basic symmetry: experiment with intentional imbalance, diagonal flows, or overlapping content.
- **Backgrounds & Visual Details**: Evoke depth and atmosphere with Tailwind's background utilities (`bg-gradient-to-`, `bg-opacity-`, `bg-blend-`, `bg-noise`, etc). Implement details like gradient meshes, subtle noise, patterns, dramatic shadows (`shadow-`), borders (`border-`), custom cursors, or overlays using Tailwind classes or by adding new classes in your global CSS, ideally using defined CSS variables. Do not rely on attribute selectors (`[]`) for custom props; create a class or use a CSS variable if special styling is needed.

Always prioritize using Tailwind's built-in classes and extend where necessary via the Tailwind config (inside `./src/app/globals.css`as V4 states). Minimize custom CSS and avoid attribute selectors for styling—if you must set a unique property, define it as a CSS variable and reference it in your Tailwind configuration or minimal global CSS.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
