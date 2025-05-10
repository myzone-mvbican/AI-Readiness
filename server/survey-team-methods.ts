// Survey-Team junction table methods - add these to the DatabaseStorage class
async getSurveyTeams(surveyId: number): Promise<number[]> {
  try {
    const results = await db
      .select({ teamId: surveyTeams.teamId })
      .from(surveyTeams)
      .where(eq(surveyTeams.surveyId, surveyId));
    
    return results.map(result => result.teamId);
  } catch (error) {
    console.error(`Error getting teams for survey ${surveyId}:`, error);
    return [];
  }
}

async addSurveyTeam(surveyId: number, teamId: number): Promise<void> {
  try {
    await db
      .insert(surveyTeams)
      .values({ surveyId, teamId })
      .onConflictDoNothing();
  } catch (error) {
    console.error(`Error adding team ${teamId} to survey ${surveyId}:`, error);
    throw error;
  }
}

async removeSurveyTeam(surveyId: number, teamId: number): Promise<void> {
  try {
    await db
      .delete(surveyTeams)
      .where(
        and(
          eq(surveyTeams.surveyId, surveyId),
          eq(surveyTeams.teamId, teamId)
        )
      );
  } catch (error) {
    console.error(`Error removing team ${teamId} from survey ${surveyId}:`, error);
    throw error;
  }
}

async updateSurveyTeams(surveyId: number, teamIds: number[]): Promise<void> {
  try {
    // Begin a transaction
    await db.transaction(async (tx) => {
      // Delete all existing survey-team relations
      await tx
        .delete(surveyTeams)
        .where(eq(surveyTeams.surveyId, surveyId));
      
      // Insert new survey-team relations if any
      if (teamIds.length > 0) {
        await tx
          .insert(surveyTeams)
          .values(
            teamIds.map(teamId => ({ surveyId, teamId }))
          );
      }
    });
  } catch (error) {
    console.error(`Error updating teams for survey ${surveyId}:`, error);
    throw error;
  }
}