import type {
  MinecraftBuild,
  MaterialItem,
  Phase,
  ProgressionLevel,
} from '../../types/build';

// ─── Result types ─────────────────────────────────────────────────────────────

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning';
}

export type ValidationWarning = Omit<ValidationError, 'severity'> & {
  severity: 'warning';
};

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  /** Present when at least one auto-correctable issue was fixed. */
  correctedBuild?: MinecraftBuild;
}

// ─── Internal constants ───────────────────────────────────────────────────────

const BLOCK_ID_RE = /^minecraft:[a-z_]+$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const MAX_DIMENSION = 30;
const MAX_DISCREPANCY_RATIO = 0.1;

const PROGRESSION_RANK: Record<ProgressionLevel, number> = {
  early: 0,
  mid: 1,
  late: 2,
  endgame: 3,
};

// ─── validateBuild ────────────────────────────────────────────────────────────

export function validateBuild(build: MinecraftBuild): ValidationResult {
  // Deep-clone so corrections don't mutate the caller's object.
  const b: MinecraftBuild = JSON.parse(JSON.stringify(build));

  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let corrected = false;

  function err(code: string, message: string, field?: string): void {
    errors.push({ code, message, field, severity: 'error' });
  }

  function warn(code: string, message: string, field?: string): void {
    warnings.push({ code, message, field, severity: 'warning' });
  }

  // Flatten all steps once — used repeatedly below.
  const allSteps = Array.isArray(b.phases)
    ? b.phases.flatMap((p) => p.steps ?? [])
    : [];

  // ──────────────────────────────────────────────────────────────────────────
  //  STRUCTURAL
  // ──────────────────────────────────────────────────────────────────────────

  // Required top-level fields
  const requiredTopLevel: Array<[keyof MinecraftBuild, unknown]> = [
    ['id', b.id],
    ['name', b.name],
    ['description', b.description],
    ['theme', b.theme],
    ['purpose', b.purpose],
    ['biome', b.biome],
    ['progressionLevel', b.progressionLevel],
    ['difficulty', b.difficulty],
  ];
  for (const [field, val] of requiredTopLevel) {
    if (!val || (typeof val === 'string' && !val.trim())) {
      err('E001', `Missing or empty required field: ${field}`, String(field));
    }
  }

  // Phase presence
  if (!Array.isArray(b.phases) || b.phases.length === 0) {
    err('E002', 'Build must contain at least one phase', 'phases');
  } else {
    checkPhases(b.phases, err);
    checkStepSequence(allSteps, err);
  }

  // Dimensions
  if (b.dimensions) {
    checkDimensions(b.dimensions, err);
  } else {
    err('E001', 'Missing required field: dimensions', 'dimensions');
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  MATERIAL MATH
  // ──────────────────────────────────────────────────────────────────────────

  const materialsMap = new Map<string, MaterialItem>(
    (b.materials ?? []).map((m) => [m.blockId, m])
  );

  // Per-block step totals
  const stepTotals = new Map<string, number>();
  for (let pi = 0; pi < (b.phases?.length ?? 0); pi++) {
    const phase = b.phases[pi];
    for (let si = 0; si < (phase.steps?.length ?? 0); si++) {
      const step = phase.steps[si];
      for (const usage of step.blocksUsed ?? []) {
        // E008: block referenced in step must appear in materials list
        if (!materialsMap.has(usage.blockId)) {
          err(
            'E008',
            `Step ${step.stepNumber} uses "${usage.blockId}" which is not in the materials list`,
            `phases[${pi}].steps[${si}].blocksUsed`
          );
        }
        // E009: blockId format (also checked on materials below)
        if (!BLOCK_ID_RE.test(usage.blockId)) {
          err(
            'E009',
            `Block ID "${usage.blockId}" must match minecraft:[a-z_]+ (missing "minecraft:" prefix?)`,
            `phases[${pi}].steps[${si}].blocksUsed`
          );
        }
        stepTotals.set(usage.blockId, (stepTotals.get(usage.blockId) ?? 0) + usage.quantity);
      }
    }
  }

  // E009: blockId format on materials list
  for (let mi = 0; mi < (b.materials?.length ?? 0); mi++) {
    if (!BLOCK_ID_RE.test(b.materials[mi].blockId)) {
      err(
        'E009',
        `materials[${mi}] blockId "${b.materials[mi].blockId}" must match minecraft:[a-z_]+`,
        `materials[${mi}].blockId`
      );
    }
  }

  const computedTotal = [...stepTotals.values()].reduce((s, q) => s + q, 0);

  // W001 / E010: totalBlocks vs step-computed total
  if (computedTotal > 0 && b.dimensions && b.dimensions.totalBlocks !== computedTotal) {
    const declared = b.dimensions.totalBlocks;
    const ratio = Math.abs(declared - computedTotal) / Math.max(declared, computedTotal, 1);
    if (ratio <= MAX_DISCREPANCY_RATIO) {
      // Auto-correct
      b.dimensions = { ...b.dimensions, totalBlocks: computedTotal };
      corrected = true;
      warn(
        'W001',
        `dimensions.totalBlocks was ${declared} — auto-corrected to ${computedTotal} (sum of all step block usage)`,
        'dimensions.totalBlocks'
      );
    } else {
      err(
        'E010',
        `dimensions.totalBlocks (${declared}) differs from computed step total (${computedTotal}) by ${Math.round(ratio * 100)}%, exceeding the 10% threshold`,
        'dimensions.totalBlocks'
      );
    }
  }

  // W002: per-block quantity mismatch between materials list and steps
  for (const [blockId, mat] of materialsMap) {
    const stepQty = stepTotals.get(blockId) ?? 0;
    if (stepQty !== mat.quantity) {
      warn(
        'W002',
        `"${blockId}" declares quantity ${mat.quantity} in materials but steps consume ${stepQty} total`,
        `materials[blockId="${blockId}"].quantity`
      );
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  PROGRESSION
  // ──────────────────────────────────────────────────────────────────────────

  const buildRank = PROGRESSION_RANK[b.progressionLevel] ?? -1;

  for (let mi = 0; mi < (b.materials?.length ?? 0); mi++) {
    const mat = b.materials[mi];
    const matRank = PROGRESSION_RANK[mat.progressionRequired] ?? 0;
    if (matRank > buildRank) {
      err(
        'E011',
        `"${mat.blockId}" requires progression "${mat.progressionRequired}" but build is gated at "${b.progressionLevel}"`,
        `materials[${mi}].progressionRequired`
      );
    }
  }

  // W009: rare required blocks incompatible with beginner/easy difficulty
  if (b.difficulty === 'beginner' || b.difficulty === 'easy') {
    for (let mi = 0; mi < (b.materials?.length ?? 0); mi++) {
      const mat = b.materials[mi];
      if (mat.category === 'rare' && !mat.isOptional) {
        warn(
          'W009',
          `"${mat.blockId}" is a rare required block — incompatible with "${b.difficulty}" difficulty`,
          `materials[${mi}].category`
        );
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  INSTRUCTION QUALITY
  // ──────────────────────────────────────────────────────────────────────────

  for (let pi = 0; pi < (b.phases?.length ?? 0); pi++) {
    const phase = b.phases[pi];
    const steps = phase.steps ?? [];

    // W005: at least one checkpoint per phase
    if (!steps.some((s) => s.isCheckpoint)) {
      warn(
        'W005',
        `Phase ${phase.phaseId} ("${phase.phaseName}") has no checkpoint step`,
        `phases[${pi}].steps`
      );
    }

    for (let si = 0; si < steps.length; si++) {
      const step = steps[si];

      // W003: description length
      if ((step.description?.length ?? 0) <= 20) {
        warn(
          'W003',
          `Step ${step.stepNumber} description is ≤ 20 characters — needs more detail`,
          `phases[${pi}].steps[${si}].description`
        );
      }

      // W004: at least one block per step
      if (!step.blocksUsed || step.blocksUsed.length === 0) {
        warn(
          'W004',
          `Step ${step.stepNumber} has no blocksUsed — every step must reference at least one block`,
          `phases[${pi}].steps[${si}].blocksUsed`
        );
      }
    }
  }

  // W006: last build step must be a checkpoint (auto-correctable)
  if (Array.isArray(b.phases) && b.phases.length > 0) {
    const lastPi = b.phases.length - 1;
    const lastPhase = b.phases[lastPi];
    const lastSteps = lastPhase.steps ?? [];
    if (lastSteps.length > 0) {
      const lastSi = lastSteps.length - 1;
      const lastStep = lastSteps[lastSi];
      if (!lastStep.isCheckpoint) {
        b.phases[lastPi].steps[lastSi] = { ...lastStep, isCheckpoint: true };
        corrected = true;
        warn(
          'W006',
          `Last build step (step ${lastStep.stepNumber}) was not a checkpoint — auto-corrected`,
          `phases[${lastPi}].steps[${lastSi}].isCheckpoint`
        );
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  CONSISTENCY
  // ──────────────────────────────────────────────────────────────────────────

  // W007: colorHexes format
  (b.blockPalette?.colorHexes ?? []).forEach((hex, hi) => {
    if (!HEX_RE.test(hex)) {
      warn(
        'W007',
        `blockPalette.colorHexes[${hi}] "${hex}" is not a valid #RRGGBB color`,
        `blockPalette.colorHexes[${hi}]`
      );
    }
  });
  (b.visualPreview?.colorPalette ?? []).forEach((hex, hi) => {
    if (!HEX_RE.test(hex)) {
      warn(
        'W007',
        `visualPreview.colorPalette[${hi}] "${hex}" is not a valid #RRGGBB color`,
        `visualPreview.colorPalette[${hi}]`
      );
    }
  });

  // W008: estimatedMinutes
  if (!(b.estimatedMinutes > 0)) {
    warn(
      'W008',
      `estimatedMinutes must be > 0, got ${b.estimatedMinutes}`,
      'estimatedMinutes'
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  BUILD RESULT
  // ──────────────────────────────────────────────────────────────────────────

  const isValid = errors.length === 0;

  if (corrected) {
    b.validation = {
      isValid,
      validationErrors: errors.map((e) => `[${e.code}] ${e.message}`),
      materialCountVerified:
        !errors.some((e) => e.code === 'E008' || e.code === 'E010') &&
        !warnings.some((w) => w.code === 'W002'),
      totalCalculatedBlocks: computedTotal,
    };
  }

  return {
    isValid,
    errors,
    warnings,
    ...(corrected ? { correctedBuild: b } : {}),
  };
}

// ─── Structural sub-checks ────────────────────────────────────────────────────

function checkPhases(
  phases: Phase[],
  err: (code: string, msg: string, field?: string) => void
): void {
  const phaseIdsSeen = new Set<number>();
  const stepIdsSeen = new Set<string>();

  for (let pi = 0; pi < phases.length; pi++) {
    const phase = phases[pi];

    // E003: each phase must have at least one step
    if (!Array.isArray(phase.steps) || phase.steps.length === 0) {
      err('E003', `Phase ${phase.phaseId} ("${phase.phaseName}") has no steps`, `phases[${pi}].steps`);
    }

    // E005: duplicate phase ID
    if (phaseIdsSeen.has(phase.phaseId)) {
      err('E005', `Duplicate phaseId: ${phase.phaseId}`, `phases[${pi}].phaseId`);
    }
    phaseIdsSeen.add(phase.phaseId);

    // E006: phase IDs must be 1-based sequential
    if (phase.phaseId !== pi + 1) {
      err(
        'E006',
        `phases[${pi}].phaseId is ${phase.phaseId}; expected ${pi + 1} (1-based sequential)`,
        `phases[${pi}].phaseId`
      );
    }

    // E005: duplicate step IDs (globally unique)
    for (let si = 0; si < (phase.steps?.length ?? 0); si++) {
      const { stepId } = phase.steps[si];
      if (stepIdsSeen.has(stepId)) {
        err('E005', `Duplicate stepId: "${stepId}"`, `phases[${pi}].steps[${si}].stepId`);
      }
      stepIdsSeen.add(stepId);
    }
  }
}

function checkStepSequence(
  allSteps: MinecraftBuild['phases'][number]['steps'],
  err: (code: string, msg: string, field?: string) => void
): void {
  const field = 'phases[*].steps[*].stepNumber';

  // Check for duplicate step numbers first
  const seen = new Set<number>();
  const dupes = new Set<number>();
  for (const s of allSteps) {
    if (seen.has(s.stepNumber)) dupes.add(s.stepNumber);
    seen.add(s.stepNumber);
  }
  if (dupes.size > 0) {
    err('E004', `Duplicate step numbers: ${[...dupes].sort((a, b) => a - b).join(', ')}`, field);
    return; // sequential check is meaningless if there are dupes
  }

  // Check for gaps (1-based, no gaps)
  const sorted = allSteps.map((s) => s.stepNumber).sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i + 1) {
      err(
        'E004',
        `Step numbers must be 1-based sequential with no gaps; expected ${i + 1}, found ${sorted[i]}`,
        field
      );
      break; // one error is enough
    }
  }
}

function checkDimensions(
  dims: MinecraftBuild['dimensions'],
  err: (code: string, msg: string, field?: string) => void
): void {
  for (const axis of ['width', 'height', 'depth'] as const) {
    const val = dims[axis];
    if (!Number.isInteger(val) || val <= 0) {
      err('E007', `dimensions.${axis} must be a positive integer, got ${val}`, `dimensions.${axis}`);
    } else if (val > MAX_DIMENSION) {
      err('E007', `dimensions.${axis} (${val}) exceeds maximum of ${MAX_DIMENSION}`, `dimensions.${axis}`);
    }
  }
}
