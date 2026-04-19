export type QueryParams = {
  [key: string]: string | string[] | undefined;
};

export type PaperCard = {
  id: string;
  title: string;
  authors: string;
  metrics: string;
  date: string;
  insight: string;
  tags: string[];
  badges: string[];
};

export type StatCard = {
  id: string;
  value: string;
  label: string;
  accent?: boolean;
};

export type Researcher = {
  id: string;
  initials: string;
  name: string;
  citations: string;
  rank: string;
};

export type PublicationTrendPoint = {
  year: number;
  papers: number;
};

export const papers: PaperCard[] = [
  {
    id: "p1",
    title: "Advances in Transformer Architectures for Natural Language Understanding",
    authors: "Dr. Sarah Chen, Prof. Maria Rodriguez, Dr. James Kim",
    metrics: "342",
    date: "Feb 2026",
    insight:
      "Novel attention mechanism reduces transformer complexity by 40% while maintaining SOTA performance. Key innovation: sparse attention patterns that preserve long-range dependencies.",
    tags: ["transformers", "NLP", "attention-mechanism"],
    badges: ["Trending", "ARXIV"],
  },
  {
    id: "p2",
    title: "Ethical Considerations in Large Language Model Deployment",
    authors: "Prof. Aisha Patel, Dr. Emily Wong, Dr. Lisa Anderson",
    metrics: "218",
    date: "Jan 2026",
    insight:
      "Proposes ethical framework for LLM deployment covering bias detection, fairness metrics, and accountability measures. Identifies key gaps in current practices.",
    tags: ["ethics", "LLM", "responsible-AI"],
    badges: [],
  },
  {
    id: "p3",
    title: "Energy-Efficient Training Methods for Deep Neural Networks",
    authors: "Dr. Maya Johnson, Prof. Rachel Green, Dr. Sofia Martinez",
    metrics: "156",
    date: "Dec 2025",
    insight:
      "Introduces hybrid optimization pipeline reducing training energy by 27% across benchmark models, with minimal accuracy loss.",
    tags: ["efficiency", "training", "deep-learning"],
    badges: ["Trending", "ARXIV"],
  },
  {
    id: "p4",
    title: "Multimodal Learning: Bridging Vision and Language",
    authors: "Dr. Jennifer Lee, Prof. Alexandra Silva, Dr. Nina Patel",
    metrics: "289",
    date: "Nov 2025",
    insight:
      "Unified framework for vision-language integration shows 25% improvement on multimodal tasks. Novel cross-attention mechanism enables better modality fusion.",
    tags: ["multimodal", "vision-language", "cross-attention"],
    badges: ["Trending", "ARXIV"],
  },
  {
    id: "p5",
    title: "Federated Learning for Privacy-Preserving Healthcare Applications",
    authors: "Dr. Laura Thompson, Prof. Michelle Chang, Dr. Rebecca Davis",
    metrics: "194",
    date: "Oct 2025",
    insight:
      "Healthcare-focused federated learning maintains 95% of centralized model accuracy while ensuring full privacy compliance. Addresses HIPAA and GDPR requirements.",
    tags: ["federated-learning", "healthcare", "privacy"],
    badges: [],
  },
];

export const trendingTopics = [
  { label: "Large Language Models", count: "1247" },
  { label: "Diffusion Models", count: "892" },
  { label: "Transformers", count: "2156" },
  { label: "Federated Learning", count: "634" },
];

export const researchGaps = [
  "Ethical frameworks for AI deployment",
  "Energy-efficient model architectures",
  "Multilingual NLP capabilities",
  "Cross-domain transfer learning",
];

export const publicationYears = ["2026", "2025", "2024", "2023", "2022"];

export const categories = [
  "Machine Learning",
  "Deep Learning",
  "Natural Language Processing",
  "Computer Vision",
  "Reinforcement Learning",
];

export const stats: StatCard[] = [
  { id: "total-papers", value: "480", label: "Total Papers" },
  { id: "total-citations", value: "12.8k", label: "Total Citations" },
  {
    id: "active-researchers",
    value: "1.2k",
    label: "Active Researchers",
    accent: true,
  },
];

export const researchers: Researcher[] = [
  {
    id: "r1",
    initials: "SC",
    name: "Dr. Sarah Chen",
    citations: "2,845 citations",
    rank: "#1",
  },
  {
    id: "r2",
    initials: "MR",
    name: "Prof. Maria Rodriguez",
    citations: "2,156 citations",
    rank: "#2",
  },
  {
    id: "r3",
    initials: "AP",
    name: "Dr. Aisha Patel",
    citations: "1,923 citations",
    rank: "#3",
  },
];

export const publicationTrendHeights = ["40%", "62%", "84%", "100%", "70%"];

export const publicationTrendData: PublicationTrendPoint[] = [
  { year: 2022, papers: 46 },
  { year: 2023, papers: 78 },
  { year: 2024, papers: 112 },
  { year: 2025, papers: 156 },
  { year: 2026, papers: 92 },
];
