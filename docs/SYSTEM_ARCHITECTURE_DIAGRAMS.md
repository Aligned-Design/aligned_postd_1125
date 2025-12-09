# POSTD System Architecture Diagrams

## High-Level System Diagram

```mermaid
flowchart TD
    Browser[Browser - User] --> Frontend[Frontend App<br/>Next.js React]
    
    subgraph ClientApp[Client App]
        Onboarding[Onboarding Flow<br/>10 Steps]
        Dashboard[Dashboard<br/>Brand Guide UI]
        Studio[Creative Studio<br/>Canvas Editor]
        Queue[Content Queue<br/>Approvals]
    end
    
    Frontend --> ClientApp
    
    Onboarding --> |POST /api/brands| BrandAPI[Brand API<br/>/api/brands]
    Onboarding --> |POST /api/crawl/start| CrawlerAPI[Crawler API<br/>/api/crawl/start]
    
    BrandAPI --> Supabase[(Supabase<br/>PostgreSQL)]
    CrawlerAPI --> CrawlerWorker[Brand Crawler Worker<br/>Playwright]
    
    CrawlerWorker --> |Extract Content| ExtractContent[Content Extraction<br/>Images, Typography, OG]
    CrawlerWorker --> |Extract Colors| ColorExtract[Color Extraction<br/>node-vibrant]
    CrawlerWorker --> |Generate AI| AIGen[AI Generation<br/>OpenAI/Claude]
    
    ExtractContent --> ImageClassify[Image Classification<br/>categorizeImage]
    ImageClassify --> |Logos| LogoFilter[Logo Filter<br/>Max 2]
    ImageClassify --> |Brand Images| ImageFilter[Brand Image Filter<br/>Max 15]
    
    LogoFilter --> PersistImages[Persist Scraped Images<br/>persistScrapedImages]
    ImageFilter --> PersistImages
    
    subgraph SupabaseDB[(Supabase / Postgres)]
        MediaAssets[(media_assets Table<br/>category: logos/images)]
        BrandsTable[(brands Table<br/>brand_kit JSONB)]
        ContentItems[(content_items Table<br/>status, bfs_score)]
        PublishingJobs[(publishing_jobs Table<br/>status, scheduled_at)]
        PlatformConnections[(platform_connections<br/>OAuth tokens)]
        GenerationLogs[(generation_logs<br/>bfs_score, approved)]
    end
    
    PersistImages --> MediaAssets
    
    AIGen --> BrandKit[Brand Kit Data<br/>Voice, Tone, Keywords]
    BrandKit --> BrandGuideAPI[Brand Guide API<br/>/api/brand-guide]
    BrandGuideAPI --> BrandsTable
    
    Dashboard --> |GET /api/brand-guide/:id| BrandGuideAPI
    BrandGuideAPI --> |Query media_assets| MediaAssets
    BrandGuideAPI --> |Query brands| BrandsTable
    
    Studio --> |GET /api/agents/generate/design| DesignAgent[Design Agent<br/>/api/agents/generate/design]
    Queue --> |GET /api/agents/generate/doc| DocAgent[Doc Agent<br/>/api/agents/generate/doc]
    
    DesignAgent --> AIGen
    DocAgent --> AIGen
    
    AIGen --> |OpenAI API| OpenAI[OpenAI<br/>GPT-4]
    AIGen --> |Claude API| Anthropic[Anthropic<br/>Claude]
    
    Studio --> |Image Sourcing| ImageSourcing[Image Sourcing Service<br/>getScrapedBrandAssets]
    ImageSourcing --> MediaAssets
    
    Queue --> |Save Content| ContentItems
    Queue --> |Schedule| Scheduler[Scheduler<br/>Publishing Queue]
    
    Scheduler --> PublishingJobs
    Scheduler --> |Publish| Platforms[Social Platforms<br/>Instagram, LinkedIn, TikTok]
    Platforms --> PlatformConnections
    
    style Browser fill:#e1f5ff
    style Frontend fill:#fff4e6
    style ClientApp fill:#fff4e6
    style Supabase fill:#3ecf8e
    style SupabaseDB fill:#3ecf8e
    style MediaAssets fill:#3ecf8e
    style BrandsTable fill:#3ecf8e
    style ContentItems fill:#3ecf8e
    style PublishingJobs fill:#3ecf8e
    style PlatformConnections fill:#3ecf8e
    style GenerationLogs fill:#3ecf8e
    style OpenAI fill:#ff6b6b
    style Anthropic fill:#ff6b6b
    style Platforms fill:#4ecdc4
```

## Brand Crawler & Media Pipeline Diagram

