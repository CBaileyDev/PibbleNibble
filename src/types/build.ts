// ============================================================================
// minecraft-build-schema.ts
// Comprehensive, production-ready JSON schema for AI-generated Minecraft builds.
//
// Design philosophy:
//   AI creativity operates INSIDE a strict rules engine. The AI outputs
//   structured JSON conforming to these interfaces — NOT freeform prose.
//   A rules / validation engine processes that JSON before it reaches the user.
//
// Minecraft edition target: Bedrock (block IDs use "minecraft:" namespace).
// ============================================================================

// ---------------------------------------------------------------------------
//  ENUMS & LITERALS
// ---------------------------------------------------------------------------

/** Visual / architectural theme applied to the build. */
export type Theme =
  | "fantasy"
  | "medieval"
  | "modern"
  | "cozy"
  | "nordic"
  | "desert"
  | "coastal"
  | "forest"
  | "magical";

/** Functional purpose the build serves in-game. */
export type Purpose =
  | "house"
  | "cottage"
  | "castle"
  | "tower"
  | "farm"
  | "storage"
  | "bridge"
  | "shop"
  | "decoration";

/** Biome the build is designed for — influences palette & foundation choices. */
export type Biome =
  | "plains"
  | "forest"
  | "snowy"
  | "desert"
  | "jungle"
  | "mushroom"
  | "mesa"
  | "swamp"
  | "ocean";

/** How hard the build is to execute by hand. */
export type Difficulty = "beginner" | "easy" | "medium" | "hard" | "expert";

/** Survival-mode progression gate — what stage of the game is needed. */
export type ProgressionLevel = "early" | "mid" | "late" | "endgame";

/** Role a material plays in the build. */
export type MaterialCategory = "structural" | "decorative" | "functional" | "rare";

/** How the player acquires the block in survival mode. */
export type ObtainMethod = "mine" | "craft" | "trade" | "find" | "smelt";

/** Gross footprint silhouette of the build, viewed top-down. */
export type FootprintShape = "rectangle" | "l-shape" | "u-shape" | "irregular";

// ---------------------------------------------------------------------------
//  MATERIAL SYSTEM
// ---------------------------------------------------------------------------

/**
 * A single material entry in the build's bill of materials.
 *
 * Every block the build uses MUST appear here — the validation engine sums
 * quantities across all BuildSteps and cross-checks against this list.
 */
export interface MaterialItem {
  /**
   * Minecraft Bedrock namespaced block ID.
   * @example "minecraft:oak_log"
   */
  blockId: string;

  /**
   * Human-readable display name, title-cased.
   * @example "Oak Log"
   */
  blockName: string;

  /**
   * Total quantity required for the entire build.
   * Must be a positive integer.
   */
  quantity: number;

  /** Role this material plays in the structure. */
  category: MaterialCategory;

  /** Primary method to obtain this block in survival mode. */
  obtainMethod: ObtainMethod;

  /**
   * Earliest progression stage at which this block is reasonably available.
   * Must be ≤ the build's own `progressionLevel`.
   */
  progressionRequired: ProgressionLevel;

  /**
   * If true, the block can be omitted without breaking structural integrity.
   * Decorative flourishes, flower pots, banners, etc.
   */
  isOptional: boolean;

  /**
   * Fallback block the player can swap in if the primary isn't available.
   * Optional — omit when no reasonable substitute exists.
   * @example "minecraft:spruce_log"
   */
  substituteBlockId?: string;
}

// ---------------------------------------------------------------------------
//  BLOCK PALETTE
// ---------------------------------------------------------------------------

/**
 * Curated palette that defines the build's visual identity.
 *
 * The AI must pick blocks that are internally consistent with the chosen
 * `theme` and `biome`. The rules engine validates palette coherence.
 */
export interface BlockPalette {
  /**
   * 3–5 block IDs forming the structural backbone.
   * @example ["minecraft:oak_planks", "minecraft:oak_log", "minecraft:cobblestone"]
   */
  primaryBlocks: string[];

  /**
   * 2–3 block IDs used for trim, contrast, and detail work.
   * @example ["minecraft:stripped_oak_log", "minecraft:stone_brick_slab"]
   */
  accentBlocks: string[];

