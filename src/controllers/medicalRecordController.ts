import { Request, Response } from 'express';
import { User, Event, Patient, MedicalRecord } from '../models/model';

import { IToken } from '../interfaces/token';

interface CustomRequest extends Request {
	tokenValue?: IToken;
}

export const createMedicalRecord = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId, _id, role } = req.tokenValue as IToken;
		const doctorId = _id;
		if (role !== 'doctor') {
			res.status(400).json({ message: 'Usuário não tem permissão para criar um registro médico.' });
			return;
		}

		const {
			eventId,
			patientId,
			date,
			dateStart,
			dateEnd,
			dateConfirm,
			complaint,
			currentHistory,
			medicalHistory,
			physicalExam,
			diagnostic,
			conduct,
			prescription,
		} = req.body;

		if (!eventId || !patientId || !dateStart || !dateEnd || !dateConfirm) {
			res.status(400).json({ message: 'Preencha todos os dados.' });
			return;
		}

		const exist = await User.exists({ clinicId, _id });

		const patient = await Patient.exists({ clinicId, _id: patientId });

		if (!patient) {
			res.status(400).json({ message: 'Paciente não encontrado.' });
			return;
		}
		if (!exist) {
			res.status(400).json({ message: 'Usuário não encontrado.' });
			return;
		}

		const [newMedicalRecord] = await Promise.all([
			MedicalRecord.create({
				clinicId,
				patientId,
				doctorId,
				date,
				dateStart,
				dateEnd,
				dateConfirm,
				complaint,
				currentHistory,
				medicalHistory,
				physicalExam,
				diagnostic,
				conduct,
				prescription,
			}),
			Event.findOneAndUpdate({ _id: eventId, clinicId }, { status: 'atendido' }),
		]);
		res.status(201).json(newMedicalRecord);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const getMedicalRecord = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId, role } = req.tokenValue as IToken;
		const patientId = req.query.id;

		if (!patientId) {
			res.status(400).json({ message: 'Preencha todos os dados.' });
			return;
		}

		if (role !== 'doctor' && role !== 'admin') {
			res.status(400).json({ message: 'Usuário não tem permissão para criar um registro médico.' });
			return;
		}
		const medicalRecord = await MedicalRecord.find({ clinicId, patientId }).sort({ date: -1 });
		res.status(200).json(medicalRecord);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const initAtend = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId, role } = req.tokenValue as IToken;
		const { eventId, atendStart } = req.body;
		if (role !== 'doctor') {
			res.status(400).json({ message: 'Usuário não tem permissão para iniciar um atendimento.' });
			return;
		}
		if (!atendStart || !eventId) {
			res.status(400).json({ message: 'Ocorreu um erro na recepção de dados. Tente novamente!' });
			return;
		}
		const exist = await Event.findOne({ _id: eventId, clinicId, status: 'atendimento' });
		if (exist) {
			res.status(400).json({ message: 'Paciente já possui um atendimento em aberto.' });
			return;
		}
		const event = await Event.findOneAndUpdate({ _id: eventId, clinicId }, { status: 'atendimento', atendStart }, { new: true });
		if (!event) {
			res.status(400).json({ message: 'Ocorreu um erro na recepção de dados. Tente novamente!' });
			return;
		}
		res.status(200).json({ message: 'Status alterado com sucesso!', event });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};
