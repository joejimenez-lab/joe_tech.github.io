const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

app.post('/save-data', (req, res) => {
    const { ip, city, region, country, browser, screenWidth, screenHeight } = req.body;
    const csvLine = `${ip},${city},${region},${country},${browser},${screenWidth},${screenHeight}\n`;

    fs.appendFile('user_data.csv', csvLine, (err) => {
        if (err) {
            console.error('Error saving data:', err);
            res.status(500).send('Error saving data');
        } else {
            res.send('Data saved successfully');
        }
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
