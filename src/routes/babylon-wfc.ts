/**
 * Babylon-WFC Route Handler
 * 
 * This endpoint demonstrates the Wave Function Collapse (WFC) algorithm
 * visualized in 3D using BabylonJS. It generates a 50x50 grid of 3D tiles
 * using mesh instancing for optimal performance.
 * 
 * **Key Features:**
 * - WFC algorithm implemented in Rust WASM
 * - 11 different 3D tile types
 * - Mesh instancing for performance
 * - Babylon 2D UI for controls
 * - Fullscreen support
 */

import type { WasmBabylonWfc, WasmModuleBabylonWfc, TileType, LayoutConstraints } from '../types';
import { loadWasmModule, validateWasmModule } from '../wasm/loader';
import { WasmLoadError, WasmInitError } from '../wasm/types';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, Mesh, StandardMaterial, Color3, InstancedMesh } from '@babylonjs/core';
import { AdvancedDynamicTexture, Button } from '@babylonjs/gui';
import { pipeline, type TextGenerationPipeline, env } from '@xenova/transformers';

/**
 * WASM module reference - stored as Record after validation
 */
let wasmModuleRecord: Record<string, unknown> | null = null;

/**
 * Get the WASM module initialization function
 */
const getInitWasm = async (): Promise<unknown> => {
  if (!wasmModuleRecord) {
    // Import path will be rewritten by vite plugin to absolute path in production
    const moduleUnknown: unknown = await import('../../pkg/wasm_babylon_wfc/wasm_babylon_wfc.js');
    
    if (typeof moduleUnknown !== 'object' || moduleUnknown === null) {
      throw new Error('Imported module is not an object');
    }
    
    const moduleKeys = Object.keys(moduleUnknown);
    
    if (!('default' in moduleUnknown) || typeof moduleUnknown.default !== 'function') {
      throw new Error(`Module missing 'default' export. Available: ${moduleKeys.join(', ')}`);
    }
    if (!('generate_layout' in moduleUnknown) || typeof moduleUnknown.generate_layout !== 'function') {
      throw new Error(`Module missing 'generate_layout' export. Available: ${moduleKeys.join(', ')}`);
    }
    if (!('get_tile_at' in moduleUnknown) || typeof moduleUnknown.get_tile_at !== 'function') {
      throw new Error(`Module missing 'get_tile_at' export. Available: ${moduleKeys.join(', ')}`);
    }
    if (!('clear_layout' in moduleUnknown) || typeof moduleUnknown.clear_layout !== 'function') {
      throw new Error(`Module missing 'clear_layout' export. Available: ${moduleKeys.join(', ')}`);
    }
    if (!('set_pre_constraint' in moduleUnknown) || typeof moduleUnknown.set_pre_constraint !== 'function') {
      throw new Error(`Module missing 'set_pre_constraint' export. Available: ${moduleKeys.join(', ')}`);
    }
    if (!('clear_pre_constraints' in moduleUnknown) || typeof moduleUnknown.clear_pre_constraints !== 'function') {
      throw new Error(`Module missing 'clear_pre_constraints' export. Available: ${moduleKeys.join(', ')}`);
    }
    
    // Store module as Record after validation
    // TypeScript can't narrow dynamic import types, so we use Record pattern
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    wasmModuleRecord = moduleUnknown as Record<string, unknown>;
  }
  
  if (!wasmModuleRecord) {
    throw new Error('Failed to initialize module record');
  }
  
  const defaultFunc = wasmModuleRecord.default;
  if (typeof defaultFunc !== 'function') {
    throw new Error('default export is not a function');
  }
  
  // Call the function - we've validated it's a function
  // TypeScript can't narrow Function to specific signature, but runtime is safe
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const result = defaultFunc();
  if (!(result instanceof Promise)) {
    throw new Error('default export did not return a Promise');
  }
  
  return result;
};

/**
 * Global state object for the babylon-wfc module
 */
const WASM_BABYLON_WFC: WasmBabylonWfc = {
  wasmModule: null,
  wasmModulePath: '../pkg/wasm_babylon_wfc',
};

