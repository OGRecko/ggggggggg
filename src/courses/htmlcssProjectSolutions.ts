import type { ProjectSolution } from "./chapterPlanHelpers";

/**
 * Authored HTML/CSS chapter project solutions for the chapters whose projects used to ship a
 * generated placeholder (a chapter sample plus an injected "Modified practice output" paragraph).
 *
 * Verification boundary: every solution below is rendered by CodeForge in the sandboxed preview
 * iframe inside the learner's browser, and its structure is checked by the on-device pattern
 * checker that matches the project prompt. Nothing here claims a pixel-level rendering check or an
 * accessibility audit in this environment; the expected text describes the structure the markup
 * really produces.
 */
export const htmlcssProjectSolutions: Partial<Record<number, ProjectSolution>> = {
  // Chapter 2: HTML Structure
  2: {
    solution: `<main>
  <h1>Accessible lesson page</h1>
  <section>
    <h2>What you will build</h2>
    <ul>
      <li>Headings that outline the page</li>
      <li>A list for grouped steps</li>
    </ul>
    <p><a href="#notes">Jump to the notes</a></p>
  </section>
  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Crect width='320' height='180' fill='%23e8eefc'/%3E%3Ctext x='20' y='95' font-size='16' fill='%23334566'%3EPage outline diagram%3C/text%3E%3C/svg%3E" alt="Diagram of a page outline with one h1 and nested h2 sections" width="320" height="180" />
  <section id="notes">
    <h2>Notes</h2>
    <p>Text carries the content and the list groups related items, so the outline stays readable without styling.</p>
  </section>
</main>`,
    solutionExplanation:
      "One h1 gives the page a single main topic, the h2 headings divide it, and the list groups related steps. The image uses a self-contained data URI so the preview never depends on the network, and it carries both alt text and real dimensions so the layout does not jump while the image loads.",
    expected:
      "Browser preview: a main landmark with an h1 and h2 outline, a list, a link, and an image that has alt text, width, and height.",
  },

  // Chapter 3: Semantic HTML
  3: {
    solution: `<header>
  <h1>CodeForge</h1>
  <nav aria-label="Primary">
    <a href="#lessons">Lessons</a>
    <a href="#practice">Practice</a>
  </nav>
</header>
<main id="lessons">
  <article>
    <h2>Why landmarks come first</h2>
    <p>Landmarks let assistive technology jump straight to the region it needs, so the page outline matters before any styling does.</p>
  </article>
  <section id="practice">
    <h2>Practice</h2>
    <p>A generic div is only correct when no semantic element describes the content.</p>
  </section>
</main>
<footer>
  <p>Free programming education.</p>
</footer>`,
    solutionExplanation:
      "Each landmark element is chosen for what it means: header for the introductory region, nav for the link set, main for the unique page content, article for a self-contained composition, section for a themed group, and footer for the closing region. The aria-label on nav is the only ARIA here because it adds a distinguishing name to a real landmark rather than replacing native semantics; a description meta element belongs in the document head, not in this body fragment.",
    expected: "Browser preview: header, nav, main, and footer landmarks containing one article and one section.",
  },

  // Chapter 5: CSS Fundamentals
  5: {
    solution: `<style>
  :root {
    --accent: #345;
  }
  .callout {
    border-left: 4px solid var(--accent);
    color: var(--accent);
    padding: 0.75rem 1rem;
    margin: 1rem 0;
  }
</style>
<p class="callout">Custom properties keep the accent in one place, and the class rule reads it with var().</p>`,
    solutionExplanation:
      "The custom property lives in :root so it is inherited document-wide, while .callout is the reusable component hook. The cascade decides which declarations apply and the custom property only supplies a value, which is why the two roles stay separate: change --accent once and every rule that reads it updates.",
    expected: "Browser preview: a .callout block whose border and text colour come from the --accent custom property declared in :root.",
  },

  // Chapter 10: Typography and Visual Design
  10: {
    solution: `<style>
  article {
    max-width: 65ch;
  }
  p {
    line-height: 1.6;
  }
  h1 {
    font-size: clamp(1.5rem, 4vw, 2.5rem);  /* fluid type: the size scales with the viewport but stays inside its limits */
  }
</style>
<article>
  <h1>Readable by default</h1>
  <p>A measure near 65 characters and a line-height of 1.6 keep long text comfortable, and clamp bounds the heading between a floor and a ceiling as the viewport changes.</p>
</article>`,
    solutionExplanation:
      "The measure is expressed in ch units because character width, not pixels, is what controls comfortable reading. line-height adds vertical breathing room, and clamp(min, fluid, max) lets the heading scale with the viewport without ever becoming unreadably small or oversized. An outer max-width would also cap line length, but putting it on the article ties the measure to the text block itself.",
    expected: "Browser preview: an article limited to 65ch with 1.6 line-height and a clamp-bounded h1.",
  },

  // Chapter 12: Accessibility II
  12: {
    solution: `<button type="button" id="help-toggle" aria-expanded="false" aria-controls="help-region">Show keyboard help</button>
<section id="help-region" hidden>
  <h2>Keyboard help</h2>
  <p>Tab moves focus, Enter or Space activates the focused control, and Escape closes the region in the finished component.</p>
</section>`,
    solutionExplanation:
      "A real button supplies keyboard activation and focus behaviour, so no role or tabindex has to be invented. aria-expanded carries the open/closed state, aria-controls names the region it governs, and the hidden attribute keeps the collapsed content out of the accessibility tree. A later JavaScript step must flip hidden and aria-expanded together; if they drift apart the button lies to assistive technology.",
    expected: "Browser preview: a button with aria-expanded and aria-controls pointing at a hidden controlled region.",
  },

  // Chapter 13: Modern CSS
  13: {
    solution: `<style>
  .card {
    container-type: inline-size;
    border: 1px solid #ccd5e0;
    border-radius: 0.5rem;
    padding: 1rem;
  }
  .card p {
    columns: 1;
  }
  @container (min-width: 30rem) {
    .card p {
      columns: 2;
    }
  }
</style>
<article class="card">
  <h2>Container-responsive card</h2>
  <p>The base rule keeps one text column in a narrow card, and the @container rule adds a second column only when the card itself is wide enough, regardless of the viewport width around it.</p>
</article>`,
    solutionExplanation:
      "container-type: inline-size turns the card into a query container whose inline size can be measured, which is why the @container rule is meaningful. Container queries differ from media queries: the media query answers how wide the viewport is, while this rule answers how much room the component itself was given, so the same card can sit in a sidebar and a main column and respond correctly in both.",
    expected: "Browser preview: a .card container whose paragraph becomes two columns once the card itself is wide enough.",
  },

  // Chapter 15: Component Architecture
  15: {
    solution: `<style>
  .lesson-card {
    --lesson-card-accent: #345;
    border-top: 4px solid var(--lesson-card-accent);
    padding: 1rem;
  }
  .lesson-card h2 {
    color: var(--lesson-card-accent);
    margin-top: 0;
  }
</style>
<article class="lesson-card">
  <h2>Tokenized lesson card</h2>
  <p>Semantic markup holds the content, while one custom property exposes the accent a theme can override without editing the component.</p>
</article>`,
    solutionExplanation:
      "The article gives the component real semantics, the class gives it a styling hook, and --lesson-card-accent is the design token. Defining the token on the component itself means a parent can re-declare it for one instance, so reuse never depends on editing the rule. In a narrow container the card only loses vertical decoration, so its heading and paragraph keep working.",
    expected: "Browser preview: an article.lesson-card with a heading and paragraph, themed through one component-scoped custom property.",
  },

  // Chapter 22: Advanced Layout
  22: {
    solution: `<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
  .panel {
    display: grid;
    grid-template-columns: subgrid;
    row-gap: 0.25rem;
  }
  .feature {
    grid-column: 1 / -1;
  }
</style>
<section class="grid">
  <article class="panel">
    <h2>Subgrid alignment</h2>
    <p>grid-template-columns: subgrid lets this panel reuse the parent tracks, so headings and paragraphs line up across cards.</p>
  </article>
  <article class="panel">
    <h2>Advanced alignment</h2>
    <p>Alignment stays explicit instead of being approximated with margins.</p>
  </article>
  <p class="feature">A feature row spans both tracks with grid-column: 1 / -1 rather than a magic width.</p>
</section>`,
    solutionExplanation:
      "The outer element is the grid container with two flexible tracks, and each panel opts into subgrid so the child inherits those tracks instead of guessing its own. That is the advanced alignment choice: nested content lines up with the parent because it shares the parent's track sizing. The feature row uses 1 / -1 so it spans whatever track count the container has, which keeps the layout honest when the grid is later widened.",
    expected: "Browser preview: a Grid section whose panels use subgrid and whose feature row spans every track.",
  },

  // Chapter 23: Real-World Pages
  23: {
    solution: `<style>
  main {
    display: grid;
    gap: 1rem;
  }
  @media (min-width: 40rem) {
    main {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
<header>
  <h1>CodeForge lessons</h1>
  <nav aria-label="Primary">
    <a href="#courses">Courses</a>
    <a href="#practice">Practice</a>
  </nav>
</header>
<main id="courses">
  <section>
    <h2>Courses</h2>
    <p>The content stacks in one column first and adds a second track only when the viewport has room for it.</p>
  </section>
  <section id="practice">
    <h2>Practice</h2>
    <p>Every lab states plainly what is executed and what is checked structurally.</p>
    <button type="button">Check answer</button>
  </section>
</main>
<footer>
  <p>Free programming education.</p>
</footer>`,
    solutionExplanation:
      "The landmark skeleton comes first, so the page is understandable before any layout exists. The one-column grid is the baseline, and the media query adds the second track above 40rem; taking the single-column case first is what keeps small screens and long text readable. The button is a real control with a visible label, so keyboard users reach it in document order.",
    expected:
      "Browser preview: header, nav, main, and footer landmarks with a responsive two-column content area and one labeled button.",
  },

  // Chapter 25: Capstone
  25: {
    solution: `<style>
  .courses {
    display: grid;
    gap: 1rem;
    grid-template-columns: 1fr;
  }
  @media (min-width: 45rem) {
    .courses {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  a:focus-visible,
  button:focus-visible {
    outline: 3px solid #345;
    outline-offset: 2px;
  }
</style>
<header>
  <h1>CodeForge</h1>
  <nav aria-label="Primary">
    <a href="#courses">Courses</a>
  </nav>
</header>
<main id="courses">
  <h2>Courses</h2>
  <section class="courses">
    <article>
      <h3>Python</h3>
      <p>Scripting, data, and automation with real execution.</p>
    </article>
    <article>
      <h3>JavaScript</h3>
      <p>Browser execution and asynchronous work in a Worker.</p>
    </article>
    <article>
      <h3>HTML and CSS</h3>
      <p>Semantic structure, layout, and accessible presentation.</p>
    </article>
  </section>
</main>
<footer>
  <p>Free programming education.</p>
</footer>`,
    solutionExplanation:
      "The capstone starts from the semantic skeleton, adds exactly one h1, and keeps the course grid in one column until there is room for three. focus-visible is styled rather than focus, so pointer users do not see the ring while keyboard users always do, and the outline uses a colour with enough contrast to be visible on the page background. The course cards are articles because each is a self-contained unit with its own heading.",
    expected:
      "Browser preview: header, nav, main, and footer landmarks with one h1, a responsive .courses Grid, and a visible focus-visible outline.",
  },
};
