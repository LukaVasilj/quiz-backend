const fs = require('fs');
const path = require('path');

const loadQuestions = (category) => {
  const questionsFilePath = path.join(__dirname, `${category}-mc.json`);
  try {
    const data = fs.readFileSync(questionsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading questions for category ${category}:`, error);
    return [];
  }
};

const generateTrainingQuestion = (category) => {
  const trainingQuestions = loadQuestions(category);
  if (trainingQuestions.length === 0) {
    return { error: `No questions available for category ${category}` };
  }
  const randomQuestion = trainingQuestions[Math.floor(Math.random() * trainingQuestions.length)];
  return randomQuestion;
};

module.exports = { generateTrainingQuestion };