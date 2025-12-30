export interface RecommendedTag {
  tag: string
  description: string
  videos: string[]
}

export const RECOMMENDED_TAGS: RecommendedTag[] = [
  {
    tag: "J-POP",
    description: "Bright, upbeat picks for a neon-lit Tokyo stroll.",
    videos: [
      "https://youtu.be/CkvWJNt77mU?si=94MfSBOPO_chcM9i",
      "https://youtu.be/OLRbIc8KZ_8?si=aV6UKHYAonqwP5vZ",
      "https://youtu.be/ENcnYh79dUY?si=RbS7_FtB0MezEP82",
    ],
  },
  {
    tag: "TONGUE",
    description: "Playful tone-and-mood experiments with vocals and beats.",
    videos: [
      "https://youtu.be/YXfLjIgvhD0?si=hXC4AE6o9g9xsjXg",
      "https://youtu.be/Ryn5oAQppro?si=gL7udF1AgIWAACML",
      "https://youtu.be/hf_hW1VgbEA?si=vL_MfLPZw1QVrurp",
    ],
  },
]