/**
 * Convert WASM tile type number to TypeScript TileType
 */
function tileTypeFromNumber(tileNum: number): TileType | null {
  switch (tileNum) {
    case 0:
      return { type: 'grass' };
    case 1:
      return { type: 'floor' };
    case 2:
      return { type: 'wallNorth' };
    case 3:
      return { type: 'wallSouth' };
    case 4:
      return { type: 'wallEast' };
    case 5:
      return { type: 'wallWest' };
    case 6:
      return { type: 'cornerNE' };
    case 7:
      return { type: 'cornerNW' };
    case 8:
      return { type: 'cornerSE' };
    case 9:
      return { type: 'cornerSW' };
    case 10:
      return { type: 'door' };
    default:
      return null;
  }
}

/**
 * Get color for a tile type
 * 
 * **Learning Point**: Each tile type gets a distinct color for visual differentiation.
 * In a full implementation, you might load textures instead of using solid colors.
 */
function getTileColor(tileType: TileType): Color3 {
  switch (tileType.type) {
    case 'grass':
      return new Color3(0.2, 0.8, 0.2);
    case 'floor':
      return new Color3(0.6, 0.6, 0.6);
    case 'wallNorth':
    case 'wallSouth':
    case 'wallEast':
    case 'wallWest':
      return new Color3(0.6, 0.4, 0.2);
    case 'cornerNE':
    case 'cornerNW':
    case 'cornerSE':
    case 'cornerSW':
      return new Color3(0.3, 0.3, 0.3);
    case 'door':
      return new Color3(0.8, 0.6, 0.2);
  }
}

/**
 * Validate that the WASM module has all required exports
 */
function validateBabylonWfcModule(exports: unknown): WasmModuleBabylonWfc | null {
  if (!validateWasmModule(exports)) {
    return null;
  }
  
  if (typeof exports !== 'object' || exports === null) {
    return null;
  }
  
  const getProperty = (obj: object, key: string): unknown => {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    return descriptor ? descriptor.value : undefined;
  };
  
  const exportKeys = Object.keys(exports);
  const missingExports: string[] = [];
  
  const memoryValue = getProperty(exports, 'memory');
  if (!memoryValue || !(memoryValue instanceof WebAssembly.Memory)) {
    missingExports.push('memory (WebAssembly.Memory)');
  }
  
  if (!wasmModuleRecord) {
    missingExports.push('module record (wasmModuleRecord is null)');
  } else {
    if (typeof wasmModuleRecord.generate_layout !== 'function') {
      missingExports.push('generate_layout (function)');
    }
    if (typeof wasmModuleRecord.get_tile_at !== 'function') {
      missingExports.push('get_tile_at (function)');
    }
    if (typeof wasmModuleRecord.clear_layout !== 'function') {
      missingExports.push('clear_layout (function)');
    }
    if (typeof wasmModuleRecord.set_pre_constraint !== 'function') {
      missingExports.push('set_pre_constraint (function)');
    }
    if (typeof wasmModuleRecord.clear_pre_constraints !== 'function') {
      missingExports.push('clear_pre_constraints (function)');
    }
  }
  
  if (missingExports.length > 0) {
    throw new Error(`WASM module missing required exports: ${missingExports.join(', ')}. Available exports from init result: ${exportKeys.join(', ')}`);
  }
  
  const memory = memoryValue;
  if (!(memory instanceof WebAssembly.Memory)) {
    return null;
  }
  
  if (!wasmModuleRecord) {
    return null;
  }
  
  const generateLayoutFunc = wasmModuleRecord.generate_layout;
  const getTileAtFunc = wasmModuleRecord.get_tile_at;
  const clearLayoutFunc = wasmModuleRecord.clear_layout;
  const setPreConstraintFunc = wasmModuleRecord.set_pre_constraint;
  const clearPreConstraintsFunc = wasmModuleRecord.clear_pre_constraints;
  
  if (
    typeof generateLayoutFunc !== 'function' ||
    typeof getTileAtFunc !== 'function' ||
    typeof clearLayoutFunc !== 'function' ||
    typeof setPreConstraintFunc !== 'function' ||
    typeof clearPreConstraintsFunc !== 'function'
  ) {
    return null;
  }
  
  // TypeScript can't narrow Function to specific signatures after validation
  // Runtime validation ensures these are safe
  return {
    memory,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    generate_layout: generateLayoutFunc as () => void,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    get_tile_at: getTileAtFunc as (x: number, y: number) => number,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    clear_layout: clearLayoutFunc as () => void,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    set_pre_constraint: setPreConstraintFunc as (x: number, y: number, tile_type: number) => boolean,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    clear_pre_constraints: clearPreConstraintsFunc as () => void,
  };
}