  /**
   * Blocks that provide interactive or mechanical function:
   * doors, trapdoors, crafting tables, furnaces, chests, etc.
   * @example ["minecraft:oak_door", "minecraft:crafting_table", "minecraft:chest"]
   */
  functionalBlocks: string[];

  /**
   * Approximate hex colours representing the palette for UI preview cards.
   * One hex per primary + accent block, in the same order.
   * @example ["#b8945f", "#6b5839", "#7f7f7f", "#c4a76c", "#9e9e9e"]
   */
  colorHexes: string[];
}

// ---------------------------------------------------------------------------
//  CONSTRUCTION STEPS & PHASES
// ---------------------------------------------------------------------------

/**
 * Inline reference to a block and how many are used in one step.
 * Lighter than a full MaterialItem — just enough for per-step tracking.
 */
export interface StepBlockUsage {
  /** Minecraft Bedrock block ID. */
  blockId: string;

  /** Human-readable name (mirrors MaterialItem.blockName). */
  blockName: string;

  /** Quantity consumed in THIS step only. Must be a positive integer. */
  quantity: number;
}

/**
 * Running total entry — used inside `cumulativeMaterialsUsed` so the
 * player always knows how much of each block they've used so far.
 */
export interface CumulativeMaterial {
  /** Minecraft Bedrock block ID. */
  blockId: string;

  /**
   * Sum of all quantities for this blockId from step 1 through the
   * current step (inclusive). Must be monotonically non-decreasing
   * across steps.
   */
  total: number;
}

/**
 * A single, atomic instruction inside a construction phase.
 *
 * Design note: steps are written to be beginner-friendly even at higher
 * difficulties. The `description` field uses plain language; compass
 * directions ("north wall") orient the player; block counts are explicit.
 */
export interface BuildStep {
  /**
   * Globally unique step identifier.
   * Format: `phase-{phaseId}_step-{stepNumber}`.
   * @example "phase-1_step-3"
   */
  stepId: string;

  /**
   * 1-based sequential number across the ENTIRE build (not per-phase).
   * Must be strictly ascending with no gaps.
   */
  stepNumber: number;

  /**
   * Action-oriented headline — starts with a verb.
   * @example "Lay the oak log corner pillars"
   */
  title: string;

  /**
   * Clear, beginner-friendly instruction paragraph.
   * References compass directions and specific block counts.
   * Aim for 2–4 sentences; never exceeds 500 characters.
   */
  description: string;

  /** Blocks consumed during this step. */
  blocksUsed: StepBlockUsage[];

  /**
   * Human-readable location hint within the build.
   * @example "North wall, ground level"
   * @example "Roof ridge, center"
   */
  approximateArea: string;

  /**
   * Optional pro-tip that improves the experience.
   * @example "Crouch to prevent falling while placing edge blocks."
   */
  tip?: string;

  /**
   * Optional warning about a common mistake or danger.
   * @example "Don't place the door before the frame is complete — it may pop off."
   */
  warning?: string;

  /**
   * If true, this step represents a natural "save & review" point.
   * The UI can render a checkpoint indicator and encourage the player
   * to compare their progress against the preview.
   */
  isCheckpoint: boolean;

  /**
   * Running totals of every blockId used from step 1 through this step.
   * The validation engine checks monotonic increase and final equality
   * against the materials list.
   */
  cumulativeMaterialsUsed: CumulativeMaterial[];
}

/**
 * A logical grouping of BuildSteps — typically one major structural
 * milestone (foundation, walls, roof, interior, detailing).
 */
export interface Phase {
  /**
   * 1-based phase number. Must be sequential with no gaps.
   * @example 1
   */
  phaseId: number;

  /**
   * Short name for the phase.
   * @example "Foundation & Floor"
   */
  phaseName: string;

  /**
   * 1–2 sentence overview of what this phase accomplishes.
   * @example "Clear and level the build area, then lay the cobblestone foundation slab."
   */
  phaseDescription: string;

