import { Request, Response } from 'express';
import { User, Event, Patient, MedicalRecord, Plan, Clinic } from '../models/model';

import { IToken } from '../interfaces/token';
import { date } from 'joi';

interface CustomRequest extends Request {
	tokenValue?: IToken;
}

export const getDashboard = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId, _id, role } = req.tokenValue as IToken;
		const [doctorEvents, plans, doctors] = await Promise.all([
			Event.find(
				role === 'doctor'
					? { clinicId, status: { $ne: 'bloqueado' }, doctor: _id, start: { $gte: Date.now() - 26 * 24 * 60 * 60 * 1000 } }
					: {
							clinicId,
							status: { $ne: 'bloqueado' },
							start: { $gte: Date.now() - 26 * 24 * 60 * 60 * 1000, $lte: Date.now() + 5 * 24 * 60 * 60 * 1000 },
					  }
			).select('doctor status type plan confirmed start patientNasc -_id'),
			Plan.find({ clinicId }).sort({ name: 1 }),
			User.find({ clinicId, role: 'doctor' }).sort({ name: 1 }),
		]);

		res.status(200).json({ doctorEvents, plans, doctors });
		return;
	} catch (error) {
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const getAgenda = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId, _id, role } = req.tokenValue as IToken;

		// ! Quando em produção, a hora é +00:00, quando em desenvolvimento -03:00. Sabado 21h puxa a agenda da semana seguinte, portanto precisa ser ajustado.
		const now = new Date();

		// Ajuste para UTC -3
		const offsetTime = now.getTime() - 3 * 60 * 60 * 1000;

		// Primeiro dia da semana (domingo)
		const startOfWeek = new Date(offsetTime);
		startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Ajusta para o domingo atual
		startOfWeek.setHours(0, 0, 0, 0); // Define a hora para 00:00:00

		// Último dia da semana (sábado)
		const endOfWeek = new Date(offsetTime);
		endOfWeek.setDate(endOfWeek.getDate() - endOfWeek.getDay() + 6); // Ajusta para o sábado atual
		endOfWeek.setHours(23, 59, 59, 999); // Define a hora para 23:59:59

		// ! Configurar depois para puxar eventos do médico selecionado para diminuir tamanho de dados do servidor. Atualmente puxa de todos os médicos quando role === 'admin' ou 'recep'
		// ! Possivel que irei utilizar query com id do médico selecionado
		const [events, waitEvents, plans, doctors, clinic] = await Promise.all([
			Event.find(
				role === 'doctor'
					? { clinicId, doctor: _id, start: { $gte: startOfWeek, $lte: endOfWeek } }
					: { clinicId, start: { $gte: startOfWeek, $lte: endOfWeek } }
			).select('-userId -clinicId -__v -atendStart -confirm'),
			Event.find(
				role === 'doctor'
					? { clinicId, doctor: _id, status: { $in: ['chegada', 'atendimento'] } }
					: { clinicId, status: { $in: ['chegada', 'atendimento'] } }
			)
				.select('doctor status type plan start patientNasc title _id patientId')
				.sort({ start: 1 }),
			Plan.find({ clinicId }).sort({ name: 1 }),
			User.find({ role: 'doctor', clinicId }).sort({ name: 1 }),
			Clinic.findById(clinicId),
		]);
		res.status(200).json({ events, waitEvents, plans, doctors, clinic });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const updateEditEvent = async (req: CustomRequest, res: Response) => {
	try {
		const clinicId = req.tokenValue?.clinicId;
		const userId = req.tokenValue?._id;
		const { _id, patientId, patientNasc, title, phone, plan, planNumber, doctor, start, end, type, blocked, status, obs } = req.body;

		const exist = await Event.findOne({ _id, clinicId });

		if (exist?.status != 'agendado') {
			res.status(400).json({
				message: 'Nao é possivel alterar o status da consulta. Paciente já está com chegada, atendindo ou em atendimento',
			});
			return;
		}
		const [event, patient] = await Promise.all([
			Event.findOneAndUpdate(
				{ _id, clinicId },
				{
					userId,
					patientId,
					patientNasc,
					title: title
						.normalize('NFD')
						.replace(/[\u0300-\u036f]/g, '')
						.toLowerCase(),
					phone,
					plan,
					doctor,
					start,
					end,
					type,
					blocked,
					status,
					planNumber,
					obs,
				},
				{ new: true }
			),
			Patient.findOneAndUpdate(
				{ _id: patientId, clinicId },
				{
					name: title
						.normalize('NFD')
						.replace(/[\u0300-\u036f]/g, '')
						.toLowerCase(),
					plan,
					planNumber,
					nasc: patientNasc,
					phone,
				},
				{ new: true }
			),
			Event.updateMany({ clinicId, patientId, status: { $ne: 'atendido' } }, { title, plan, planNumber, phone, patientNasc }),
		]);
		res.status(200).json({ message: 'Evento alterado com sucesso!', event, patient });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const getAtend = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId, _id, role } = req.tokenValue as IToken;
		const { patientId } = req.query;

		if (!patientId) {
			res.status(400).json({ message: 'Prontuário do paciente não fornecido.' });
			return;
		}

		const [patient, medicalRecords, waitEvents, doctors, plans] = await Promise.all([
			Patient.findOne({ _id: patientId, clinicId }),
			MedicalRecord.find({ patientId, clinicId })
				.sort({ date: -1 })
				.select(role === 'recep' ? 'doctorId date dateConfirm dateEnd dateStart -_id' : ' -__v  -clinicId -_id'),
			Event.find({
				clinicId,
				status: { $in: ['chegada', 'atendimento'] },
				patientId,
				...(role === 'doctor' ? { doctor: _id } : {}),
			})
				.select('doctor status type plan start patientNasc title _id patientId atendStart confirm ')
				.sort({ start: 1 }),
			User.find({ role: 'doctor', clinicId }).select('-password -login -role -clinicId').sort({ name: 1 }),
			Plan.find({ clinicId }).sort({ name: 1 }),
		]);
		res.status(200).json({ patient, medicalRecords, waitEvents, doctors, plans });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const getReports = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId, _id, role } = req.tokenValue as IToken;
		const { type, doctor, start, end } = req.query;
		if (!start || !end) {
			res.status(400).json({ message: 'Data inicial ou final nao fornecida.' });
			return;
		}
		const dateStart = new Date(start as string).setHours(0, 0, 0, 0);
		const dateEnd = new Date(end as string).setHours(23, 59, 59, 999);

		if (role === 'recep') {
			res.status(400).json({ message: 'Usuário não tem permissão para acessar esse recurso.' });
			return;
		}
		if (doctor === 'todos') {
			const report = await Event.find({ clinicId, status: 'atendido', start: { $gte: dateStart, $lte: dateEnd } }).select(
				'plan start doctor -_id'
			);
			res.status(200).json(report);
			return;
		}
		const report = await Event.find({ clinicId, doctor, status: 'atendido', start: { $gte: dateStart, $lte: dateEnd } }).select(
			'plan start -_id'
		);
		res.status(200).json(report);
		return;
	} catch (error) {}
};
