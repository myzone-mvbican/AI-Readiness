export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  company?: string;
}

export interface Team {
  id: number;
  name: string;
  memberCount: number;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamsResponse {
  success: boolean;
  teams: Team[];
  total: number;
  page: number;
  totalPages: number;
}