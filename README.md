# 📡 SpecBot — 3GPP AI Test Assistant

> Upload 3GPP specs, ask technical questions, and auto-generate structured test cases.  
> Built for RF test engineers working with LTE, 5G NR, and 6G systems.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/gramakreddy2024/sppecbot&env=ANTHROPIC_API_KEY&envDescription=Get%20your%20key%20from%20console.anthropic.com)

---

## ✨ Features

| Feature | Description |
|---|---|
| 💬 **Spec Chat** | Upload any 3GPP PDF and ask questions — answers come from the spec only |
| 🧪 **Test Case Generator** | Describe a scenario, get a fully structured test case with equipment details |
| 📦 **Batch Generate** | Generate multiple test cases at once from a list of scenarios |
| 📤 **Export** | Download test cases as CSV, JSON, or plain text |
| 🔬 **Instrument-Aware** | Knows R&S (CMW, CMX, FSW) and Keysight (UXM, PXA, MXA) instruments |

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+
- Anthropic API key ([get one here](https://console.anthropic.com))

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/gramakreddy2024/sppecbot.git
cd sppecbot

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploy to Vercel

### Option A — One-click deploy
Click the **Deploy with Vercel** button above and set `ANTHROPIC_API_KEY` when prompted.

### Option B — Manual deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (first time — follow prompts)
vercel

# Set your API key
vercel env add ANTHROPIC_API_KEY

# Deploy to production
vercel --prod
```

---

## 🗂 Project Structure

```
sppecbot/
├── app/
│   ├── page.tsx                  # Main UI (tabs + state)
│   ├── layout.tsx                # Root HTML layout
│   ├── globals.css               # Tailwind + base styles
│   └── api/
│       ├── upload/route.ts       # PDF parse → chunks
│       ├── chat/route.ts         # RAG chat with Claude
│       └── generate/route.ts    # Test case generation
├── components/
│   ├── Sidebar.tsx               # Upload + spec status
│   ├── ChatTab.tsx               # Chat interface
│   ├── GenerateTab.tsx           # Single test case gen
│   └── BatchTab.tsx              # Batch gen + export
├── lib/
│   ├── rag.ts                    # Text chunking + BM25 search
│   └── prompts.ts                # System + query prompts
├── .env.local.example            # Environment template
├── vercel.json                   # Vercel function timeouts
└── README.md
```

---

## 🔧 How It Works

1. **Upload** — PDF is parsed server-side, split into overlapping text chunks
2. **Search** — BM25-inspired keyword search finds relevant spec sections
3. **Generate** — Relevant chunks are passed to Claude with expert prompts
4. **Answer** — Claude responds based only on spec content (no hallucination)

---

## 📋 Supported 3GPP Documents

- TS 38.101-x (5G NR UE radio requirements)
- TS 36.521 (LTE UE conformance)
- TS 38.521 (NR UE conformance)
- Any 3GPP TS/TR document in PDF format

### Get free 3GPP specs
👉 [https://www.3gpp.org/ftp/Specs/archive/38_series/38.101-1/](https://www.3gpp.org/ftp/Specs/archive/38_series/38.101-1/)

---

## ⚙️ Environment Variables

| Variable | Description | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | ✅ Yes |

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Claude (via Anthropic SDK)
- **PDF Parsing**: pdf-parse
- **Retrieval**: BM25-inspired keyword search (no external vector DB needed)

---

## 📈 Roadmap

- [ ] Multi-spec support (compare requirements across spec versions)
- [ ] SCPI / Python test script generation for R&S and Keysight
- [ ] Export to Excel with test management metadata
- [ ] User accounts and saved test case libraries
- [ ] 6G spec support as documents become available

---

## 🤝 Contributing

Pull requests welcome! Open an issue first to discuss major changes.

---

## 📄 License

MIT

---

*Built with ❤️ for RF test engineers by someone who spent years with R&S and Keysight instruments.*
