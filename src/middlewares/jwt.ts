import jwt, { JwtPayload } from 'jsonwebtoken';

import 'dotenv/config';
import { NextFunction, Request, Response } from 'express';

const secretKey = process.env.SECRET_KEY as string;

export const verifyToken = async (req: any, res: Response, next: NextFunction) => {
	try {
		const token = req.headers.authorization.split(' ')[1];
		if (!token) {
			res.status(401).json({ auth: false, message: 'É necessário fazer login para acessar esta página.' });
			return;
		}
		const decoded = jwt.verify(token, secretKey);
		req.tokenValue = decoded;
		next();
	} catch (error) {
		res.status(401).json({ auth: false, message: 'Sessão expirada. Faça login novamente.' });
		return;
	}
};

export const createToken = async (value: any) => {
	// cria o token
	const token = await jwt.sign(value, secretKey, { expiresIn: '10h' }); //{id: "valor a ser criptografado"}, chave secreta, { expiresIn: 1h, 10m 30s}
	return token;
};
