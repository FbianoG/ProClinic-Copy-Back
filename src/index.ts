import express, { Request, Response } from 'express';
import cors from 'cors';
import ConnectDataBase from './dataBase/db';
import router from './routes/router';

const app = express();
const port = 4000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(router);

app.get('/', (req: Request, res: Response) => {
	res.send('Server is Running');
});

ConnectDataBase();

app.listen(port, () => {
	console.log(`Servidor funcionando: http://localhost:` + port);
});