  /**
   * Estimated real-world minutes to complete this phase.
   * Must be a positive integer. Sum of all phases ≈ build estimatedMinutes.
   */
  estimatedMinutes: number;

  /**
   * Ordered list of steps within this phase.
   * Must contain at least one step.
   */
  steps: BuildStep[];
}

// ---------------------------------------------------------------------------
//  VISUAL PREVIEW
// ---------------------------------------------------------------------------

/**
 * Lightweight textual preview for UI cards, tooltips, and accessibility.
 *
 * Design note: a future version may add `previewImageUrl` once we support
 * server-side rendering of isometric block previews. For now, text + hex
 * palette is the contract.
 */
export interface VisualPreview {
  /**
   * 2–3 sentence prose description of the finished build's appearance.
   * Written in present tense, suitable for an alt-text or card blurb.
   * @example "A cozy two-story cottage with a steep oak-plank roof and stone chimney.
   *           Flower boxes line the front windows, and a cobblestone path leads to the door."
   */
  previewDescription: string;

  /**
   * Single standout feature the build is known for.
   * @example "Features a wraparound porch with fence-post railings"
   */
  highlightFeature: string;

  /**
   * Hex colour palette for the preview card background / accent stripe.
   * Should be a subset (or reordering) of `blockPalette.colorHexes`.
   */
  colorPalette: string[];
}

// ---------------------------------------------------------------------------
//  DIMENSIONS
// ---------------------------------------------------------------------------

/**
 * Spatial envelope of the build measured in blocks.
 *
 * Width = X-axis, Depth = Z-axis, Height = Y-axis (Minecraft convention).
 * Dimensions include any overhangs, porches, or roof eaves.
 */
export interface Dimensions {
  /** East–west span in blocks. Positive integer, min 1. */
  width: number;

  /** Vertical span in blocks (including roof peak). Positive integer, min 1. */
  height: number;

  /** North–south span in blocks. Positive integer, min 1. */
  depth: number;

  /**
   * Approximate total block count for the entire build.
   * Must equal the sum of all MaterialItem quantities.
   */
  totalBlocks: number;

  /** Top-down footprint silhouette. */
  footprintShape: FootprintShape;
}

// ---------------------------------------------------------------------------
//  VALIDATION (populated by the rules engine, NOT the AI)
// ---------------------------------------------------------------------------

/**
 * Validation report attached by the rules engine AFTER the AI produces
 * the build JSON. The AI should output `validation: null` or omit it
 * entirely — the engine fills it in.
 */
export interface ValidationReport {
  /** True only when every rule passes. */
  isValid: boolean;

  /**
   * Human-readable error messages, one per failed rule.
   * Empty array when isValid is true.
   * @example ["Step 4 uses 'minecraft:netherite_block' which is not in the materials list."]
   */
  validationErrors: string[];

  /**
   * True when the engine has confirmed that the sum of step-level
   * block quantities matches the top-level materials list exactly.
   */
  materialCountVerified: boolean;

  /**
   * Engine-calculated total blocks (sum of all MaterialItem.quantity).
   * Compared against `dimensions.totalBlocks` for consistency.
   */
  totalCalculatedBlocks: number;
}

// ---------------------------------------------------------------------------
//  TOP-LEVEL BUILD
// ---------------------------------------------------------------------------

/**
 * Complete, self-contained representation of an AI-generated Minecraft build.
 *
 * This is the primary contract between the AI generator, the validation
 * engine, and the client application. Every field is designed to be
 * deterministically validatable.
 */
export interface MinecraftBuild {
  // -- Metadata --

  /**
   * Globally unique identifier (UUIDv4).
   * @example "c3a1f8e2-7b4d-4e91-a6f0-2d9c8b3e5a17"
   */
  id: string;

  /**
   * Display name for the build — concise, evocative, title-cased.
   * 3–60 characters.
   * @example "Hearthstone Cottage"
   */
  name: string;

  /**
   * 1–3 sentence description of the build for search / listing cards.
   * Max 300 characters.
   */
  description: string;

  /**
   * ISO-8601 timestamp of when the AI generated this build.
   * @example "2026-04-20T14:32:00Z"
   */
  generatedAt: string;

