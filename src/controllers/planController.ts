import { Request, Response } from 'express';
import Joi from 'joi';
import { IToken } from '../interfaces/token';
import { Plan } from '../models/model';

interface CustomRequest extends Request {
	tokenValue?: IToken;
}

export const getPlans = async (req: CustomRequest, res: Response) => {
	try {
		const clinicId = req.tokenValue?.clinicId;
		const plans = await Plan.find({ clinicId }).sort({ name: 1 });
		res.status(200).json(plans);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const createPlan = async (req: CustomRequest, res: Response) => {
	try {
		const clinicId = req.tokenValue?.clinicId;

		const schema = Joi.object({
			name: Joi.string()
				.pattern(/^[a-zA-Z0-9 ]+$/)
				.min(3)
				.required()
				.lowercase()
				.messages({
					'string.pattern.base': 'O nome do plano deve conter apenas letras, números e espaços.',
					'string.min': 'O nome do plano deve conter pelo menos 3 caracteres.',
					'any.required': 'O nome do plano é obrigatório.',
				})
				.trim(),
			login: Joi.string().allow(null, ''),
			password: Joi.string().allow(null, ''),
			web: Joi.string().allow(null, ''),
			src: Joi.string().allow(null, ''),
			cod: Joi.string().allow(null, ''),
			tel: Joi.string().allow(null, ''),
			email: Joi.string().email().allow(null, ''),
			obs: Joi.string().allow(null, ''),
		});

		const { error, value } = schema.validate(req.body);

		if (error) {
			console.log(error);
			res.status(400).json({ message: error.message });
			return;
		}

		const { name, login, password, web, src, cod, tel, email, obs } = value;

		if (!name || !clinicId) {
			res.status(400).json({ message: 'É necessário fornecer o nome do plano' });
			return;
		}
		const planExist = await Plan.findOne({ name, clinicId });
		if (planExist) {
			res.status(400).json({ message: 'O nome do plano já está sendo utilizado.' });
			return;
		}
		const create = await Plan.create({ clinicId, name, login, password, web, src, cod, tel, email, obs });
		res.status(201).json({ message: 'Plano de saúde criado com sucesso!', create });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const editPlan = async (req: CustomRequest, res: Response) => {
	try {
		const clinicId = req.tokenValue?.clinicId;

		const schema = Joi.object({
			_id: Joi.string().required(),
			name: Joi.string()
				.required()
				.pattern(/^[a-zA-Z0-9 ]+$/)
				.min(3)
				.required()
				.lowercase()
				.messages({
					'string.pattern.base': 'O nome do plano deve conter apenas letras, números e espaços.',
					'string.min': 'O nome do plano deve conter pelo menos 3 caracteres.',
					'any.required': 'O nome do plano é obrigatório.',
				})
				.trim(),
			login: Joi.string().allow(null, ''),
			password: Joi.string().allow(null, ''),
			web: Joi.string().allow(null, ''),
			src: Joi.string().allow(null, ''),
			cod: Joi.string().allow(null, ''),
			tel: Joi.string().allow(null, ''),
			email: Joi.string().email().allow(null, ''),
			obs: Joi.string().allow(null, ''),
		});

		const { error, value } = schema.validate(req.body);

		if (error) {
			console.log(error);
			res.status(400).json({ message: error.message });
			return;
		}

		const { _id, name, login, password, web, src, cod, tel, email, obs } = value;

		const planExist = await Plan.findOne({ name, clinicId });

		if (planExist && planExist._id.toString() !== _id) {
			res.status(400).json({ message: 'O nome do plano já está sendo utilizado.' });
			return;
		}
		const update = await Plan.findOneAndUpdate(
			{ _id, clinicId },
			{ name, login, password, web, cod, src, tel, email, obs },
			{ new: true }
		);
		res.status(201).json({ message: 'Plano de saúde editado com sucesso!', update });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const editTussPlan = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId, role } = req.tokenValue as IToken;

		if (role !== 'admin') {
			res.status(400).json({ message: 'Usuário não tem permissão para alterar valores Tuss.' });
			return;
		}

		const schema = Joi.object({
			planId: Joi.string().required(),
			codigo: Joi.string().required(),
			procedimento: Joi.string().required(),
			price: Joi.number().required(),
		});

		const { error, value } = schema.validate(req.body);

		if (error) {
			console.log(error);
			res.status(400).json({ message: error.message });
			return;
		}

		const { planId, codigo, procedimento, price } = value;

		const update = await Plan.findOneAndUpdate(
			{ _id: planId, clinicId, 'tuss.codigo': codigo },
			{ $set: { 'tuss.$.price': price } },
			{ new: true }
		);

		if (!update) {
			await Plan.findOneAndUpdate({ _id: planId, clinicId }, { $push: { tuss: { codigo, procedimento, price } } }, { new: true });
			res.status(201).json({ message: 'Tuss incluído com sucesso!' });
			return;
		}

		res.status(201).json({ message: 'Tuss editado com sucesso!' });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor.' });
		return;
	}
};
