export interface AboutMe {
  photo: string;
  description: string;
}

export interface Study {
  title: string;
  startYear: number;
  endYear: number | null;
  place: string;
  website: string;
}

export interface Project {
  name: string;
  description: string;
  github: string;
}

export type Proficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | string;

export interface LanguageSkill {
  name: string;
  description: string;
  projects: string[];
  proficiency: Proficiency;
}

export interface ContactInfo {
  email: string;
  linkedin: string;
  github: string;
  phone: string;
}

export interface PortfolioData {
  aboutMe: AboutMe;
  studies: Study[];
  projects: Project[];
  languages: LanguageSkill[];
  contact: ContactInfo;
  cvUrl: string;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface ContactMessageResponse {
  ok: boolean;
  id?: string;
  createdAt?: string;
}
