import { SurveyQuestion, SurveySection } from "@/schemas/survey-schema";

// Function to parse CSV data
export const parseCSV = (csvData: string): SurveyQuestion[] => {
  const lines = csvData.split("\n");
  const headers = lines[0].split(",");
  
  return lines.slice(1).map((line) => {
    // Handle commas within quotes properly
    const parts = [];
    let part = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(part);
        part = "";
      } else {
        part += char;
      }
    }
    
    parts.push(part); // Add the last part
    
    return {
      number: parseInt(parts[0], 10),
      category: parts[1].replace(/"/g, ''),
      question: parts[2].replace(/"/g, ''),
      details: parts[3].replace(/"/g, '')
    };
  }).filter(q => !isNaN(q.number)); // Filter out any invalid entries
};

// Function to group questions by category
export const groupQuestionsByCategory = (questions: SurveyQuestion[]): SurveySection[] => {
  const categoriesMap: Record<string, SurveyQuestion[]> = {};
  
  questions.forEach((question) => {
    if (!categoriesMap[question.category]) {
      categoriesMap[question.category] = [];
    }
    categoriesMap[question.category].push(question);
  });
  
  return Object.entries(categoriesMap).map(([category, questions]) => ({
    category,
    questions: questions.sort((a, b) => a.number - b.number)
  }));
};

// Sample data for development purposes
const sampleReadinessData = `Question Number,Category,Question Summary,Question Details
1,Strategy & Vision,Our Vision / 3-year picture / 1-year plan explicitly considers an AGI future.,"A forward-looking vision sets the mental horizon that informs every budget, hire, and product decision."
2,Strategy & Vision,"The company sets at least one corporate AI Rock each quarter, with a measurable outcome.","Rocks create focus and accountability. A single, high-impact AI Rock every quarter prevents spreading effort across too many pilots."
3,Strategy & Vision,"Every team member sets one personal AI Rock each quarter, tailored to role and proficiency.","Individual Rocks democratise innovation. This ensures stretch without overwhelm, and distributed ownership prevents the 'AI is someone else's job' mindset."
4,Strategy & Vision,Our Ideal Customer Profile (ICP) is reviewed annually for AI alignment.,"Markets move when technology does. Reviewing the ICP with an AI lens asks questions like: 'Will our customers' pain points stay the same once they adopt automation?'"
5,Culture & Change-Readiness,Staff feel safe proposing automation ideas.,"Psychological safety determines whether innovation surfaces or stays hidden. Establish explicit policy and consistent behavior by recognizing and rewarding automation ideas."
6,Culture & Change-Readiness,"AI-related wins are celebrated publicly (Slack, all-hands, etc.).","Celebration turns isolated success into shared momentum. Public praise rewards the innovator, educates peers, and brands the company as forward-thinking."
7,Culture & Change-Readiness,We follow a simple communication plan for any tech change.,"Even beneficial tools fail without clear messaging. Answer: What's changing? Why now? What's expected of me? Where do I get help?"
8,Skills & Literacy,"Every team member sets an AI-Educational Rock each quarter, tailored to role and proficiency.","Personal Rocks turn abstract 'learn AI' goals into concrete, time-boxed commitments that ensure relevance and unlock quick productivity wins."
9,Skills & Literacy,We assess digital/AI literacy for every team member twice a year and tailor follow-up training plans.,"Semi-annual assessment captures improvement but respects bandwidth. Results feed individual learning plans to cut time-to-competence."
10,Data & Information,A single Data Champion owns company-wide data practices.,"Nominating a Data Champion creates a clear go-to for questions, approvals, and standards, accelerating AI readiness by streamlining data workflows."`;

// Load and parse the survey data
export const loadSurveyData = async (): Promise<SurveySection[]> => {
  try {
    // In a real implementation, this would fetch from a server or local file
    // const response = await fetch('/path/to/survey-data.csv');
    // const csvData = await response.text();
    
    // For development, we'll use the embedded sample data
    const csvData = sampleReadinessData;
    const questions = parseCSV(csvData);
    return groupQuestionsByCategory(questions);
  } catch (error) {
    console.error("Error loading survey data:", error);
    return [];
  }
};