```mermaid
flowchart TD
    Start[User Enters Website URL<br/>Onboarding Step 3] --> PostCrawl[POST /api/crawl/start<br/>url, brand_id, workspaceId]
    
    PostCrawl --> Validate[Validate Request<br/>Check duplicate crawls]
    Validate --> RunCrawl[runCrawlJobSync]
    
    RunCrawl --> CrawlWebsite[crawlWebsite<br/>Playwright Browser]
    
    CrawlWebsite --> RobotsTxt[Fetch robots.txt<br/>Parse with robots-parser]
    RobotsTxt --> LaunchBrowser[Launch Headless Chromium<br/>Vercel-compatible]
    
    LaunchBrowser --> QueueInit[Initialize Queue<br/>Start URL, depth: 0]
    QueueInit --> WhileLoop{While Queue Not Empty<br/>& Pages < 50}
    
    WhileLoop --> |Next URL| CheckDepth{Depth <= 3?}
    CheckDepth --> |No| WhileLoop
    CheckDepth --> |Yes| CheckRobots{Robots.txt<br/>Allowed?}
    
    CheckRobots --> |No| WhileLoop
    CheckRobots --> |Yes| Navigate[Navigate to URL<br/>Retry with backoff]
    
    Navigate --> ExtractPage[extractPageContent<br/>For Each Page]
    
    ExtractPage --> ExtractImages[extractImages<br/>Multi-Source Logo Detection]
    ExtractPage --> ExtractTypography[extractTypography<br/>Font Detection]
    ExtractPage --> ExtractOG[extractOpenGraphMetadata<br/>OG Tags]
    ExtractPage --> ExtractText[Extract Text Content<br/>H1, H2, H3, Body]
    
    ExtractImages --> LogoSources[Logo Sources<br/>Priority Order]
    LogoSources --> SVGLogos[1. Inline SVG Logos<br/>extractSvgLogos]
    LogoSources --> CSSLogos[2. CSS Background-Image<br/>extractCssLogos]
    LogoSources --> HTMLLogos[3. HTML img Tags<br/>extractImages]
    LogoSources --> OGLogo[4. OpenGraph Image<br/>extractOgLogo]
    LogoSources --> Favicon[5. Favicon<br/>extractFaviconLogos]
    
    SVGLogos --> MergeLogos[mergeLogoCandidates<br/>Deduplicate by URL]
    CSSLogos --> MergeLogos
    HTMLLogos --> MergeLogos
    OGLogo --> MergeLogos
    Favicon --> MergeLogos
    
    MergeLogos --> CategorizeImage[categorizeImage<br/>Classify Each Image]
    
    CategorizeImage --> FilterSocial{Social Icon?<br/>platform_logo?}
    FilterSocial --> |Yes| FilterOut[Filter Out<br/>Do Not Persist]
    FilterSocial --> |No| CheckRole{Image Role?}
    
    CheckRole --> |logo| LogoPath[Logo Path<br/>role: logo]
    CheckRole --> |hero| HeroPath[Brand Image Path<br/>role: hero]
    CheckRole --> |photo| PhotoPath[Brand Image Path<br/>role: photo]
    CheckRole --> |team| TeamPath[Brand Image Path<br/>role: team]
    CheckRole --> |other| OtherPath[Brand Image Path<br/>role: other]
    
    LogoPath --> SeparateLogos[Separate Logos<br/>Max 2, Sort by Priority]
    HeroPath --> SeparateImages[Separate Brand Images<br/>Max 15, Sort by Priority]
    PhotoPath --> SeparateImages
    TeamPath --> SeparateImages
    OtherPath --> SeparateImages
    
    ExtractPage --> FindLinks[Find Same-Domain Links<br/>Add to Queue depth+1]
    FindLinks --> WhileLoop
    
    WhileLoop --> |Complete| ExtractColors[extractColors<br/>Take Screenshot]
    ExtractColors --> Vibrant[node-vibrant<br/>Extract Color Palette]
    Vibrant --> ColorPalette[ColorPalette<br/>Primary, Secondary, Accent]
    
    ExtractPage --> GenerateBrandKit[generateBrandKit<br/>AI Generation]
    GenerateBrandKit --> AIPrompt[Build AI Prompt<br/>All Crawl Results + Colors]
    AIPrompt --> AIProvider{AI Provider}
    AIProvider --> |OpenAI| OpenAI[OpenAI GPT-4]
    AIProvider --> |Claude| Claude[Anthropic Claude]
    OpenAI --> BrandKitData[BrandKitData<br/>Voice, Tone, Keywords]
    Claude --> BrandKitData
    
    SeparateLogos --> PersistImages[persistScrapedImages<br/>Save to media_assets]
    SeparateImages --> PersistImages
    
    PersistImages --> FilterValid[Filter Valid Images<br/>Remove social_icon, platform_logo]
    FilterValid --> DetermineCategory{Determine Category<br/>role === logo?}
    
    DetermineCategory --> |Yes| LogosCategory[category: logos<br/>metadata.role: logo<br/>metadata.category: logos]
    DetermineCategory --> |No| ImagesCategory[category: images<br/>metadata.role: hero/photo/etc<br/>metadata.category: images]
    
    LogosCategory --> Deduplicate[Deduplicate by URL<br/>Remove Duplicates]
    ImagesCategory --> Deduplicate
    
    Deduplicate --> InsertDB[INSERT INTO media_assets<br/>brand_id, tenant_id (required), path,<br/>category, metadata, status]
    InsertDB --> MediaAssets[(media_assets Table<br/>category: logos/images<br/>metadata.source: scrape<br/>status: active/pending]
    
    BrandKitData --> SaveBrandGuide[saveBrandGuideFromOnboarding<br/>Save to brands.brand_kit]
    SaveBrandGuide --> BrandsTable[(brands Table<br/>brand_kit JSONB<br/>voice_summary JSONB)]
    
    MediaAssets --> BrandGuideAPI[GET /api/brand-guide/:brandId]
    BrandsTable --> BrandGuideAPI
    
    BrandGuideAPI --> QueryLogos[Query Logos<br/>WHERE category = logos<br/>AND role = logo]
    BrandGuideAPI --> QueryImages[Query Brand Images<br/>WHERE category = images<br/>AND role IN hero,photo,team,subject,other<br/>AND role != logo]
    
    QueryLogos --> SeparateAPI[Separate in API Response<br/>scrapedLogos[]<br/>scrapedBrandImages[]]
    QueryImages --> SeparateAPI
    
    SeparateAPI --> Frontend[Frontend<br/>BrandDashboard Component]
    
    Frontend --> LogosLane[Logos Lane<br/>Render scrapedLogos<br/>Max 2 Display]
    Frontend --> ImagesLane[Brand Images Lane<br/>Render scrapedBrandImages<br/>Max 15 Display]
    
    LogosLane --> FilterFrontend1[Frontend Filter<br/>role === logo OR<br/>category === logos]
    ImagesLane --> FilterFrontend2[Frontend Filter<br/>role !== logo AND<br/>category !== logos AND<br/>role !== social_icon AND<br/>role !== platform_logo]
    
    style Start fill:#e1f5ff
    style MediaAssets fill:#3ecf8e
    style BrandsTable fill:#3ecf8e
    style FilterOut fill:#ff6b6b
    style LogosLane fill:#fff4e6
    style ImagesLane fill:#fff4e6
    style OpenAI fill:#ff6b6b
    style Claude fill:#ff6b6b
```

