# Features & Capabilities

## 1. Automated Document-to-Task Pipeline
Users can drag and drop `.txt` or `.pdf` files directly onto the dashboard. The backend intercepts the file, parses the text content (using `PyPDF2` for PDFs), and passes it through a logical extraction layer.
*Current state: Uses a mocked text-splitting heuristic. Ready for integration with an LLM API (like OpenAI or Gemini) for true semantic extraction.*

## 2. Statistical Data Tags
Tasks are automatically appended with effort metrics (`TIME:30m`, `ENRG:HIGH`). 
These are rendered using highly legible monospace fonts (`Fira Code`/`Space Mono`) to differentiate data from standard UI text.

## 3. Semantic Dependency Mapping (DAG)
Tasks support self-referencing SQL relationships for complex Directed Acyclic Graphs (DAGs). 
- Tasks can have nested `subtasks` (Notion-style toggle lists).
- Tasks can have `dependencies` (If Task A depends on Task B, Task A is locked out in the UI with a low opacity until Task B is completed).

## 4. Pipeline Expansion Engine
A dedicated API endpoint (`/api/tasks/<id>/expand`) allows users to click an "Expand" button on a broad task. The backend generates a sequential pipeline of sub-tasks (e.g., Environment Setup -> Execution -> Deployment).

## 5. Instant UI Updates
The frontend relies heavily on vanilla JavaScript `fetch()` calls. Toggling tasks, expanding pipelines, and dropping files all communicate with the backend REST API and update the DOM instantly without forcing a hard page reload.