// Qwen model configuration
const MODEL_ID = 'Xenova/qwen1.5-0.5b-chat';

// CORS proxy services for Hugging Face model loading
const CORS_PROXY_SERVICES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
] as const;

/**
 * Check if a URL needs CORS proxying
 */
function needsProxy(url: string): boolean {
  return (
    url.includes('huggingface.co') &&
    !url.includes('cdn.jsdelivr.net') &&
    !url.includes('api.allorigins.win') &&
    !url.includes('corsproxy.io') &&
    !url.includes('api.codetabs.com')
  );
}

/**
 * Custom fetch function with CORS proxy support
 */
async function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  
  // If URL doesn't need proxying, use normal fetch
  if (!needsProxy(url)) {
    return fetch(input, init);
  }
  
  // Try each CORS proxy in order
  for (const proxyBase of CORS_PROXY_SERVICES) {
    try {
      const proxyUrl = proxyBase + encodeURIComponent(url);
      
      const response = await fetch(proxyUrl, {
        ...init,
        redirect: 'follow',
      });
      
      // Skip proxies that return error status codes
      if (response.status >= 400 && response.status < 600) {
        continue;
      }
      
      // If response looks good, return it
      if (response.ok) {
        return response;
      }
    } catch {
      // Try next proxy
      continue;
    }
  }
  
  // If all proxies fail, try direct fetch as last resort
  return fetch(input, init);
}

/**
 * Set up custom fetch function for Transformers.js
 */
function setupCustomFetch(): void {
  // Use proper type narrowing instead of type assertion
  if (typeof env === 'object' && env !== null) {
    const envRecord: Record<string, unknown> = env;
    envRecord.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      return customFetch(input, init);
    };
  }
}

// Qwen model state
let textGenerationPipeline: TextGenerationPipeline | null = null;
let isModelLoading = false;
let isModelLoaded = false;

/**
 * Load Qwen model for text-to-layout generation
 */