## AI Content Generation Flow Diagram

```mermaid
flowchart TD
    User[User Action] --> Trigger{Trigger Type}
    
    Trigger --> |Creative Studio| StudioTrigger[Creative Studio<br/>Generate Design]
    Trigger --> |Content Queue| DocTrigger[Content Queue<br/>Generate Post]
    Trigger --> |Onboarding| OnboardTrigger[Onboarding Step 7<br/>7-Day Content Package]
    
    StudioTrigger --> DesignEndpoint[POST /api/agents/generate/design<br/>design-agent.ts]
    DocTrigger --> DocEndpoint[POST /api/agents/generate/doc<br/>doc-agent.ts]
    OnboardTrigger --> OnboardEndpoint[POST /api/onboarding/generate-week<br/>onboarding-content-generator.ts]
    
    DesignEndpoint --> ValidateDesign[Validate Request<br/>Zod Schema]
    DocEndpoint --> ValidateDoc[Validate Request<br/>Zod Schema]
    OnboardEndpoint --> ValidateOnboard[Validate Request]
    
    ValidateDesign --> GetBrandDesign[getBrandProfile<br/>Read Brand Guide]
    ValidateDoc --> GetBrandDoc[getBrandProfile<br/>Read Brand Guide]
    ValidateOnboard --> GetBrandOnboard[getBrandProfile<br/>Read Brand Guide]
    
    GetBrandDesign --> BrandProfile1[BrandProfile<br/>Voice, Colors, Typography,<br/>Personas, Content Rules]
    GetBrandDoc --> BrandProfile2[BrandProfile<br/>Voice, Colors, Typography,<br/>Personas, Content Rules]
    GetBrandOnboard --> BrandProfile3[BrandProfile<br/>Voice, Colors, Typography,<br/>Personas, Content Rules]
    
    BrandProfile1 --> BuildDesignPrompt[buildDesignSystemPrompt<br/>Design Agent Prompt]
    BrandProfile2 --> BuildDocPrompt[buildDocSystemPrompt<br/>Doc Agent Prompt]
    BrandProfile3 --> BuildOnboardPrompt[Build Onboarding Prompt<br/>7-Day Content Plan]
    
    BuildDesignPrompt --> DesignPrompt[Design Prompt<br/>Brand Context +<br/>Design Requirements]
    BuildDocPrompt --> DocPrompt[Doc Prompt<br/>Brand Context +<br/>Content Requirements]
    BuildOnboardPrompt --> OnboardPrompt[Onboarding Prompt<br/>Brand Context +<br/>Weekly Focus Topics]
    
    DesignPrompt --> AIGenerate[generateWithAI<br/>ai-generation.ts]
    DocPrompt --> AIGenerate
    OnboardPrompt --> AIGenerate
    
    AIGenerate --> SelectProvider{Select AI Provider<br/>Default: OpenAI}
    
    SelectProvider --> |OpenAI| OpenAIGen[generateWithOpenAI<br/>GPT-4]
    SelectProvider --> |Claude| ClaudeGen[generateWithClaude<br/>Claude 3.5 Sonnet]
    
    OpenAIGen --> OpenAIAPI[OpenAI API<br/>Chat Completions]
    ClaudeGen --> ClaudeAPI[Anthropic API<br/>Messages API]
    
    OpenAIAPI --> |Success| ParseOpenAI[Parse Response<br/>Extract Content]
    ClaudeAPI --> |Success| ParseClaude[Parse Response<br/>Extract Content]
    
    OpenAIAPI --> |Error| Fallback{API Error?<br/>Rate Limit?<br/>Service Down?}
    ClaudeAPI --> |Error| Fallback
    
    Fallback --> |Yes| TryFallback[Try Fallback Provider<br/>OpenAI ↔ Claude]
    TryFallback --> AIGenerate
    
    ParseOpenAI --> AIGenerationOutput[AIGenerationOutput<br/>content, tokens, provider]
    ParseClaude --> AIGenerationOutput
    
    AIGenerationOutput --> DesignParse{Agent Type?}
    
    DesignParse --> |Design| ParseDesign[Parse Design Variants<br/>Extract JSON Structure<br/>Design Elements, Layout]
    DesignParse --> |Doc| ParseDoc[Parse Doc Variants<br/>Extract Content Variants<br/>Headlines, Body, CTA]
    DesignParse --> |Onboarding| ParseOnboard[Parse Content Items<br/>Extract Post Content<br/>Schedule Dates]
    
    ParseDesign --> CalculateBFS[Calculate Brand Fidelity Score<br/>BFS Baseline Generator]
    ParseDoc --> CalculateBFS
    ParseOnboard --> CalculateBFS
    
    CalculateBFS --> BFSResult[BFS Score<br/>Compliance Tags<br/>Brand Alignment]
    
    ParseDesign --> DesignResponse[Design Agent Response<br/>variants[], brandContext,<br/>metadata, warnings]
    ParseDoc --> DocResponse[Doc Agent Response<br/>variants[], brandContext,<br/>metadata, warnings]
    ParseOnboard --> OnboardResponse[Onboarding Response<br/>contentPackage[],<br/>items[], schedule]
    
    DesignResponse --> SaveDesign[Save to Content Queue<br/>content_items Table<br/>generation_logs Table<br/>status: draft]
    DocResponse --> SaveDoc[Save to Content Queue<br/>content_items Table<br/>generation_logs Table<br/>status: draft]
    OnboardResponse --> SaveOnboard[Save Content Package<br/>content_packages Table<br/>content_items Table<br/>generation_logs Table]
    
    SaveDesign --> QueueUI[Content Queue UI<br/>Display with BFS Score]
    SaveDoc --> QueueUI
    SaveOnboard --> CalendarUI[Calendar UI<br/>Display Scheduled Posts]
    
    QueueUI --> Review[User Review<br/>Approve/Reject/Edit]
    Review --> |Approve| ApproveContent[Approve Content<br/>Update status: approved]
    Review --> |Reject| RejectContent[Reject Content<br/>Update status: rejected]
    
    ApproveContent --> Schedule[Scheduler<br/>Publishing Queue]
    Schedule --> Publish[Publish to Platforms<br/>Instagram, LinkedIn, etc.]
    
    style User fill:#e1f5ff
    style BrandProfile1 fill:#fff4e6
    style BrandProfile2 fill:#fff4e6
    style BrandProfile3 fill:#fff4e6
    style OpenAIAPI fill:#ff6b6b
    style ClaudeAPI fill:#ff6b6b
    style QueueUI fill:#3ecf8e
    style CalendarUI fill:#3ecf8e
    style Publish fill:#4ecdc4
```