  /** Architectural / visual theme. */
  theme: Theme;

  /** Functional purpose in-game. */
  purpose: Purpose;

  /** Target biome. */
  biome: Biome;

  /**
   * Freeform tags for search, filtering, and recommendation.
   * 1–10 tags, each 2–30 characters, lowercase kebab-case.
   * @example ["starter-home", "chimney", "garden", "two-story"]
   */
  styleTags: string[];

  // -- Difficulty & Progression --

  /** Execution difficulty rating. */
  difficulty: Difficulty;

  /** Earliest survival-mode progression stage where this build is feasible. */
  progressionLevel: ProgressionLevel;

  /**
   * Estimated real-world minutes for an average player to complete.
   * Positive integer, min 5, max 600.
   */
  estimatedMinutes: number;

  /**
   * Skills the player should be comfortable with before attempting.
   * @example ["placing stairs", "scaffolding", "water mechanics"]
   */
  requiredSkills: string[];

  // -- Spatial --

  /** Physical dimensions of the build. */
  dimensions: Dimensions;

  // -- Materials --

  /**
   * Complete bill of materials. Every block used anywhere in the build
   * must appear exactly once in this array (aggregated).
   */
  materials: MaterialItem[];

  /** Curated visual palette derived from the materials. */
  blockPalette: BlockPalette;

  // -- Construction --

  /**
   * Ordered phases of construction. Must contain at least one phase.
   * Phases and their steps are in strict sequential order.
   */
  phases: Phase[];

  // -- Preview --

  /** Textual preview metadata for UI rendering. */
  visualPreview: VisualPreview;

  // -- Validation (engine-populated) --

  /**
   * Populated by the rules engine after generation.
   * The AI should leave this as `null` in its output.
   */
  validation: ValidationReport | null;
}

// ---------------------------------------------------------------------------
//  BUILD DESIGNER INPUT (form → AI)
// ---------------------------------------------------------------------------

/**
 * What the user-facing form submits to the AI generation endpoint.
 *
 * Every field is optional except `theme` and `purpose`, giving the AI
 * maximum creative freedom while still respecting explicit constraints.
 */
export interface BuildDesignerInput {
  /** Desired architectural theme. */
  theme: Theme;

  /** Desired functional purpose. */
  purpose: Purpose;

  /**
   * Target biome. If omitted, the AI picks one that fits the theme.
   * @default undefined
   */
  biome?: Biome;

  /**
   * Maximum difficulty the user is comfortable with.
   * AI should produce at or below this ceiling.
   * @default "medium"
   */
  maxDifficulty?: Difficulty;

  /**
   * Player's current progression stage.
   * AI must not require materials beyond this gate.
   * @default "mid"
   */
  progressionLevel?: ProgressionLevel;

  /**
   * Soft cap on width × depth footprint (in blocks).
   * AI treats this as a guideline, not a hard wall.
   * @example { maxWidth: 15, maxDepth: 15 }
   */
  footprintConstraint?: {
    maxWidth?: number;
    maxDepth?: number;
  };

  /**
   * Soft cap on build height in blocks.
   * @default undefined (AI decides)
   */
  maxHeight?: number;

  /**
   * Blocks the user explicitly wants included.
   * @example ["minecraft:cherry_log", "minecraft:lantern"]
   */
  preferredBlocks?: string[];

  /**
   * Blocks the user wants excluded (resource limits, aesthetics).
   * @example ["minecraft:netherite_block"]
   */
  excludedBlocks?: string[];

  /**
   * Freeform prompt for flavour / special requests.
   * Max 500 characters. The AI interprets this creatively.
   * @example "I want a secret room behind a painting"
   */
  additionalNotes?: string;

  /**
   * Target real-world build time in minutes.
   * AI uses this to scope the design.
   * @default undefined
   */
  targetMinutes?: number;
}

// ---------------------------------------------------------------------------
//  VALIDATION RULES
//  ──────────────────────────────────────────────────────────────────────────
//  The following rules are enforced by the rules engine after AI generation.
//  Each rule has a unique code, a human-readable description, and a severity
//  (error = blocks publishing, warning = flagged but allowed).
// ---------------------------------------------------------------------------

