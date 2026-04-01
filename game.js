const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const DATA_FILE = './data/game_data.json';

router.get('/status', async (req, res) => {
    if (!req.session.teamName) return res.status(401).send();
    const data = await fs.readJson(DATA_FILE);
    const team = data.teams.find(t => t.name === req.session.teamName);
    const question = data.questions[team.currentStage];

    if (!question) return res.json({ finished: true, score: team.score });
    
    res.json({ 
        stage: team.currentStage, 
        total: data.questions.length,
        question: question.text,
        score: team.score
    });
});

router.post('/answer', async (req, res) => {
    const { answer } = req.body;
    const data = await fs.readJson(DATA_FILE);
    const team = data.teams.find(t => t.name === req.session.teamName);
    const question = data.questions[team.currentStage];

    if (answer.toLowerCase().trim() === question.answer.toLowerCase()) {
        team.currentStage++;
        if (team.currentStage >= data.questions.length) {
            team.endTime = Date.now();
            // Bonus for speed: 1000 - seconds taken
            const timeTaken = Math.floor((team.endTime - team.startTime) / 1000);
            team.score += Math.max(0, 500 - timeTaken);
        }
        await fs.writeJson(DATA_FILE, data);
        return res.json({ correct: true });
    }
    res.json({ correct: false });
});

router.get('/hint', async (req, res) => {
    const data = await fs.readJson(DATA_FILE);
    const team = data.teams.find(t => t.name === req.session.teamName);
    const question = data.questions[team.currentStage];
    team.score -= 50; // Penalty
    team.hintsUsed++;
    await fs.writeJson(DATA_FILE, data);
    res.json({ hint: question.hint });
});

router.get('/leaderboard', async (req, res) => {
    const data = await fs.readJson(DATA_FILE);
    const sorted = data.teams.sort((a, b) => b.score - a.score);
    res.json(sorted);
});

module.exports = router;