async function loadQwenModel(onProgress?: (progress: number) => void): Promise<void> {
  if (isModelLoaded && textGenerationPipeline) {
    return;
  }

  if (isModelLoading) {
    return;
  }

  isModelLoading = true;

  try {
    if (onProgress) {
      onProgress(0.1);
    }

    // Set up custom fetch with CORS proxy support before loading model
    setupCustomFetch();

    const pipelineResult = await pipeline('text-generation', MODEL_ID, {
      progress_callback: (progress: { loaded: number; total: number }) => {
        if (onProgress && progress.total > 0) {
          const progressPercent = (progress.loaded / progress.total) * 0.9 + 0.1;
          onProgress(progressPercent);
        }
      },
    });

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unnecessary-type-assertion
    textGenerationPipeline = pipelineResult as TextGenerationPipeline;

    if (onProgress) {
      onProgress(1.0);
    }

    isModelLoaded = true;
    isModelLoading = false;
  } catch (error) {
    isModelLoading = false;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to load Qwen model: ${errorMsg}`);
  }
}

/**
 * Extract assistant response from generated text
 */
function extractAssistantResponse(generatedText: string, formattedPrompt: string): string {
  let response = generatedText;

  if (response.includes(formattedPrompt)) {
    response = response.replace(formattedPrompt, '');
  }

  response = response.replace(/<\|im_start\|>assistant\s*/g, '');
  response = response.replace(/<\|im_end\|>/g, '');
  response = response.replace(/<\|im_start\|>/g, '');
  response = response.replace(/^\s*(user|assistant)[:\s]+/i, '');

  const lastAssistantIndex = response.lastIndexOf('assistant');
  if (lastAssistantIndex !== -1) {
    const afterAssistant = response.substring(lastAssistantIndex + 'assistant'.length);
    if (afterAssistant.trim().length > 0) {
      response = afterAssistant;
    }
  }

  response = response.replace(/^\s*user[:\s]+/i, '');
  response = response.trim();

  return response;
}

/**
 * Generate layout description from text prompt using Qwen
 */
async function generateLayoutDescription(prompt: string): Promise<string> {
  if (!textGenerationPipeline) {
    throw new Error('Qwen model not loaded');
  }

  const tokenizer = textGenerationPipeline.tokenizer;
  if (tokenizer && typeof tokenizer.apply_chat_template === 'function') {
    const messages = [
      {
        role: 'user',
        content: `Generate a layout description for a 50x50 grid based on this request: "${prompt}"

Provide a JSON object with these fields:
- buildingDensity: "sparse" | "medium" | "dense"
- clustering: "clustered" | "distributed" | "random"
- grassRatio: number between 0.0 and 1.0
- buildingSizeHint: "small" | "medium" | "large"

Respond with only the JSON object, no additional text.`,
      },
    ];

    const formattedPrompt = tokenizer.apply_chat_template(messages, {
      tokenize: false,
      add_generation_prompt: true,
    });

    if (typeof formattedPrompt !== 'string') {
      throw new Error('Chat template did not return a string');
    }

    const result = await textGenerationPipeline(formattedPrompt, {
      max_new_tokens: 150,
      temperature: 0.7,
      do_sample: true,
    });

    let generatedText = '';
    if (Array.isArray(result) && result.length > 0) {
      const firstItem = result[0];
      if (typeof firstItem === 'object' && firstItem !== null && 'generated_text' in firstItem) {
        const generated = firstItem.generated_text;
        if (typeof generated === 'string') {
          generatedText = generated;
        }
      }
    } else if (typeof result === 'object' && result !== null && 'generated_text' in result) {
      const generated = result.generated_text;
      if (typeof generated === 'string') {
        generatedText = generated;
      }
    }

    return extractAssistantResponse(generatedText, formattedPrompt);
  }

  throw new Error('Chat template not available');
}

/**
 * Parse layout constraints from Qwen output
 */
function parseLayoutConstraints(output: string): LayoutConstraints {
  // Try JSON parsing first
  try {
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed: unknown = JSON.parse(jsonMatch[0]);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const entries: Array<[string, unknown]> = Object.entries(parsed);
        const densityEntry = entries.find(([key]) => key === 'buildingDensity');
        const clusteringEntry = entries.find(([key]) => key === 'clustering');
        const grassRatioEntry = entries.find(([key]) => key === 'grassRatio');
        const sizeEntry = entries.find(([key]) => key === 'buildingSizeHint');

        const density = densityEntry && typeof densityEntry[1] === 'string' ? densityEntry[1] : null;
        const clustering = clusteringEntry && typeof clusteringEntry[1] === 'string' ? clusteringEntry[1] : null;
        const grassRatio = grassRatioEntry && typeof grassRatioEntry[1] === 'number' ? grassRatioEntry[1] : null;
        const size = sizeEntry && typeof sizeEntry[1] === 'string' ? sizeEntry[1] : null;

        if (
          density &&
          (density === 'sparse' || density === 'medium' || density === 'dense') &&
          clustering &&
          (clustering === 'clustered' || clustering === 'distributed' || clustering === 'random') &&
          grassRatio !== null &&
          grassRatio >= 0 &&
          grassRatio <= 1 &&
          size &&
          (size === 'small' || size === 'medium' || size === 'large')
        ) {
          return {
            buildingDensity: density,
            clustering,
            grassRatio,
            buildingSizeHint: size,
          };
        }
      }
    }
  } catch {
    // JSON parsing failed, try regex
  }

  // Fallback to regex parsing
  const densityMatch = output.match(/buildingDensity["\s:]+(sparse|medium|dense)/i);
  const clusteringMatch = output.match(/clustering["\s:]+(clustered|distributed|random)/i);
  const grassRatioMatch = output.match(/grassRatio["\s:]+([\d.]+)/i);
  const sizeMatch = output.match(/buildingSizeHint["\s:]+(small|medium|large)/i);

  const density = densityMatch && (densityMatch[1] === 'sparse' || densityMatch[1] === 'medium' || densityMatch[1] === 'dense')
    ? densityMatch[1]
    : 'medium';
  const clustering = clusteringMatch && (clusteringMatch[1] === 'clustered' || clusteringMatch[1] === 'distributed' || clusteringMatch[1] === 'random')
    ? clusteringMatch[1]
    : 'random';
  const grassRatio = grassRatioMatch ? parseFloat(grassRatioMatch[1]) : 0.3;
  const size = sizeMatch && (sizeMatch[1] === 'small' || sizeMatch[1] === 'medium' || sizeMatch[1] === 'large')
    ? sizeMatch[1]
    : 'medium';

  return {
    buildingDensity: density,
    clustering,
    grassRatio: Math.max(0, Math.min(1, grassRatio)),
    buildingSizeHint: size,
  };
}

/**
 * Convert tile type to number for WASM
 */
function tileTypeToNumber(tileType: TileType): number {
  switch (tileType.type) {
    case 'grass':
      return 0;
    case 'floor':
      return 1;
    case 'wallNorth':
      return 2;
    case 'wallSouth':
      return 3;
    case 'wallEast':
      return 4;
    case 'wallWest':
      return 5;
    case 'cornerNE':
      return 6;
    case 'cornerNW':
      return 7;
    case 'cornerSE':
      return 8;
    case 'cornerSW':
      return 9;
    case 'door':
      return 10;
  }
}

/**
 * Convert layout constraints to pre-constraints
 */
function constraintsToPreConstraints(
  constraints: LayoutConstraints,
  width: number,
  height: number
): Array<{ x: number; y: number; tileType: TileType }> {
  const preConstraints: Array<{ x: number; y: number; tileType: TileType }> = [];

  // Generate grass regions based on grassRatio using Voronoi-like approach
  const numGrassSeeds = Math.floor((width * height * constraints.grassRatio) / 100);
  const grassSeeds: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < numGrassSeeds; i++) {
    grassSeeds.push({
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height),
    });
  }

  // Assign grass tiles based on closest seed
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minDist = Infinity;
      let closestSeed: { x: number; y: number } | null = null;

      for (const seed of grassSeeds) {
        const dist = Math.sqrt((x - seed.x) ** 2 + (y - seed.y) ** 2);
        if (dist < minDist) {
          minDist = dist;
          closestSeed = seed;
        }
      }

      if (closestSeed) {
        const distToClosest = Math.sqrt((x - closestSeed.x) ** 2 + (y - closestSeed.y) ** 2);
        const maxDist = Math.sqrt(width * width + height * height) * (1 - constraints.grassRatio);
        if (distToClosest < maxDist) {
          preConstraints.push({ x, y, tileType: { type: 'grass' } });
        }
      }
    }
  }

  // Place building seeds based on density and clustering
  const densityMap: Record<'sparse' | 'medium' | 'dense', number> = {
    sparse: 3,
    medium: 6,
    dense: 10,
  };

  const numBuildings = densityMap[constraints.buildingDensity];
  const buildingSeeds: Array<{ x: number; y: number }> = [];

  if (constraints.clustering === 'clustered') {
    // Place buildings in clusters
    const numClusters = Math.max(1, Math.floor(numBuildings / 3));
    for (let i = 0; i < numClusters; i++) {
      const clusterX = Math.floor(Math.random() * (width - 10)) + 5;
      const clusterY = Math.floor(Math.random() * (height - 10)) + 5;
      const buildingsInCluster = Math.floor(numBuildings / numClusters);
      for (let j = 0; j < buildingsInCluster; j++) {
        buildingSeeds.push({
          x: clusterX + Math.floor((Math.random() - 0.5) * 8),
          y: clusterY + Math.floor((Math.random() - 0.5) * 8),
        });
      }
    }
  } else {
    // Place buildings randomly
    for (let i = 0; i < numBuildings; i++) {
      buildingSeeds.push({
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height),
      });
    }
  }

  // Set floor tiles at building seed positions
  for (const seed of buildingSeeds) {
    if (seed.x >= 0 && seed.x < width && seed.y >= 0 && seed.y < height) {
      const isGrass = preConstraints.some((pc) => pc.x === seed.x && pc.y === seed.y);
      if (!isGrass) {
        preConstraints.push({ x: seed.x, y: seed.y, tileType: { type: 'floor' } });
      }
    }
  }

  return preConstraints;
}

/**
 * Generate layout from text prompt
 */
async function generateLayoutFromText(
  prompt: string,
  renderGrid: () => void,
  errorEl: HTMLElement | null,
  modelStatusEl: HTMLElement | null
): Promise<void> {
  if (!WASM_BABYLON_WFC.wasmModule) {
    if (errorEl) {
      errorEl.textContent = 'WASM module not loaded';
    }
    return;
  }

  try {
    if (modelStatusEl) {
      modelStatusEl.textContent = 'Loading Qwen model...';
    }

    await loadQwenModel((progress) => {
      if (modelStatusEl) {
        modelStatusEl.textContent = `Loading model: ${Math.floor(progress * 100)}%`;
      }
    });

    if (modelStatusEl) {
      modelStatusEl.textContent = 'Generating layout description...';
    }

    const layoutDescription = await generateLayoutDescription(prompt);

    if (modelStatusEl) {
      modelStatusEl.textContent = 'Parsing constraints...';
    }

    const constraints = parseLayoutConstraints(layoutDescription);

    if (modelStatusEl) {
      modelStatusEl.textContent = 'Applying constraints...';
    }

    WASM_BABYLON_WFC.wasmModule.clear_pre_constraints();

    const preConstraints = constraintsToPreConstraints(constraints, 50, 50);

    for (const preConstraint of preConstraints) {
      const tileNum = tileTypeToNumber(preConstraint.tileType);
      WASM_BABYLON_WFC.wasmModule.set_pre_constraint(preConstraint.x, preConstraint.y, tileNum);
    }

    if (modelStatusEl) {
      modelStatusEl.textContent = 'Generating layout...';
    }

    WASM_BABYLON_WFC.wasmModule.generate_layout();

    if (modelStatusEl) {
      modelStatusEl.textContent = 'Rendering...';
    }

    renderGrid();

    if (modelStatusEl) {
      modelStatusEl.textContent = 'Ready';
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    if (errorEl) {
      errorEl.textContent = `Error generating layout: ${errorMsg}`;
    }
    if (modelStatusEl) {
      modelStatusEl.textContent = 'Error';
    }
  }
}

/**
 * Initialize the babylon-wfc route
 */
export const init = async (): Promise<void> => {
  const errorEl = document.getElementById('error');
  const canvasEl = document.getElementById('renderCanvas');
  
  if (!canvasEl) {
    throw new Error('renderCanvas element not found');
  }
  
  if (!(canvasEl instanceof HTMLCanvasElement)) {
    throw new Error('renderCanvas element is not an HTMLCanvasElement');
  }
  
  const canvas = canvasEl;
  
  // Initialize WASM module
  try {
    const wasmModule = await loadWasmModule<WasmModuleBabylonWfc>(
      getInitWasm,
      validateBabylonWfcModule
    );
    
    if (!wasmModule) {
      throw new WasmInitError('WASM module failed validation');
    }
    
    WASM_BABYLON_WFC.wasmModule = wasmModule;
    
    // Set up JavaScript random function for WASM
    const globalObj: { [key: string]: unknown } = globalThis;
    globalObj.js_random = (): number => Math.random();
  } catch (error) {
    if (errorEl) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (error instanceof WasmLoadError) {
        errorEl.textContent = `Failed to load WASM module: ${errorMsg}`;
      } else if (error instanceof WasmInitError) {
        errorEl.textContent = `WASM module initialization failed: ${errorMsg}`;
      } else if (error instanceof Error) {
        errorEl.textContent = `Error: ${errorMsg}`;
        if (error.stack) {
          errorEl.textContent += `\n\nStack: ${error.stack}`;
        }
        if ('cause' in error && error.cause) {
          const causeMsg = error.cause instanceof Error 
            ? error.cause.message 
            : typeof error.cause === 'string' 
              ? error.cause 
              : JSON.stringify(error.cause);
          errorEl.textContent += `\n\nCause: ${causeMsg}`;
        }
      } else {
        errorEl.textContent = 'Unknown error loading WASM module';
      }
    }
    throw error;
  }
  
  // Initialize BabylonJS engine
  const engine = new Engine(canvas, true);
  
  // Create scene
  const scene = new Scene(engine);
  
  // Set up camera - directly above the center of the grid
  // Grid is 50x50 with offset positioning, so center is at (0, 0, 0)
  // Camera positioned 50 meters directly above, looking straight down
  const gridCenter = new Vector3(0, 0, 0);
  const camera = new ArcRotateCamera(
    'camera',
    0,             // Alpha: horizontal rotation (doesn't matter when looking straight down)
    0,             // Beta: 0 = straight down (top view)
    50,            // Radius: 50 meters above the grid center
    gridCenter,    // Target: center of the grid (0, 0, 0)
    scene
  );
  camera.attachControl(canvas, true);
  
  // Set up lighting
  const hemisphericLight = new HemisphericLight('hemisphericLight', new Vector3(0, 1, 0), scene);
  hemisphericLight.intensity = 0.7;
  
  const directionalLight = new DirectionalLight('directionalLight', new Vector3(-1, -1, -1), scene);
  directionalLight.intensity = 0.5;
  
  // Create base meshes for each tile type (11 types)
  // **Learning Point**: We create one base mesh per tile type, then use
  // instancing to create 2500 instances (50x50 grid) efficiently.
  const baseMeshes = new Map<TileType['type'], Mesh>();
  const materials = new Map<TileType['type'], StandardMaterial>();
  
  const tileTypes: TileType[] = [
    { type: 'grass' },
    { type: 'floor' },
    { type: 'wallNorth' },
    { type: 'wallSouth' },
    { type: 'wallEast' },
    { type: 'wallWest' },
    { type: 'cornerNE' },
    { type: 'cornerNW' },
    { type: 'cornerSE' },
    { type: 'cornerSW' },
    { type: 'door' },
  ];
  
  for (const tileType of tileTypes) {
    const mesh = Mesh.CreateBox(`base_${tileType.type}`, 1, scene);
    mesh.isVisible = false;
    
    const material = new StandardMaterial(`material_${tileType.type}`, scene);
    material.diffuseColor = getTileColor(tileType);
    material.specularColor = new Color3(0.1, 0.1, 0.1);
    mesh.material = material;
    
    baseMeshes.set(tileType.type, mesh);
    materials.set(tileType.type, material);
  }
  
  // Store instances for cleanup
  const instances: InstancedMesh[] = [];
  
  /**
   * Render the WFC grid
   * 
   * **Learning Point**: This function:
   * 1. Clears existing instances
   * 2. Generates new layout from WASM
   * 3. Creates instanced meshes for each tile
   * 4. Positions instances based on grid coordinates
   */
  const renderGrid = (): void => {
    // Clear existing instances
    for (const instance of instances) {
      const disposeMethod = instance.dispose.bind(instance);
      disposeMethod();
    }
    instances.length = 0;
    
    if (!WASM_BABYLON_WFC.wasmModule) {
      return;
    }
    
    // Generate new layout
    const generateLayout = WASM_BABYLON_WFC.wasmModule.generate_layout.bind(WASM_BABYLON_WFC.wasmModule);
    generateLayout();
    
    // Create instances for each tile
    const gridSize = 50;
    const tileSpacing = 1.1;
    const offset = -(gridSize * tileSpacing) / 2;
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const getTileAt = WASM_BABYLON_WFC.wasmModule.get_tile_at.bind(WASM_BABYLON_WFC.wasmModule);
        const tileNum = getTileAt(x, y);
        const tileType = tileTypeFromNumber(tileNum);
        
        if (!tileType) {
          continue;
        }
        
        const baseMesh = baseMeshes.get(tileType.type);
        if (!baseMesh) {
          continue;
        }
        
        const instance = baseMesh.createInstance(`tile_${x}_${y}`);
        instance.position.x = offset + x * tileSpacing;
        instance.position.z = offset + y * tileSpacing;
        instance.position.y = 0;
        
        instances.push(instance);
      }
    }
  };
  
  // Initial render
  renderGrid();
  
  // Set up Babylon 2D UI
  const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');
  
  // Recompute button
  const recomputeButton = Button.CreateSimpleButton('recomputeButton', 'Recompute Wave Collapse');
  recomputeButton.width = '200px';
  recomputeButton.height = '40px';
  recomputeButton.color = 'white';
  recomputeButton.background = 'green';
  recomputeButton.top = '10px';
  recomputeButton.left = '10px';
  recomputeButton.onPointerClickObservable.add(() => {
    if (WASM_BABYLON_WFC.wasmModule) {
      WASM_BABYLON_WFC.wasmModule.clear_pre_constraints();
      const clearLayout = WASM_BABYLON_WFC.wasmModule.clear_layout.bind(WASM_BABYLON_WFC.wasmModule);
      clearLayout();
      renderGrid();
    }
  });
  advancedTexture.addControl(recomputeButton);
  
  // Fullscreen button
  const fullscreenButton = Button.CreateSimpleButton('fullscreenButton', 'Fullscreen');
  fullscreenButton.width = '150px';
  fullscreenButton.height = '40px';
  fullscreenButton.color = 'white';
  fullscreenButton.background = 'blue';
  fullscreenButton.top = '10px';
  fullscreenButton.left = '220px';
  fullscreenButton.onPointerClickObservable.add(() => {
    engine.enterFullscreen(false);
  });
  advancedTexture.addControl(fullscreenButton);
  
  // Exit fullscreen button (initially hidden)
  const exitFullscreenButton = Button.CreateSimpleButton('exitFullscreenButton', 'Exit Fullscreen');
  exitFullscreenButton.width = '150px';
  exitFullscreenButton.height = '40px';
  exitFullscreenButton.color = 'white';
  exitFullscreenButton.background = 'red';
  exitFullscreenButton.top = '10px';
  exitFullscreenButton.left = '220px';
  exitFullscreenButton.isVisible = false;
  exitFullscreenButton.onPointerClickObservable.add(() => {
    engine.exitFullscreen();
  });
  advancedTexture.addControl(exitFullscreenButton);
  
  // Handle fullscreen changes
  const handleFullscreenChange = (): void => {
    const isFullscreen = engine.isFullscreen;
    fullscreenButton.isVisible = !isFullscreen;
    exitFullscreenButton.isVisible = isFullscreen;
  };
  
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
  
  // Start render loop
  engine.runRenderLoop(() => {
    scene.render();
  });
  
  // Handle window resize
  window.addEventListener('resize', () => {
    engine.resize();
  });

  // Text input and generate button (HTML elements)
  const promptInputEl = document.getElementById('layoutPromptInput');
  const generateFromTextBtn = document.getElementById('generateFromTextBtn');
  const modelStatusEl = document.getElementById('modelStatus');

  if (generateFromTextBtn && promptInputEl) {
    generateFromTextBtn.addEventListener('click', () => {
      const prompt = promptInputEl instanceof HTMLInputElement ? promptInputEl.value.trim() : '';
      if (prompt) {
        generateLayoutFromText(prompt, renderGrid, errorEl, modelStatusEl).catch((error) => {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          if (errorEl) {
            errorEl.textContent = `Error: ${errorMsg}`;
          }
        });
      }
    });
  }
};