/**
 * Canonical list of validation rules the engine enforces.
 *
 * Implementation note: these are documented here as a reference contract.
 * The actual engine implements each rule as a pure function
 * `(build: MinecraftBuild) => string | null` where a returned string is
 * the error message and null means the rule passed.
 *
 * ```
 * RULE  SEVERITY  DESCRIPTION
 * ────  ────────  ──────────────────────────────────────────────────────────
 *
 * V001  error     MATERIAL TOTAL CONSISTENCY
 *                 Sum of all MaterialItem.quantity must equal
 *                 dimensions.totalBlocks.
 *
 * V002  error     STEP BLOCK CROSS-REFERENCE
 *                 Every blockId referenced in any BuildStep.blocksUsed
 *                 must exist in the top-level materials[] array.
 *
 * V003  error     STEP QUANTITY RECONCILIATION
 *                 For each blockId, the sum of StepBlockUsage.quantity
 *                 across all steps must exactly equal the corresponding
 *                 MaterialItem.quantity.
 *
 * V004  error     CUMULATIVE MONOTONICITY
 *                 Each CumulativeMaterial.total must be ≥ the same
 *                 blockId's total in the preceding step (monotonically
 *                 non-decreasing).
 *
 * V005  error     CUMULATIVE FINAL EQUALITY
 *                 In the very last step, each CumulativeMaterial.total
 *                 must equal the corresponding MaterialItem.quantity.
 *
 * V006  error     STEP NUMBERING INTEGRITY
 *                 stepNumber values must be 1-based, strictly ascending,
 *                 sequential, and globally unique across all phases.
 *
 * V007  error     PHASE ORDERING
 *                 phaseId values must be 1-based, sequential, with no gaps.
 *                 Every phase must contain at least one step.
 *
 * V008  error     PALETTE SUBSET CHECK
 *                 Every blockId in blockPalette (primary + accent +
 *                 functional) must appear in the materials[] array.
 *
 * V009  warning   PROGRESSION GATE RESPECT
 *                 No MaterialItem may have a progressionRequired value
 *                 that exceeds the build's top-level progressionLevel.
 *                 (Ordered: early < mid < late < endgame.)
 *
 * V010  warning   ESTIMATED TIME PLAUSIBILITY
 *                 Sum of Phase.estimatedMinutes should be within ±20%
 *                 of the build's top-level estimatedMinutes.
 *
 * V011  error     BLOCK ID FORMAT
 *                 Every blockId in the entire document must match
 *                 /^minecraft:[a-z_]+$/ (Bedrock namespace format).
 *
 * V012  warning   PALETTE SIZE BOUNDS
 *                 primaryBlocks must have 3–5 entries.
 *                 accentBlocks must have 2–3 entries.
 *                 Violations are flagged but not blocking.
 *
 * V013  error     COLOR HEX FORMAT
 *                 Every entry in colorHexes and colorPalette must match
 *                 /^#[0-9a-fA-F]{6}$/.
 *
 * V014  warning   DIMENSION PLAUSIBILITY
 *                 width × depth × height must be ≥ totalBlocks (a build
 *                 can't contain more blocks than its bounding volume).
 *
 * V015  error     NAME & DESCRIPTION LENGTH
 *                 name must be 3–60 chars. description ≤ 300 chars.
 *                 styleTags: 1–10 items, each 2–30 chars, matching
 *                 /^[a-z0-9]+(-[a-z0-9]+)*$/.
 *
 * V016  error     ID FORMAT
 *                 id must be a valid UUIDv4 string.
 *
 * V017  warning   SUBSTITUTE VALIDITY
 *                 If substituteBlockId is provided, it must also match
 *                 the Bedrock block-ID format and must NOT already appear
 *                 as a primary blockId in the materials list (substitutes
 *                 are alternatives, not duplicates).
 * ```
 */
export type ValidationRuleCode =
  | "V001"
  | "V002"
  | "V003"
  | "V004"
  | "V005"
  | "V006"
  | "V007"
  | "V008"
  | "V009"
  | "V010"
  | "V011"
  | "V012"
  | "V013"
  | "V014"
  | "V015"
  | "V016"
  | "V017";

