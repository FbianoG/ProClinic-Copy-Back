import { Request, Response } from 'express';
import { Clinic, User } from '../models/model';
import { comparePassword, hashPassword } from '../middlewares/bcrypt';
import { createToken } from '../middlewares/jwt';
import { IToken } from '../interfaces/token';
import joi from 'joi';

interface CustomRequest extends Request {
	tokenValue?: IToken;
}

export const createUser = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId } = req.tokenValue as IToken;
		const { name, login, password, role, crm, cbo } = req.body;

		if (!name || !login || !password || !role || !clinicId) {
			res.status(400).json({ message: 'Preencha todos os dados.' });
			return;
		}

		if (role === 'doctor' && (!crm || !cbo)) {
			res.status(400).json({ message: 'Preencha os campos CRM e CBO.' });
			return;
		}

		if (role === 'admin' && (crm.length != 8 || cbo.length != 6)) {
			res.status(400).json({ message: 'CRM ou CBO inválido' });
			return;
		}

		const exist = await User.exists({ login });
		if (exist) {
			res.status(400).json({ message: 'Login já está sendo usado por outro usuário.' });
			return;
		}

		const passwordHash = await hashPassword(password);
		const userCreate = await User.create({ name, login, password: passwordHash, role, clinicId, cbo, crm });
		res.status(201).json({ message: 'Usuário criado com sucesso!', userCreate });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const login = async (req: Request, res: Response) => {
	try {
		const schema = joi.object({
			login: joi
				.string()
				.pattern(/^[a-zA-Z0-9 ]+$/)
				.min(3)
				.max(10)
				.required()
				.lowercase()
				.trim()
				.messages({
					'string.pattern.base': 'O login deve conter apenas letras e números.',
					'string.min': 'O login deve conter pelo menos 3 caracteres.',
					'string.max': 'O login deve conter pelo menos 8 caracteres.',
				}),
			password: joi.string().min(3).max(8).trim().required().messages({
				'string.min': 'A senha deve conter pelo menos 3 caracteres.',
				'string.max': 'A senha deve conter pelo menos 8 caracteres.',
			}),
		});

		const { error, value } = schema.validate(req.body);

		if (error) {
			res.status(400).json({ message: error.message });
			return;
		}

		const { login, password } = value;

		if (!login || !password) {
			res.status(400).json({ message: 'Preencha todos os dados.' });
			return;
		}

		const exist = await User.findOne({ login });
		if (!exist) {
			res.status(400).json({ message: 'Login ou senha inválidos.' });
			return;
		}

		const match = await comparePassword(password, exist.password);
		if (!match) {
			res.status(400).json({ message: 'Login ou senha inválidos.' });
			return;
		}
		const clinic = await Clinic.findOne({ _id: exist.clinicId }).select('-_id');
		if (!clinic) throw new Error('Clinica não encontrada');

		const token = await createToken({
			_id: exist._id,
			name: exist.name,
			login: exist.login,
			role: exist.role,
			clinicId: exist.clinicId,
		});

		const user = {
			_id: exist._id,
			name: exist.name,
			login: exist.login,
			role: exist.role,
			crm: exist.crm,
			cbo: exist.cbo,
		};

		res.status(201).json({ message: 'Logado com sucesso!', auth: true, user, token, clinic });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const getDoctors = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId } = req.tokenValue as IToken;
		const doctor = await User.find({ role: 'doctor', clinicId }).select('_id name crm cbo role');
		res.status(200).json(doctor);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const getUsers = async (req: CustomRequest, res: Response) => {
	try {
		const users = await User.find().select('_id name login role').sort({ role: 1 });
		res.status(200).json({ message: 'Usuários encontrados com sucesso!', users });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const updateUser = async (req: CustomRequest, res: Response) => {
	try {
		const { _id, role } = req.tokenValue as IToken;
		const { name, login, oldPassword, newPassword, crm, cbo } = req.body;

		if (!name || !login) {
			res.status(400).json({ message: 'Preencha todos os dados.' });
			return;
		}

		if (role === 'doctor' && (!crm || !cbo)) {
			res.status(400).json({ message: 'Preencha todos os dados.' });
			return;
		}

		// verifica se o login ja existe
		const exist = await User.exists({ login, _id: { $ne: _id } });
		if (exist) {
			res.status(400).json({ message: 'Login já esta em uso por outro usuário.' });
			return;
		}

		// verifica se o usuario existe
		const findUser = await User.findOne({ _id }).select('password');
		if (!findUser) {
			res.status(400).json({ message: 'Usuário não encontrado.' });
			return;
		}

		// atualiza a senha
		let passwordHash;
		if (oldPassword && newPassword) {
			const match = await comparePassword(oldPassword, findUser.password);
			if (!match) {
				res.status(400).json({ message: 'Senha atual não confere.' });
				return;
			}
			passwordHash = await hashPassword(newPassword);
		}

		// atualiza o usuário
		const user = await User.findOneAndUpdate({ _id }, { name, login, password: passwordHash, crm, cbo }, { new: true });

		if (!user) {
			res.status(400).json({ message: 'Usuário não encontrado.' });
			return;
		}

		// cria o token
		const token = await createToken({
			_id: user._id,
			name: user.name,
			login: user.login,
			role: user.role,
			clinicId: user.clinicId,
		});

		res.status(200).json({ message: 'Usuário atualizado com sucesso!', user, token });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};
