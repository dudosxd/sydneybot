import express from 'express';

export async function webserv() {
    const app = express();

    const port = 7860;

    app.get('/', (req, res) => {
        res.send('Hello World!');
    });

    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
}
