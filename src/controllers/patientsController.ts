import { Request, Response } from 'express';
import { IToken } from '../interfaces/token';
import { Event, Patient } from '../models/model';

interface CustomRequest extends Request {
	tokenValue?: IToken;
}

export const getPatient = async (req: CustomRequest, res: Response) => {
	try {
		const clinicId = req.tokenValue?.clinicId;
		const { patientId } = req.query;
		if (!patientId) {
			res.status(400).json({ message: 'Id do paciente não fornecido.' });
			return;
		}

		const patient = await Patient.findOne({ _id: patientId, clinicId }).select('-clinicId');
		res.status(201).json(patient);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const createPatient = async (req: CustomRequest, res: Response) => {
	try {
		const clinicId = req.tokenValue?.clinicId;
		const { name, nasc, cpf, mother, phone, email, plan, planNumber, gender } = req.body;
		if (!name || !nasc || !mother || !phone || !gender) {
			res.status(400).json({ message: 'Preencha todos os dados.' });
			return;
		}

		if (cpf && cpf.length != 11) {
			res.status(400).json({ message: 'Valor do CPF é inválido.' });
			return;
		}

		if (cpf && cpf.length === 11) {
			const exist = await Patient.findOne({ cpf, clinicId });
			if (exist) {
				res.status(400).json({ message: 'Este CPF já está sendo usado por outro paciente.' });
				return;
			}
		}

		const newPatient = await Patient.create({
			clinicId,
			name: name
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.toLowerCase(),
			nasc,
			cpf,
			gender,
			mother,
			phone,
			email,
			plan,
			planNumber,
		});
		res.status(201).json({ message: 'Paciente criado com sucesso!', newPatient });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const searchPatients = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId } = req.tokenValue as IToken;
		const { value } = req.query;
		if (!value || typeof value !== 'string') {
			res.status(400).json({ message: 'Preencha todos os dados.' });
			return;
		}
		if (!isNaN(Number(value))) {
			const patients = await Patient.find({ clinicId, cpf: { $regex: `^${value}`, $options: 'i' } }).select(
				'-clinicId -mother -gender'
			);
			res.status(200).json(patients);
			return;
		}

		const patients = await Patient.find({ clinicId, name: { $regex: `^${value}`, $options: 'i' } })
			.select('-clinicId -mother -gender')
			.limit(10)
			.sort({ name: 1 });
		res.status(200).json(patients);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const searchPatientsList = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId } = req.tokenValue as IToken;
		const { _id, name, nasc, cpf } = req.body;

		const findPatients = await Patient.find({
			$and: [{ name: { $regex: `^${name}`, $options: 'i' } }, { cpf: { $regex: `^${cpf}`, $options: 'i' } }],
			clinicId, // Mantém a correspondência exata para clinicId
		})
			.select('_id name nasc cpf name plan planNumber phone')
			.limit(20)
			.sort({ name: 1 });
		res.status(200).json(findPatients);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const updatePatient = async (req: CustomRequest, res: Response) => {
	try {
		const clinicId = req.tokenValue?.clinicId;
		const {
			_id,
			patientId,
			name,
			nasc,
			mother,
			phone,
			email,
			plan,
			planNumber,
			cep,
			address,
			addressNumber,
			neighborhood,
			city,
			state,
			gender,
		} = req.body;

		let { cpf } = req.body;

		if (!name || !nasc || !phone || !plan || !planNumber) {
			console.log(req.body);
			res.status(400).json({ message: 'Preencha todos os dados.' });
			return;
		}

		const exist = await Patient.findById({ _id: patientId, clinicId });
		if (!exist) {
			res.status(400).json({ message: 'Paciente não encontrado.' });
			return;
		}
		if (!exist.cpf) {
			if (cpf.length !== 11 && cpf.length !== 0) {
				res.status(400).json({ message: 'CPF com valor inválido.' });
				return;
			}
		} else {
			cpf = exist.cpf;
		}

		const [update] = await Promise.all([
			Patient.findByIdAndUpdate(
				{ _id: patientId, clinicId },
				{
					name: name
						.normalize('NFD')
						.replace(/[\u0300-\u036f]/g, '')
						.toLowerCase(),
					nasc,
					cpf,
					gender,
					mother,
					phone,
					email,
					plan,
					planNumber,
					cep,
					address,
					addressNumber,
					neighborhood,
					city,
					state,
				},
				{ new: true }
			),
			Event.updateMany(
				{ patientId },
				{
					title: name
						.normalize('NFD')
						.replace(/[\u0300-\u036f]/g, '')
						.toLowerCase(),
					phone,
					patientNasc: nasc,
					plan,
					planNumber,
				}
			),
		]);

		res.status(200).json({ message: 'Paciente alterado com sucesso!', update });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};
