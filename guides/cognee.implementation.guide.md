# Cognee Implementation Guide

## Complete Documentation for AI Memory in Your Application

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Core Concepts & Architecture](#core-concepts--architecture)
4. [Basic Usage (Quick Start)](#basic-usage-quick-start)
5. [Configuration](#configuration)
6. [Search Types](#search-types)
7. [Custom Tasks & Pipelines](#custom-tasks--pipelines)
8. [Multi-User & Multi-Tenant Mode](#multi-user--multi-tenant-mode)
9. [Database Configuration](#database-configuration)
10. [MCP Server Integration](#mcp-server-integration)
11. [LangGraph Integration](#langgraph-integration)
12. [Deployment Options](#deployment-options)
13. [Best Practices](#best-practices)

---

## Overview

**Cognee** is an open-source AI memory engine that transforms raw data into persistent, dynamic memory for AI agents. It combines **vector search** with **graph databases** to make your data both searchable by meaning and connected by relationships.

### Key Features

- **ECL Pipeline**: Extract → Cognify → Load architecture
- **Dual Storage**: Vector embeddings + Knowledge graphs
- **92.5% accuracy** vs traditional RAG's 60%
- **30+ data source** support (text, files, images, audio)
- **Modular design**: Custom tasks, pipelines, DataPoints
- **Multi-tenant support**: Session-based isolation

### Core Operations

| Operation              | Description                                |
| ---------------------- | ------------------------------------------ |
| `add()`                | Ingest data into Cognee                    |
| `cognify()`            | Generate knowledge graph from data         |
| `memify()`             | Optional semantic enrichment (coming soon) |
| `search()`             | Query with various search types            |
| `prune.prune_data()`   | Reset data                                 |
| `prune.prune_system()` | Reset system metadata                      |

---

## Installation

### Requirements

- Python 3.9 – 3.12 (3.10 – 3.13 for newer versions)
- Virtual environment recommended

### Basic Installation

```bash
# Create virtual environment
uv venv && source .venv/bin/activate

# Install Cognee (basic)
pip install cognee

# Or with specific extras
pip install cognee[ollama]      # Local LLM support
pip install cognee[neo4j]       # Neo4j graph database
pip install cognee[postgres]    # PostgreSQL support
pip install cognee[gemini]      # Google Gemini
pip install cognee[anthropic]   # Anthropic Claude
pip install cognee[baml]        # BAML structured output
```

### Available Extras

```
anthropic, api, aws, baml, chromadb, codegraph, debug, deepeval,
dev, distributed, dlt, docling, docs, evals, graphiti, groq,
huggingface, langchain, llama-index, mistral, monitoring, neo4j,
neptune, notebook, ollama, postgres, postgres-binary, posthog,
redis, scraping
```

---

## Core Concepts & Architecture

### Storage Architecture

Cognee uses three complementary storage systems:

```
┌─────────────────────────────────────────────────────────────┐
│                    COGNEE ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Relational  │  │   Vector    │  │    Graph    │         │
│  │   Store     │  │   Store     │  │    Store    │         │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤         │
│  │ • Documents │  │ • Embeddings│  │ • Entities  │         │
│  │ • Chunks    │  │ • Semantic  │  │ • Relations │         │
│  │ • Provenance│  │   similarity│  │ • Knowledge │         │
│  │             │  │             │  │   graph     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Default Local Databases

| Component  | Default | Purpose                        |
| ---------- | ------- | ------------------------------ |
| Relational | SQLite  | Metadata, documents, chunks    |
| Vector     | LanceDB | Embeddings for semantic search |
| Graph      | KuzuDB  | Knowledge graph storage        |

### Building Blocks

#### 1. DataPoints

Structured data units that become graph nodes:

```python
from cognee.infrastructure.engine import DataPoint

class Person(DataPoint):
    name: str
    knows: list["Person"] = []
    metadata: dict = {"index_fields": ["name"]}  # Searchable fields
```

#### 2. Tasks

Individual processing units:

```python
from cognee.modules.pipelines import Task

task = Task(my_function, task_config={"batch_size": 30})
```

#### 3. Pipelines

Orchestration of tasks:

```python
from cognee.modules.pipelines import run_tasks

tasks = [Task(extract_data), Task(add_data_points)]
async for _ in run_tasks(tasks=tasks, data=my_data, datasets=["my_dataset"]):
    pass
```

---

## Basic Usage (Quick Start)

### Minimal Example (6 Lines)

```python
import cognee
import asyncio

async def main():
    # Add text to cognee
    await cognee.add("Cognee turns documents into AI memory.")

    # Generate the knowledge graph
    await cognee.cognify()

    # Optional: Add memory algorithms
    await cognee.memify()

    # Query the knowledge graph
    results = await cognee.search("What does Cognee do?")

    for result in results:
        print(result)

asyncio.run(main())
```

### CLI Alternative

```bash
cognee-cli add "Cognee turns documents into AI memory."
cognee-cli cognify
cognee-cli search "What does Cognee do?"
cognee-cli delete --all
```

### Adding Different Data Types

```python
# Add text
await cognee.add("Your text content here")

# Add files
await cognee.add("/path/to/document.pdf")
await cognee.add("/path/to/folder/")

# Add with dataset name
await cognee.add("Content", dataset_name="my_dataset")

# Add multiple documents
documents = ["Doc 1 content", "Doc 2 content", "Doc 3 content"]
for doc in documents:
    await cognee.add(doc)
await cognee.cognify()
```

### Reset Data

```python
# Clear all data
await cognee.prune.prune_data()

# Clear system metadata
await cognee.prune.prune_system(metadata=True)
```

---

## Configuration

### Environment Variables (.env file)

```bash
# ============ LLM Configuration ============
LLM_PROVIDER="openai"           # openai, anthropic, gemini, ollama, custom
LLM_MODEL="gpt-4o-mini"
LLM_API_KEY="sk-..."
# LLM_ENDPOINT=https://api.openai.com/v1
# LLM_MAX_TOKENS=16384

# ============ Embedding Configuration ============
EMBEDDING_PROVIDER="openai"
EMBEDDING_MODEL="text-embedding-3-small"
EMBEDDING_API_KEY="sk-..."      # Falls back to LLM_API_KEY if not set
# EMBEDDING_DIMENSIONS=1536
# EMBEDDING_MAX_TOKENS=8191

# ============ Relational Database ============
DB_PROVIDER="sqlite"            # sqlite, postgres
# For PostgreSQL:
# DB_PROVIDER=postgres
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_USERNAME=cognee
# DB_PASSWORD=cognee
# DB_NAME=cognee_db

# ============ Vector Database ============
VECTOR_DB_PROVIDER="lancedb"    # lancedb, qdrant, chromadb, pgvector, weaviate
# For Qdrant:
# VECTOR_DB_PROVIDER="qdrant"
# VECTOR_DB_URL=http://localhost:6333
# VECTOR_DB_KEY=your-api-key

# ============ Graph Database ============
GRAPH_DATABASE_PROVIDER="kuzu"  # kuzu, neo4j, networkx, falkordb
# For Neo4j:
# GRAPH_DATABASE_PROVIDER="neo4j"
# GRAPH_DATABASE_URL=bolt://localhost:7687
# GRAPH_DATABASE_USERNAME=neo4j
# GRAPH_DATABASE_PASSWORD=password

# ============ Rate Limiting ============
# LLM_RATE_LIMIT_REQUESTS=60
# LLM_RATE_LIMIT_SECONDS=60
```

### Provider-Specific Configurations

#### OpenAI (Default)

```bash
LLM_PROVIDER="openai"
LLM_MODEL="gpt-4o-mini"
LLM_API_KEY="sk-..."
```

#### Anthropic

```bash
pip install cognee[anthropic]

LLM_PROVIDER="anthropic"
LLM_MODEL="anthropic/claude-sonnet-4-20250514"
LLM_API_KEY="sk-ant-..."
```

#### Google Gemini

```bash
pip install cognee[gemini]

LLM_PROVIDER="gemini"
LLM_MODEL="gemini/gemini-flash-latest"
LLM_API_KEY="your_gemini_api_key"
EMBEDDING_PROVIDER="gemini"
EMBEDDING_MODEL="gemini/text-embedding-004"
EMBEDDING_API_KEY="your_gemini_api_key"
```

#### Ollama (Local)

```bash
pip install cognee[ollama]

LLM_PROVIDER="ollama"
LLM_MODEL="deepseek-r1:32b"     # or llama3.3-70b
LLM_ENDPOINT="http://localhost:11434"
EMBEDDING_PROVIDER="ollama"
EMBEDDING_MODEL="nomic-embed-text"
EMBEDDING_DIMENSIONS=768
```

**Recommended Ollama Models:**

- High-end (32GB+ VRAM): `deepseek-r1:32b` or `llama3.3-70b`
- Mid-range (16-24GB): `devstral-small-2:24b`
- Embeddings: `nomic-embed-text` (768 dims)

#### Azure OpenAI

```bash
LLM_PROVIDER="azure"
LLM_MODEL="azure/gpt-4o-mini"
LLM_ENDPOINT="https://your-resource.openai.azure.com/..."
LLM_API_KEY="your-azure-key"
LLM_API_VERSION="2024-12-01-preview"
```

### Programmatic Configuration

```python
from cognee.infrastructure.databases.vector import get_vectordb_config
from cognee.infrastructure.databases.graph.config import get_graph_config
from cognee.infrastructure.databases.relational import get_relational_config
from cognee.infrastructure.llm.config import get_llm_config

# View current config
print(get_vectordb_config().to_dict())
print(get_graph_config().to_dict())
print(get_relational_config().to_dict())
print(get_llm_config().to_dict())
```

---

## Search Types

Cognee provides multiple search types for different use cases:

```python
from cognee import search, SearchType

# Different search types
results = await cognee.search(
    query_text="Your question here",
    query_type=SearchType.GRAPH_COMPLETION,  # See options below
    datasets=["my_dataset"]
)
```

### Available Search Types

| SearchType         | Description                                 | Best For                       |
| ------------------ | ------------------------------------------- | ------------------------------ |
| `GRAPH_COMPLETION` | Graph-aware answer with reasoning (default) | Complex, relational questions  |
| `RAG_COMPLETION`   | Traditional RAG with chunks → LLM           | Simple factual questions       |
| `INSIGHTS`         | Returns relationships and connections       | Understanding entity relations |
| `CHUNKS`           | Raw text passages                           | Copy/paste content             |
| `SUMMARIES`        | Pre-computed summaries                      | Quick overview                 |
| `CODE`             | Code-aware search                           | Repository queries             |
| `CYPHER`           | Raw Cypher query execution                  | Advanced graph queries         |
| `FEELING_LUCKY`    | Auto-selects best search type               | When unsure                    |

### Examples

```python
# Conversational answer with reasoning (default)
graph_result = await cognee.search(
    query_type=SearchType.GRAPH_COMPLETION,
    query_text="Who does Alice know?"
)

# Traditional RAG approach
rag_result = await cognee.search(
    query_type=SearchType.RAG_COMPLETION,
    query_text="What is machine learning?"
)

# Get entity relationships
insights = await cognee.search(
    query_type=SearchType.INSIGHTS,
    query_text="Neptune Analytics"
)
for result in insights:
    src = result[0].get("name", result[0]["type"])
    tgt = result[2].get("name", result[2]["type"])
    rel = result[1].get("relationship_name", "__relationship__")
    print(f"{src} -[{rel}]-> {tgt}")

# Get raw chunks
chunks = await cognee.search(
    query_type=SearchType.CHUNKS,
    query_text="machine learning applications"
)

# Code search
code_results = await cognee.search(
    query_type=SearchType.CODE,
    query_text="Where is the email parser?"
)
```

---

## Custom Tasks & Pipelines

### Creating Custom DataPoints

```python
from typing import Any, Dict, List
from pydantic import BaseModel
from cognee.infrastructure.engine import DataPoint

class Person(DataPoint):
    name: str
    knows: List["Person"] = []
    metadata: Dict[str, Any] = {"index_fields": ["name"]}

class Company(DataPoint):
    name: str
    employees: List[Person] = []
    departments: List["Department"] = []
    metadata: Dict[str, Any] = {"index_fields": ["name"]}

class Department(DataPoint):
    name: str
    employees: List[Person] = []
    metadata: Dict[str, Any] = {"index_fields": ["name"]}
```

### Building a Custom Pipeline

```python
import asyncio
from cognee.modules.pipelines import Task, run_pipeline
from cognee.tasks.storage import add_data_points
from cognee.infrastructure.llm.LLMGateway import LLMGateway

# Define extraction function
async def extract_people(text: str) -> List[Person]:
    llm = LLMGateway()

    system_prompt = (
        "Extract people mentioned in the text. "
        "Return as `persons: Person[]` with each Person having `name` and optional `knows` relations."
    )

    response = await llm.generate_structured_output(
        prompt=text,
        system_prompt=system_prompt,
        response_model=People
    )

    return response.persons

# Build pipeline
async def main():
    text = "Alice knows Bob. Bob knows Charlie. Charlie works with Alice."

    tasks = [
        Task(extract_people),      # Extract → List[Person]
        Task(add_data_points)      # Store in graph
    ]

    async for _ in run_pipeline(tasks=tasks, data=text, datasets=["people_demo"]):
        pass

    # Search
    results = await cognee.search(
        query_type=SearchType.GRAPH_COMPLETION,
        query_text="Who does Alice know?",
        datasets=["people_demo"]
    )
    print(results)

asyncio.run(main())
```

### Using Built-in Tasks

```python
from cognee.tasks.documents import classify_documents, extract_chunks_from_documents
from cognee.tasks.graph import extract_graph_from_data
from cognee.tasks.ingestion import ingest_data
from cognee.tasks.storage import add_data_points
from cognee.tasks.summarization import summarize_text
from cognee.tasks.repo_processor import get_repo_file_dependencies
```

---

## Multi-User & Multi-Tenant Mode

### Node Sets (Data Isolation)

Node sets provide soft isolation for organizing data:

```python
# Add data to specific node set
await cognee.add("User preferences data", node_set="user_123")
await cognee.add("Company policies", node_set="company_data")

# Search within specific node set
results = await cognee.search(
    query_text="What are the policies?",
    node_set="company_data"
)
```

### Session-Based Isolation (LangGraph Integration)

```python
from cognee_integration_langgraph import get_sessionized_cognee_tools

# Get tools scoped to a session
tools = get_sessionized_cognee_tools(session_id="user-123")

# Each session maintains isolated memory
# Data from user-123 won't leak to user-456
```

### Multi-Tenant Architecture

For SaaS applications requiring strict isolation:

1. **Database-level isolation**: Separate databases per tenant
2. **Node set isolation**: Logical separation within shared database
3. **User permissions**: Configure role-based access

```python
# Enable user management
from cognee.modules.users.methods import get_default_user

user = await get_default_user()
# Configure per-user/tenant databases in environment
```

---

## Database Configuration

### Vector Stores

#### LanceDB (Default - Local)

```bash
# No configuration needed, works out of the box
VECTOR_DB_PROVIDER="lancedb"
```

#### Qdrant

```bash
pip install cognee-community-vector-adapter-qdrant

VECTOR_DB_PROVIDER="qdrant"
VECTOR_DB_URL=http://localhost:6333
VECTOR_DB_KEY=your-api-key
```

```python
# Register Qdrant adapter
import cognee_community_vector_adapter_qdrant.register
```

#### PostgreSQL (pgvector)

```bash
VECTOR_DB_PROVIDER="pgvector"
# Uses same connection as relational DB
```

#### ChromaDB

```bash
VECTOR_DB_PROVIDER="chromadb"
VECTOR_DB_URL=http://localhost:8000
VECTOR_DB_KEY=your-auth-token
```

### Graph Stores

#### KuzuDB (Default - Local)

```bash
GRAPH_DATABASE_PROVIDER="kuzu"
# Data stored in .cognee_system/databases/kuzu/
```

#### Neo4j

```bash
# Local
GRAPH_DATABASE_PROVIDER="neo4j"
GRAPH_DATABASE_URL=bolt://localhost:7687
GRAPH_DATABASE_USERNAME=neo4j
GRAPH_DATABASE_PASSWORD=password

# Cloud (AuraDB)
GRAPH_DATABASE_PROVIDER=neo4j
GRAPH_DATABASE_USERNAME=neo4j
GRAPH_DATABASE_URL=neo4j+ssc://12345678.databases.neo4j.io
GRAPH_DATABASE_PASSWORD=neo4j-api-key
```

#### FalkorDB (Hybrid - Graph + Vector)

```bash
VECTOR_DB_PROVIDER=falkordb
VECTOR_DB_URL=localhost
VECTOR_DB_PORT=6379
GRAPH_DATABASE_PROVIDER=falkordb
GRAPH_DATABASE_URL=localhost
GRAPH_DATABASE_PORT=6379
```

#### NetworkX (File-based)

```bash
GRAPH_DATABASE_PROVIDER="networkx"
# Data stored in .cognee_system/databases/cognee_graph.pkl
```

#### Amazon Neptune Analytics

```bash
GRAPH_DATABASE_PROVIDER="neptune_analytics"
GRAPH_DATABASE_URL=neptune-graph://g-your-graph
VECTOR_DB_PROVIDER="neptune_analytics"
VECTOR_DB_URL=neptune-graph://g-your-graph
AWS_DEFAULT_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
```

---

## MCP Server Integration

### Overview

Cognee MCP Server exposes Cognee's knowledge graph capabilities through the Model Context Protocol, enabling AI assistants to build and query persistent memory.

### Installation

```bash
cd cognee-mcp
pip install -e .
```

### Running the Server

```bash
# Default (stdio transport)
python src/server.py

# SSE transport
python src/server.py --transport sse

# HTTP transport (recommended for web)
python src/server.py --transport http --host 127.0.0.1 --port 8000
```

### Docker

```bash
# Build
docker build -f cognee-mcp/Dockerfile -t cognee/cognee-mcp:main .

# Run with HTTP
docker run -e TRANSPORT_MODE=http --env-file ./.env -p 8000:8000 --rm -it cognee/cognee-mcp:main
```

### Client Configuration (Cursor)

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "cognee": {
      "command": "uv",
      "args": ["--directory", "/path/to/cognee-mcp", "run", "cognee-mcp"],
      "env": {
        "LLM_API_KEY": "your-api-key"
      }
    }
  }
}
```

### MCP Tools Available

| Tool                  | Description                         |
| --------------------- | ----------------------------------- |
| `cognify`             | Turn data into knowledge graph      |
| `search`              | Query memory (various search types) |
| `codify`              | Analyze code repository             |
| `delete`              | Delete data from dataset            |
| `prune`               | Reset cognee                        |
| `list_data`           | List datasets and items             |
| `save_interaction`    | Log user-agent interactions         |
| `get_developer_rules` | Retrieve developer rules            |

---

## LangGraph Integration

### Installation

```bash
pip install cognee-integration-langgraph
```

### Basic Usage

```python
import asyncio
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from cognee_integration_langgraph import get_sessionized_cognee_tools

async def main():
    # Get sessionized tools
    tools = get_sessionized_cognee_tools(session_id="user-123")

    # Create agent
    model = ChatOpenAI(model="gpt-4o-mini")
    agent = create_react_agent(model, tools)

    # Use agent with persistent memory
    result = await agent.ainvoke({
        "messages": [{"role": "user", "content": "Remember that I prefer Python."}]
    })

    # Later, in a new session
    result = await agent.ainvoke({
        "messages": [{"role": "user", "content": "What language do I prefer?"}]
    })

asyncio.run(main())
```

### Memory Patterns

```python
# Knowledge Accumulation
for document in knowledge_base:
    await agent.ainvoke({
        "messages": [HumanMessage(content=f"Learn: {document}")]
    })

# Context-Aware Assistance (persists across sessions)
# Monday
await agent.ainvoke({
    "messages": [HumanMessage(content="I'm debugging the payment flow")]
})

# Wednesday (agent remembers)
await agent.ainvoke({
    "messages": [HumanMessage(content="What was I debugging?")]
})
```

---

## Deployment Options

### Local Development

Default configuration works out of the box:

```python
import cognee
await cognee.add("data")
await cognee.cognify()
```

### Modal (Serverless)

```bash
# See docs.cognee.ai/how-to-guides/cognee-sdk/deployment/modal
modal deploy
```

### Docker Compose

```yaml
version: "3.8"
services:
  cognee:
    image: cognee/cognee:latest
    environment:
      - LLM_API_KEY=${LLM_API_KEY}
      - VECTOR_DB_PROVIDER=qdrant
      - GRAPH_DATABASE_PROVIDER=neo4j
    ports:
      - "8000:8000"
    depends_on:
      - qdrant
      - neo4j

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"

  neo4j:
    image: neo4j:latest
    environment:
      - NEO4J_AUTH=neo4j/password
    ports:
      - "7474:7474"
      - "7687:7687"
```

### Kubernetes (Helm)

```bash
# See docs.cognee.ai/how-to-guides/cognee-sdk/deployment/helm
helm install cognee cognee/cognee
```

### AWS EC2

```bash
# See docs.cognee.ai/how-to-guides/cognee-sdk/deployment/ec2
```

---

## Best Practices

### 1. Data Ingestion

```python
# Batch documents before cognify for performance
documents = [doc1, doc2, doc3, ...]
for doc in documents:
    await cognee.add(doc)
await cognee.cognify()  # Process all at once
```

### 2. Search Strategy

```python
# Use appropriate search type for your use case
# - GRAPH_COMPLETION for complex relational queries
# - RAG_COMPLETION for simple factual lookups
# - INSIGHTS for understanding relationships
# - FEELING_LUCKY when unsure
```

### 3. Multi-Tenant Isolation

```python
# Use node_sets for logical isolation
await cognee.add(data, node_set=f"tenant_{tenant_id}")

# Or sessionized tools for automatic isolation
tools = get_sessionized_cognee_tools(session_id=f"user_{user_id}")
```

### 4. Production Database Selection

| Workload                | Recommended Stack                        |
| ----------------------- | ---------------------------------------- |
| Small/Local             | SQLite + LanceDB + KuzuDB                |
| Medium Scale            | PostgreSQL + Qdrant + Neo4j              |
| Enterprise              | PostgreSQL + Qdrant Cloud + Neo4j AuraDB |
| Hybrid (single backend) | PostgreSQL + FalkorDB                    |

### 5. Error Handling

```python
import cognee
from cognee import SearchType

async def safe_search(query: str):
    try:
        results = await cognee.search(
            query_type=SearchType.GRAPH_COMPLETION,
            query_text=query
        )
        return results
    except Exception as e:
        # Handle errors gracefully
        print(f"Search error: {e}")
        return []
```

### 6. Monitoring & Debugging

```python
# Enable Langfuse tracing
# Add to .env:
# LANGFUSE_PUBLIC_KEY=""
# LANGFUSE_SECRET_KEY=""
# LANGFUSE_HOST=""
```

---

## File Structure Reference

```
project_root/
├── .cognee_system/
│   └── databases/
│       ├── kuzu/           # Graph database files
│       ├── lancedb/        # Vector database files
│       └── cognee_db       # SQLite database file
├── .data_storage/          # Ingested files
├── .anon_id                # Anonymous telemetry ID
└── .env                    # Configuration
```

---

## Quick Reference Card

```python
import cognee
from cognee import SearchType

# ===== BASIC OPERATIONS =====
await cognee.add("text or /path/to/file")
await cognee.cognify()
results = await cognee.search(query_text="question", query_type=SearchType.GRAPH_COMPLETION)

# ===== RESET =====
await cognee.prune.prune_data()
await cognee.prune.prune_system(metadata=True)

# ===== SEARCH TYPES =====
SearchType.GRAPH_COMPLETION  # Graph-aware (default)
SearchType.RAG_COMPLETION    # Traditional RAG
SearchType.INSIGHTS          # Relationships
SearchType.CHUNKS            # Raw passages
SearchType.SUMMARIES         # Summaries
SearchType.CODE              # Code search
SearchType.CYPHER            # Raw Cypher
SearchType.FEELING_LUCKY     # Auto-select

# ===== VISUALIZATION =====
await cognee.visualize_graph()  # Generates HTML graph
```

---

## Resources

- **Documentation**: https://docs.cognee.ai
- **GitHub**: https://github.com/topoteretes/cognee
- **Discord**: https://discord.gg/m63hxKsp4p
- **Starter Repo**: https://github.com/topoteretes/cognee-starter
- **MCP Server**: https://github.com/topoteretes/cognee/tree/main/cognee-mcp
- **LangGraph Integration**: https://github.com/topoteretes/cognee-integration-langgraph
- **PyPI**: https://pypi.org/project/cognee/

---

_Document generated from Cognee documentation v0.5.1_
