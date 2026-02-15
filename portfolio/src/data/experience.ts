// src/data/experience.ts
export type ExperienceSection = {
  id: string;
  title: string;
  years?: string;
  summary: string;
  points: string[];
  tech: string[];
  tStart: number; // 0–1: Start des Abschnitts auf dem Scroll/Pfad
  tEnd: number; // 0–1: Ende
  env: {
    background: string;
    fogColor: string;
    lightIntensity: number;
    accent: string;
  };
};

export const experienceSections: ExperienceSection[] = [
  {
    id: "projects",
    title: "Projects",
    summary: "Private und betriebsbezogene Projekte.",
    points: [
      "Robotik-AG und erste Arduino/Processing-Experimente",
      "Teamwettbewerbe, Präsentationen, frühes Prototyping",
      "Faszination für 3D/Grafik geweckt",
    ],
    tech: ["Arduino", "Processing", "Scratch", "Blender"],
    tStart: 0.0,
    tEnd: 0.33,
    env: {
      background: "#1b1e3b",
      fogColor: "#0a0c1c",
      lightIntensity: 0.6,
      accent: "#90e0ef",
    },
  },
  {
    id: "accounts",
    title: "Accounts",
    years: "2017–2020",
    summary: "Werkbank und Code: Hardware nahe Software, reale Kundenprojekte.",
    points: [
      "Elektrotechnik/IT-Ausbildung mit Praxisprojekten",
      "Microcontroller, Sensorik und Steuerungssoftware",
      "Kollaboration mit Werkstatt & Dev-Team",
    ],
    tech: ["C", "Python", "KiCad", "Raspberry Pi"],
    tStart: 0.33,
    tEnd: 0.66,
    env: {
      background: "#10241a",
      fogColor: "#08140e",
      lightIntensity: 0.9,
      accent: "#8bc34a",
    },
  },
  {
    id: "interests",
    title: "Interessen",
    years: "2021–Heute",
    summary:
      "Futuristische Interfaces, WebGL/Three.js und produktreife Features.",
    points: [
      "3D/WebGL Experiences und interaktive Dashboards",
      "Systemdesign, DX-Verbesserungen, Performancetuning",
      "Enge Zusammenarbeit mit Product & Design",
    ],
    tech: ["TypeScript", "React", "Three.js", "Next.js"],
    tStart: 0.9,
    tEnd: 1.0,
    env: {
      background: "#0d0f18",
      fogColor: "#04050a",
      lightIntensity: 1.2,
      accent: "#7c3aed",
    },
  },
];
