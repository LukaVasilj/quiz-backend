const fs = require('fs');
const path = require('path');

const questionsFilePath = path.join(__dirname, 'randomFacts.json');

const loadQuestions = () => {
  try {
    const data = fs.readFileSync(questionsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading questions:', error);
    return [];
  }
};

const generateTrainingQuestion2 = (category) => {
  const randomFacts = loadQuestions();
  const filteredFacts = randomFacts.filter(fact => fact.category === category);
  if (filteredFacts.length === 0) {
    return { error: `No questions available for category ${category}` };
  }
  const randomFact = filteredFacts[Math.floor(Math.random() * filteredFacts.length)];
  return {
    type: 'input',
    question: `${randomFact.question}`,
    correctAnswer: randomFact.answer
  };
};

module.exports = { generateTrainingQuestion2 };