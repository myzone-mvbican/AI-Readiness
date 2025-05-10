// Survey-Team junction table methods - add these to the MemStorage class
async getSurveyTeams(surveyId: number): Promise<number[]> {
  const teamIds: number[] = [];
  
  // Loop through surveyTeams and collect teamIds for this surveyId
  for (const [key, relation] of this.surveyTeams.entries()) {
    if (relation.surveyId === surveyId) {
      teamIds.push(relation.teamId);
    }
  }
  
  return teamIds;
}

async addSurveyTeam(surveyId: number, teamId: number): Promise<void> {
  const key = `${surveyId}-${teamId}`;
  
  // Only add if it doesn't exist
  if (!this.surveyTeams.has(key)) {
    this.surveyTeams.set(key, { surveyId, teamId });
  }
}

async removeSurveyTeam(surveyId: number, teamId: number): Promise<void> {
  const key = `${surveyId}-${teamId}`;
  this.surveyTeams.delete(key);
}

async updateSurveyTeams(surveyId: number, teamIds: number[]): Promise<void> {
  // First, remove all existing relations for this survey
  for (const [key, relation] of this.surveyTeams.entries()) {
    if (relation.surveyId === surveyId) {
      this.surveyTeams.delete(key);
    }
  }
  
  // Then add new relations
  for (const teamId of teamIds) {
    const key = `${surveyId}-${teamId}`;
    this.surveyTeams.set(key, { surveyId, teamId });
  }
}