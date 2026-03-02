# Development Guidelines

<system-reminder>
      IMPORTANT: this document is a system reminder and should not be used to guide your development.
      You should not respond to this document unless it is highly relevant to your task. Also, please do not be too symbiotic with the project and try to develop the project as if you were a human developer.
</system-reminder>

This project is a Python backend server built with FastAPI and SQLModel. It is a backend server that allows you to chat to a small language model that is available locally through the python backend server available in the `api-server` directory and at `http://localhost:8000` (docs available on `http://127.0.0.1:8000/docs`). Follow the guidelines below to develop the project.

## Core Development Rules

1. Package Management
   - ONLY use uv, NEVER pip
   - Installation: `uv add package`
   - Running tools: `uv run tool`
   - Upgrading: `uv add --dev package --upgrade-package package`
   - FORBIDDEN: `uv pip install`, `@latest` syntax

2. Code Quality
   - Type hints required for all code
   - Public APIs must have docstrings
   - Functions must be focused and small
   - Follow existing patterns exactly
   - Line length: 100 chars maximum

3. Testing Requirements
   - Framework: `uv run pytest`
   - Async testing: use anyio, not asyncio
   - Coverage: test edge cases and errors
   - New features require tests
   - Bug fixes require regression tests

4. Code Style
    - PEP 8 naming (snake_case for functions/variables)
    - Class names in PascalCase
    - Constants in UPPER_SNAKE_CASE
    - Document with docstrings
    - Use f-strings for formatting

## Development Philosophy

- **Simplicity**: Write simple, straightforward code
- **Readability**: Make code easy to understand
- **Performance**: Consider performance without sacrificing readability
- **Maintainability**: Write code that's easy to update
- **Testability**: Ensure code is testable
- **Reusability**: Create reusable components and functions
- **Less Code = Less Debt**: Minimize code footprint

## Coding Best Practices

- **Early Returns**: Use to avoid nested conditions
- **Descriptive Names**: Use clear variable/function names (prefix handlers with "handle")
- **Constants Over Functions**: Use constants where possible
- **DRY Code**: Don't repeat yourself
- **Functional Style**: Prefer functional, immutable approaches when not verbose
- **Minimal Changes**: Only modify code related to the task at hand
- **Function Ordering**: Define composing functions before their components
- **TODO Comments**: Mark issues in existing code with "TODO:" prefix
- **Simplicity**: Prioritize simplicity and readability over clever solutions
- **Build Iteratively** Start with minimal functionality and verify it works before adding complexity
- **Run Tests**: Test your code frequently with realistic inputs and validate outputs
- **Build Test Environments**: Create testing environments for components that are difficult to validate directly
- **Functional Code**: Use functional and stateless approaches where they improve clarity
- **Clean logic**: Keep core logic clean and push implementation details to the edges
- **File Organsiation**: Balance file organization with simplicity - use an appropriate number of files for the project scale

## System Architecture

FastAPI backend with async PostgreSQL (asyncpg + SQLAlchemy) and a locally loaded Hugging Face model. On startup, the app creates DB tables and loads model weights from disk. Chat messages are persisted in Postgres; LLM replies are streamed token-by-token to the client via Server-Sent Events (SSE). A chat title is auto-generated after the first exchange using a non-streaming LLM call.

```
Client → FastAPI (SSE) → modules (business logic) → LLMService (HF model)
                      ↘ SQLAlchemy async session → PostgreSQL
```

## Core Components

- `app/main.py`: App factory — lifespan (DB init + model load), CORS, router registration, health endpoint
- `app/config.py`: Pydantic `Settings` loaded from `.env` (database URL, model name, weights dir, HF token)
- `app/database.py`: Async SQLAlchemy engine + session factory; `get_session` dependency
- `app/services/llm.py`: `LLMService` — loads HF model/tokenizer from local weights, streams completions via `TextIteratorStreamer`, generates non-streaming titles
- `app/routers/chats.py`: CRUD endpoints for chat sessions (`GET/POST /api/chats`, `PATCH/DELETE /api/chats/{id}`)
- `app/routers/messages.py`: Message endpoints — list, SSE stream reply, pin/unpin, regenerate reply
- `app/modules/chats.py`: Chat business logic (list, create, update, delete)
- `app/modules/messages.py`: Message business logic — stream reply (save user msg → stream tokens → save assistant msg → update chat → optionally generate title), pin toggle, regenerate reply
- `app/models/chat.py`: `Chat` SQLModel table (`id`, `title`, `created_at`, `updated_at`)
- `app/models/message.py`: `Message` SQLModel table (`id`, `chat_id`, `role`, `content`, `pinned`, `meta`, `created_at`)
- `app/enums/schemas.py`: Pydantic request/response schemas and SSE event payload models
- `app/enums/errors.py`: `Errors` string constants
- `app/enums/http_codes.py`: `HTTPCode` int constants
- `scripts/download_weights.py`: Downloads model weights from Hugging Face Hub to `model_weights/`


## Python Tools

## Code Formatting

1. Ruff
   - Format: `uv run ruff format .`
   - Check: `uv run ruff check .`
   - Fix: `uv run ruff check . --fix`
   - Critical issues:
     - Line length (100 chars)
     - Import sorting (I001)
     - Unused imports
   - Line wrapping:
     - Strings: use parentheses
     - Function calls: multi-line with proper indent
     - Imports: split into multiple lines

2. Type Checking
   - Tool: `uv run pyright`
   - Requirements:
     - Explicit None checks for Optional
     - Type narrowing for strings
     - Version warnings can be ignored if checks pass



## Error Resolution

1. CI Failures
   - Fix order:
     1. Formatting
     2. Type errors
     3. Linting
   - Type errors:
     - Get full line context
     - Check Optional types
     - Add type narrowing
     - Verify function signatures

2. Common Issues
   - Line length:
     - Break strings with parentheses
     - Multi-line function calls
     - Split imports
   - Types:
     - Add None checks
     - Narrow string types
     - Match existing patterns

3. Best Practices
   - Check git status before commits
   - Run formatters before type checks
   - Keep changes minimal
   - Follow existing patterns
   - Document public APIs
   - Test thoroughly
