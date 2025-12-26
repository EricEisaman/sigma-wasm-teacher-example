# Sigma WASM - WebAssembly Demos

A collection of interactive WebAssembly demos showcasing Rust-compiled WASM modules integrated with modern web technologies. This project demonstrates various use cases including pathfinding algorithms, computer vision, natural language processing, and generative art.

Check out the live demos [here](https://sigma-wasm.onrender.com/)!

## Demo Endpoints

### A* Pathfinding (`/astar`)

An interactive pathfinding algorithm visualization built with Rust and WebAssembly. This demo provides real-time visualization of the A* pathfinding algorithm with interactive controls.

**Technology Stack:**
- Rust/WASM for pathfinding logic
- Canvas-based rendering
- Real-time game loop with `requestAnimationFrame`

**Features:**
- Real-time pathfinding visualization on procedurally generated maps
- Interactive controls: arrow keys or mouse to move the starting point
- Spacebar to randomize the map
- FPS counter and path count display
- Multi-layer canvas rendering system

**WASM Module:** `wasm-astar`

**Key Files:**
- Route: [`src/routes/astar.ts`](src/routes/astar.ts)
- Rust Source: [`wasm-astar/src/lib.rs`](wasm-astar/src/lib.rs)
- HTML: [`pages/astar.html`](pages/astar.html)

This demo is a port of an A* implementation by [Jacob Reichert](https://github.com/jacobdeichert/wasm-astar), demonstrating how to manage game state in Rust using global mutexes and handle the complexities of WASM-JS interop.

---

### SmolVLM-500M (`/preprocess-smolvlm-500m`)

Visual Question Answering (VQA) and Image Captioning using the SmolVLM-500M-Instruct model. This demo showcases client-side vision-language AI with high-performance image preprocessing.

**Technology Stack:**
- Rust/WASM for image preprocessing (Lanczos3 resizing)
- ONNX Runtime Web for model inference
- Hugging Face model hosting

**Features:**
- Image preprocessing with WASM (resizing to 224×224 for model input)
- Visual Question Answering: answer questions about image content
- Image Captioning: generate descriptive text from images
- Real-time filter preview with sliders (contrast, cinematic effects)
- Webcam support for live image capture
- Model caching for faster subsequent loads

**WASM Module:** `wasm-preprocess`

**Model:** SmolVLM-500M-Instruct from Hugging Face

**Key Files:**
- Route: [`src/routes/preprocess-smolvlm-500m.ts`](src/routes/preprocess-smolvlm-500m.ts)
- Model Integration: [`src/models/smolvlm.ts`](src/models/smolvlm.ts)
- HTML: [`pages/preprocess-smolvlm-500m.html`](pages/preprocess-smolvlm-500m.html)

The WASM preprocessing module handles efficient image decoding and resizing, preparing images for the vision encoder. The model runs entirely client-side using ONNX Runtime Web with WASM acceleration.

---

### SmolVLM-256M (`/preprocess-smolvlm-256m`)

A faster, smaller variant of the SmolVLM demo using the 256M parameter model. Optimized for speed while maintaining similar capabilities to the 500M version.

**Technology Stack:**
- Rust/WASM for image preprocessing
- ONNX Runtime Web for model inference
- SmolVLM-256M model (512×512 input size)

**Features:**
- Same VQA and captioning capabilities as 500M version
- Faster inference due to smaller model size
- Optimized preprocessing pipeline
- Real-time filters and webcam support
- Lower memory footprint

**WASM Module:** `wasm-preprocess-256m`

**Model:** SmolVLM-256M (uses 512×512 input resolution)

**Key Files:**
- Route: [`src/routes/preprocess-smolvlm-256m.ts`](src/routes/preprocess-smolvlm-256m.ts)
- Model Integration: [`src/models/smolvlm-256m.ts`](src/models/smolvlm-256m.ts)
- HTML: [`pages/preprocess-smolvlm-256m.html`](pages/preprocess-smolvlm-256m.html)

This demo is ideal for devices with limited memory or when faster response times are preferred. The preprocessing pipeline is specifically optimized for the 512×512 input size.

---

### ViT-GPT2 Image Captioning (`/image-captioning`)

Image captioning using a Vision Transformer (ViT) encoder with GPT-2 decoder, powered by Transformers.js. This demo showcases a different approach to vision-language models compared to SmolVLM.

**Technology Stack:**
- Rust/WASM for image preprocessing and filters
- Transformers.js for model inference
- ViT-GPT2 model architecture

**Features:**
- Image captioning: generate natural language descriptions
- WASM preprocessing with multiple filter options (contrast, cinematic, sepia)
- Real-time filter preview with sliders
- Webcam support for live capture
- Client-side inference with no server calls

**WASM Module:** `wasm-preprocess-image-captioning`

**Model:** ViT-GPT2 via Transformers.js

**Key Files:**
- Route: [`src/routes/image-captioning.ts`](src/routes/image-captioning.ts)
- Model Integration: [`src/models/image-captioning.ts`](src/models/image-captioning.ts)
- HTML: [`pages/image-captioning.html`](pages/image-captioning.html)

The ViT-GPT2 model combines a Vision Transformer for image understanding with GPT-2 for text generation, providing a different architectural approach compared to the SmolVLM models. All processing happens client-side using WebAssembly acceleration.

---

### Function Calling Agent (`/function-calling`)

A client-side autonomous agent with local LLM inference and function calling capabilities. This demo showcases how to build goal-oriented agents that can use tools to accomplish tasks.

**Technology Stack:**
- Transformers.js for LLM inference
- Rust/WASM for tool execution
- DistilGPT-2 model for text generation

**Features:**
- Goal-oriented agent execution: describe a goal and the agent plans steps
- Function calling: agent can call WASM tools (calculate, process_text, get_stats)
- Human-in-the-loop clarification: agent asks for clarification when needed
- Step-by-step execution display showing reasoning process
- Tool execution results feed back into agent reasoning

**WASM Module:** `wasm-agent-tools`

**Model:** DistilGPT-2 via Transformers.js

**Available Tools:**
- `calculate(expression)`: Evaluate mathematical expressions
- `process_text(text, operation)`: Text processing (uppercase, lowercase, reverse, length, word_count)
- `get_stats(data)`: Statistical analysis of data arrays

**Key Files:**
- Route: [`src/routes/function-calling.ts`](src/routes/function-calling.ts)
- Model Integration: [`src/models/function-calling.ts`](src/models/function-calling.ts)
- HTML: [`pages/function-calling.html`](pages/function-calling.html)

The agent analyzes the user's goal, decides which tools to use, executes them via WASM, and uses the results to generate a final response. All processing happens client-side, demonstrating fully autonomous agents running in the browser.

---

### Fractal Chat (`/fractal-chat`)

An interactive chat interface that generates fractal images based on keywords in your messages. When you mention a fractal type, a corresponding image is generated and displayed. Otherwise, the chat model responds conversationally.

**Technology Stack:**
- Rust/WASM for fractal generation
- Transformers.js for chat model inference
- Qwen1.5-0.5B-Chat model

**Features:**
- Keyword detection for fractal generation
- 8 fractal types: Mandelbrot, Julia, Buddhabrot, Orbit-Trap, Gray-Scott, L-System, Flames, Strange Attractors
- Conversational AI responses when no fractal keyword is detected
- Real-time fractal generation (512×512 images)
- Chat history with images embedded in conversation

**WASM Module:** `wasm-fractal-chat`

**Model:** Qwen1.5-0.5B-Chat via Transformers.js

**Fractal Keywords:**
- `fractal` - Random fractal from all types
- `mandelbrot` - Classic Mandelbrot Set
- `julia` - Julia Sets
- `buddhabrot` or `nebulabrot` - Buddhabrot/Nebulabrot
- `orbit-trap` - Orbit-Trap Fractals
- `gray-scott`, `reaction`, or `diffusion` - Gray-Scott Reaction-Diffusion
- `l-system`, `tree`, or `plant` - L-System Fractals
- `flames` - Fractal Flames
- `strange`, `attractors`, `lorenz`, `clifford`, or `de jong` - Strange Attractors

**Key Files:**
- Route: [`src/routes/fractal-chat.ts`](src/routes/fractal-chat.ts)
- Rust Source: [`wasm-fractal-chat/src/lib.rs`](wasm-fractal-chat/src/lib.rs)
- HTML: [`pages/fractal-chat.html`](pages/fractal-chat.html)

The demo combines generative art with conversational AI, creating a unique interactive experience. Fractals are generated in real-time using optimized Rust algorithms compiled to WASM, while the chat model provides natural language interaction.

---

## Technical Architecture

### Technology Stack

**Core Technologies:**
- **Rust**: Systems programming language compiled to WebAssembly
- **TypeScript**: Type-safe frontend development
- **Vite**: Fast build tool and dev server
- **wasm-bindgen**: Rust-WASM interop

**AI/ML Frameworks:**
- **ONNX Runtime Web**: For SmolVLM models (WASM/WebGPU acceleration)
- **Transformers.js**: For ViT-GPT2, DistilGPT-2, and Qwen models
- **@huggingface/tokenizers**: Tokenization for language models

**Build & Deployment:**
- **Docker**: Containerized builds and deployment
- **nginx**: Static file serving in production
- **Render.com**: Hosting platform

### WASM Modules Organization

The project uses a Rust workspace with multiple WASM crates, each compiled independently:

- `wasm-astar`: Pathfinding algorithm and game state management
- `wasm-preprocess`: Image preprocessing for SmolVLM-500M (224×224)
- `wasm-preprocess-256m`: Image preprocessing for SmolVLM-256M (512×512)
- `wasm-preprocess-image-captioning`: Image preprocessing and filters for ViT-GPT2
- `wasm-agent-tools`: Tool functions for the agent (calculate, process_text, get_stats)
- `wasm-fractal-chat`: Fractal generation algorithms

Each module is built using `wasm-bindgen` and optimized with `wasm-opt` for smaller binary sizes.

### Routing System

The application uses a client-side router (`src/main.ts`) that:
- Detects the current pathname
- Lazy-loads the appropriate route handler
- Initializes the corresponding WASM module and UI
- Handles errors gracefully with user-friendly messages

Routes are defined in `src/main.ts` and each route has:
- A TypeScript route handler (`src/routes/*.ts`)
- An HTML page (`pages/*.html`)
- A corresponding WASM module

### Model Loading Strategies

**ONNX Runtime Models (SmolVLM):**
- Models are downloaded from Hugging Face
- Cached using the Cache API for faster subsequent loads
- CORS proxies are used when direct access fails
- Progress tracking during download and initialization

**Transformers.js Models:**
- Models are loaded on-demand via Transformers.js
- Automatic quantization and optimization
- WebAssembly acceleration for inference
- Model files are cached by the browser

**Error Handling:**
- Graceful degradation if models fail to load
- Detailed error messages for debugging
- Fallback to preprocessing-only mode when models unavailable

---

## Building

### Local Development (Without Docker)

#### Quick Setup

Run the setup script to install all required dependencies:

```bash
./scripts/setup-local.sh
```

This will:
- Check for Rust, Node.js, and npm
- Install wasm-bindgen-cli if missing
- Install npm dependencies
- Set up the wasm32-unknown-unknown target

#### Manual Setup

If you prefer to set up manually:

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add wasm32 target
rustup target add wasm32-unknown-unknown

# Install wasm-bindgen-cli
cargo install wasm-bindgen-cli --version 0.2.87

# Install wasm-opt (optional but recommended)
# On macOS: brew install binaryen
# On Debian/Ubuntu: sudo apt-get install binaryen
# On Alpine: apk add binaryen
# Or via npm: npm install -g wasm-opt

# Install npm dependencies
npm install
```

#### Development

Start the development server:

```bash
# Option 1: Use the dev script
./scripts/dev-local.sh

# Option 2: Use npm directly
npm run dev
```

#### Production Build

Build for production:

```bash
# Build WASM and frontend
npm run build

# Or build WASM only
npm run build:wasm

# Preview production build
npm run preview
```

### Docker Build

#### Build Docker Image

```bash
# Build the Docker image
npm run build:docker
# Or directly:
docker build -t sigma-wasm .
```

#### Run Docker Container

```bash
# Run the container
docker run -p 3000:80 sigma-wasm

# Access at http://localhost:3000
```

#### Docker Compose (Optional)

If you have `docker-compose.yml`:

```bash
docker-compose up
```

## Deployment

### Render.com Deployment

This project is configured for automatic deployment on Render.com using Docker.

#### Prerequisites

1. A Render.com account
2. A Git repository (GitHub, GitLab, or Bitbucket)
3. The repository connected to Render.com

#### Automatic Deployment

1. **Push your code to Git** - Ensure `render.yaml` is in the root directory
2. **Connect to Render** - In Render dashboard, create a new "Blueprint" service
3. **Render will automatically:**
   - Detect the `render.yaml` file
   - Build using the Dockerfile
   - Deploy the service
   - Set up auto-deploy from your Git repository

#### Manual Configuration

If you prefer to configure manually:

1. Create a new **Web Service** in Render
2. Connect your Git repository
3. Set the following:
   - **Environment**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Context**: `.`
   - **Build Command**: (auto-detected from Dockerfile)
   - **Start Command**: (auto-detected from Dockerfile)

#### Environment Variables

Environment variables can be set in:
- `render.yaml` (for static values)
- Render.com dashboard (for secrets and dynamic values)

See `.env.example` for available environment variables.

#### Build Configuration

The `render.yaml` file includes:
- Build filters (only rebuild on relevant file changes)
- Health check configuration
- Auto-deploy settings
- Environment variables

### Other Deployment Options

#### Static File Hosting

After building with `npm run build`, the `dist/` directory contains static files that can be served by:
- Any static file server (nginx, Apache, etc.)
- CDN services (Cloudflare, AWS CloudFront, etc.)
- Static hosting (Netlify, Vercel, GitHub Pages, etc.)

```bash
# Build the project
npm run build

# The dist/ directory contains all static files
# Serve with any static file server:
npx serve dist
```

## Environment Variables

See `.env.example` for a template of available environment variables.

### Build-time Variables

- `NODE_ENV` - Set to `production` for production builds

### Runtime Variables

Currently, no runtime environment variables are required. Add them to `.env.example` and `render.yaml` as needed.

## Troubleshooting

### Build Issues

**Error: `cargo: command not found`**
- Install Rust: https://rustup.rs/
- Ensure Rust is in your PATH

**Error: `wasm-bindgen: command not found`**
- Install with: `cargo install wasm-bindgen-cli --version 0.2.87`
- Ensure `~/.cargo/bin` is in your PATH

**Error: `wasm-opt: command not found`**
- This is optional but recommended
- Install via package manager or npm (see setup instructions above)
- Build will still work without it, but WASM won't be optimized

**Docker build fails**
- Ensure Docker is running
- Check that all required files are present
- Review Docker build logs for specific errors

### Runtime Issues

**WASM module not loading**
- Check browser console for errors
- Ensure `pkg/` directory is accessible
- Verify wasm-bindgen output files are present

**404 errors for assets**
- Ensure Vite build completed successfully
- Check that `dist/` directory contains all files
- Verify nginx configuration (if using Docker)

**Model loading fails**
- Check browser console for CORS errors
- Verify internet connection (models download from Hugging Face)
- Try clearing browser cache
- Check that CORS proxies are accessible

### Render.com Issues

**Deployment fails**
- Check Render build logs
- Verify `render.yaml` syntax
- Ensure Dockerfile is valid
- Check that all required files are in the repository

**Service not starting**
- Check Render service logs
- Verify health check endpoint
- Ensure port 80 is exposed in Dockerfile

## Project Structure

```
sigma-wasm/
├── Dockerfile              # Multi-stage Docker build
├── .dockerignore           # Docker build exclusions
├── render.yaml             # Render.com configuration
├── .env.example            # Environment variables template
├── Cargo.toml              # Rust workspace configuration
├── package.json            # Node.js dependencies
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── scripts/
│   ├── build.sh            # WASM build script
│   ├── build-wasm.sh       # WASM build script
│   ├── setup-local.sh      # Local setup script
│   └── dev-local.sh        # Local dev server script
├── src/
│   ├── main.ts             # TypeScript entry point and router
│   ├── types.ts            # TypeScript type definitions
│   ├── styles.css          # Global styles
│   ├── routes/             # Route handlers for each demo
│   │   ├── astar.ts
│   │   ├── preprocess-smolvlm-500m.ts
│   │   ├── preprocess-smolvlm-256m.ts
│   │   ├── image-captioning.ts
│   │   ├── function-calling.ts
│   │   └── fractal-chat.ts
│   ├── models/             # Model integration code
│   │   ├── smolvlm.ts
│   │   ├── smolvlm-256m.ts
│   │   ├── image-captioning.ts
│   │   └── function-calling.ts
│   ├── wasm/               # WASM loader utilities
│   │   ├── loader.ts
│   │   └── types.ts
│   └── [rust modules]      # Shared Rust source (if any)
├── pages/                  # HTML pages for each demo
│   ├── astar.html
│   ├── preprocess-smolvlm-500m.html
│   ├── preprocess-smolvlm-256m.html
│   ├── image-captioning.html
│   ├── function-calling.html
│   └── fractal-chat.html
├── wasm-astar/             # A* pathfinding WASM crate
│   ├── Cargo.toml
│   └── src/lib.rs
├── wasm-preprocess/        # Image preprocessing WASM crate (500M)
│   ├── Cargo.toml
│   └── src/lib.rs
├── wasm-preprocess-256m/   # Image preprocessing WASM crate (256M)
│   ├── Cargo.toml
│   └── src/lib.rs
├── wasm-preprocess-image-captioning/  # Image preprocessing WASM crate (ViT-GPT2)
│   ├── Cargo.toml
│   └── src/lib.rs
├── wasm-agent-tools/       # Agent tools WASM crate
│   ├── Cargo.toml
│   └── src/lib.rs
├── wasm-fractal-chat/      # Fractal generation WASM crate
│   ├── Cargo.toml
│   └── src/lib.rs
├── pkg/                    # Compiled WASM modules (generated)
│   ├── wasm_astar/
│   ├── wasm_preprocess/
│   ├── wasm_preprocess_256m/
│   ├── wasm_preprocess_image_captioning/
│   ├── wasm_agent_tools/
│   └── wasm_fractal_chat/
└── dist/                   # Production build output (gitignored)
```
