# 🏗️ Compliance Copilot Architecture

## System Overview

```mermaid
graph TB
    %% User Interface Layer
    subgraph "🎨 Frontend Layer"
        UI[Next.js Frontend<br/>React Components]
        Upload[Document Upload<br/>PDF/Word/Scanned]
        Results[Results Display<br/>Flags & Correlations]
    end

    %% API Gateway
    subgraph "🚪 API Gateway"
        FastAPI[FastAPI Backend<br/>REST Endpoints]
        CORS[CORS Configuration<br/>Multi-Origin Support]
    end

    %% Core AI Agents
    subgraph "🤖 Multi-Agent System"
        Claude[Claude AI Agent<br/>Rule Generation]
        LandingAI[LandingAI ADE<br/>Document Extraction]
        Pathway[Pathway Framework<br/>Semantic Search]
        Compliance[Compliance Agent<br/>Flag Analysis]
        Risk[Risk Correlation Agent<br/>Pattern Analysis]
    end

    %% Data Processing
    subgraph "📊 Data Processing"
        Extractor[Field Extractor<br/>Structured Data]
        RuleGen[Rule Generator<br/>Dynamic Rules]
        Checker[Compliance Checker<br/>Flag Detection]
        Correlator[Risk Correlator<br/>Pattern Analysis]
    end

    %% Knowledge Base
    subgraph "📚 Knowledge Base"
        Rules[Compliance Rules<br/>EU/US/IN/UK]
        Contracts[Contract Database<br/>Historical Data]
        Patterns[Risk Patterns<br/>Correlation Data]
    end

    %% External Services
    subgraph "🌐 External Services"
        ClaudeAPI[Claude API<br/>Anthropic]
        LandingAPI[LandingAI API<br/>Document Analysis]
        PathwayServer[Pathway Server<br/>Real-time Processing]
    end

    %% Data Flow
    UI --> Upload
    Upload --> FastAPI
    FastAPI --> Claude
    FastAPI --> LandingAI
    FastAPI --> Pathway
    FastAPI --> Compliance
    FastAPI --> Risk

    Claude --> RuleGen
    LandingAI --> Extractor
    Pathway --> Rules
    Compliance --> Checker
    Risk --> Correlator

    RuleGen --> Rules
    Extractor --> Contracts
    Checker --> Patterns
    Correlator --> Patterns

    Claude --> ClaudeAPI
    LandingAI --> LandingAPI
    Pathway --> PathwayServer

    %% Results Flow
    Checker --> Results
    Correlator --> Results
    Results --> UI

    %% Styling
    classDef frontend fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef api fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef agents fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef processing fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef knowledge fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef external fill:#f1f8e9,stroke:#33691e,stroke-width:2px

    class UI,Upload,Results frontend
    class FastAPI,CORS api
    class Claude,LandingAI,Pathway,Compliance,Risk agents
    class Extractor,RuleGen,Checker,Correlator processing
    class Rules,Contracts,Patterns knowledge
    class ClaudeAPI,LandingAPI,PathwayServer external
```

## Key Features

### 🎯 **Multi-Agent Collaboration**
- **Claude AI**: Generates 15-25 comprehensive compliance rules
- **LandingAI ADE**: Extracts structured data from documents
- **Pathway**: Real-time semantic search and rule matching
- **Compliance Agent**: Analyzes flags and violations
- **Risk Agent**: Identifies patterns and correlations

### 🔄 **Real-Time Processing**
- **Live Document Analysis**: Instant field extraction
- **Dynamic Rule Generation**: Region and domain-specific rules
- **Semantic Search**: Context-aware compliance checking
- **Risk Correlation**: Pattern identification across documents

### 🌍 **Multi-Jurisdiction Support**
- **EU**: GDPR, Working Time Directive, VAT compliance
- **US**: CCPA, Federal Employment Law, Tax withholding
- **India**: DPDP Act, GST compliance, Labor laws
- **UK**: Employment regulations, Data protection

### 📊 **Comprehensive Analysis**
- **19+ Compliance Flags**: vs 3-6 with basic systems
- **Risk Correlation**: Identifies related compliance issues
- **Temporal Patterns**: Time-based risk analysis
- **Confidence Scoring**: AI-powered accuracy assessment

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js, React | User interface and document upload |
| **Backend** | FastAPI, Python | API endpoints and business logic |
| **AI Agents** | Claude, LandingAI, Pathway | Document analysis and rule generation |
| **Database** | In-memory, File-based | Rules storage and caching |
| **Search** | Pathway, SentenceTransformers | Semantic search and matching |

## Data Flow

1. **Document Upload** → Frontend receives PDF/Word document
2. **Field Extraction** → LandingAI ADE extracts structured data
3. **Rule Generation** → Claude AI generates comprehensive rules
4. **Semantic Search** → Pathway finds relevant compliance rules
5. **Compliance Check** → System analyzes fields against rules
6. **Risk Correlation** → Identifies patterns and dependencies
7. **Results Display** → Frontend shows flags and correlations

## Performance Metrics

- **Processing Time**: 5 minutes vs 40 hours manual review
- **Accuracy**: 95%+ in field extraction and compliance checking
- **Coverage**: 19+ flags vs 3-6 with basic systems
- **Scalability**: Handles multiple jurisdictions and document types
- **Real-time**: Live updates and dynamic rule generation