// ---------------------------------------------------------------------------
//  DESIGN DECISION NOTES
// ---------------------------------------------------------------------------

/**
 * @fileoverview
 *
 * DESIGN DECISIONS & OPEN QUESTIONS
 * ──────────────────────────────────
 *
 * 1. BLOCK IDS — BEDROCK VS JAVA
 *    We target Bedrock-edition namespaced IDs ("minecraft:oak_log"). Java
 *    edition uses different IDs for some blocks (e.g. block states vs.
 *    data values). If Java support is needed, consider adding a
 *    `javaBlockId?: string` field to MaterialItem, or maintaining a
 *    separate mapping table outside this schema.
 *
 * 2. CUMULATIVE MATERIALS — VERBOSE BUT SAFE
 *    `cumulativeMaterialsUsed` on every step is intentionally redundant.
 *    It enables O(1) progress-bar rendering and lets the validation engine
 *    catch drift without scanning the entire step history. The trade-off is
 *    payload size — for a 50-step, 20-material build this adds ~1 000 extra
 *    JSON entries. If bandwidth matters, consider making it optional and
 *    computing it client-side.
 *
 * 3. ESTIMATED MINUTES — PLAYER SKILL VARIANCE
 *    estimatedMinutes is calibrated for an "average" player. Actual build
 *    times vary wildly. A future enhancement could emit a
 *    `{ fast, average, slow }` triple or accept a skill multiplier in
 *    BuildDesignerInput.
 *
 * 4. VISUAL PREVIEW — TEXT ONLY (FOR NOW)
 *    We deliberately avoided an image URL field. Generating isometric block
 *    renders is a separate pipeline; coupling it into this schema would
 *    create a dependency that blocks validation. Add `previewImageUrl?`
 *    when a renderer exists.
 *
 * 5. PHASE GRANULARITY
 *    The current contract requires ≥ 1 phase. Very small builds (< 20
 *    blocks) may feel awkward split into phases. Consider allowing a
 *    single-phase "quick build" mode, or let the AI decide.
 *
 * 6. FOOTPRINT SHAPE — LIMITED ENUM
 *    "rectangle", "l-shape", "u-shape", "irregular" covers 90 % of builds
 *    but can't describe circles or diagonals well. An alternative is to
 *    embed a 2D boolean grid (`footprintMask: boolean[][]`) for pixel-
 *    accurate top-down shapes — heavier but precise.
 *
 * 7. SUBSTITUTE BLOCKS — SINGLE FALLBACK
 *    Each material allows at most one substituteBlockId. For richer
 *    substitution trees (oak → spruce → birch → acacia), consider
 *    `substituteBlockIds: string[]` ordered by preference.
 *
 * 8. STYLE TAGS — FREEFORM VS ENUM
 *    styleTags is `string[]` rather than an enum to give the AI creative
 *    latitude. The downside is inconsistent tagging across builds. A
 *    controlled vocabulary (enum + "custom" escape hatch) would improve
 *    filtering. Evaluate once you have 100+ generated builds.
 *
 * 9. VALIDATION SEVERITY
 *    Rules are split into "error" (blocks publishing) and "warning" (flag
 *    only). A third tier — "info" — could surface non-critical style
 *    suggestions (e.g. "consider adding interior lighting").
 *
 * 10. MULTI-FLOOR / INTERIOR ROOMS
 *     The schema has no first-class concept of floors or rooms. Steps use
 *     `approximateArea` as a free-text hint. If you need room-level
 *     navigation, add a `Room` interface and reference roomIds from steps.
 *
 * 11. REDSTONE / WIRING
 *     Redstone contraptions (hidden doors, auto-farms) would benefit from
 *     a dedicated `RedstoneCircuit` sub-schema with signal-flow diagrams.
 *     Out of scope for v1 but worth planning for.
 *
 * 12. LOCALIZATION
 *     blockName, title, description, etc. are English-only. For i18n,
 *     wrap all human-readable strings in a `LocalizedString` type
 *     (`{ en: string; [locale: string]: string }`).
 */
