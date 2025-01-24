import { Request, Response } from 'express';
import { User, Event, Patient, MedicalRecord, Plan } from '../models/model';

import { IToken } from '../interfaces/token';

interface CustomRequest extends Request {
	tokenValue?: IToken;
}

export const createEvent = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId, _id } = req.tokenValue as IToken;
		const { patientId, patientNasc, title, phone, plan, planNumber, doctor, start, end, type, status, obs } = req.body;

		if (new Date(start).toString().split(' ')[0] === 'Sat' || new Date(start).toString().split(' ')[0] === 'Sun') {
			res.status(400).json({ message: 'Não é possível agendar nos finais de semana.' });
			return;
		}

		if (new Date(start).getTime() < new Date().getTime()) {
			res.status(400).json({ message: 'Data selecionada é inferior ao dia de hoje.' });
			return;
		}

		const newEvent = await Event.create({
			userId: _id,
			clinicId,
			patientNasc,
			patientId,
			title: title
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.toLowerCase(),
			phone,
			plan,
			planNumber,
			doctor,
			start,
			end,
			type,
			status,
			obs,
		});
		res.status(201).json(newEvent);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const getEvents = async (req: CustomRequest, res: Response) => {
	try {
		const { _id, clinicId, role } = req.tokenValue as IToken;
		const { date } = req.query;
		if (date) {
			const startOfWeek = new Date(date as string); // A data já é o início da semana

			// Calculando o último dia da semana (sábado)
			const endOfWeek = new Date(startOfWeek);
			endOfWeek.setDate(startOfWeek.getDate() + 7); // Ajusta para o sábado da semana

			// Consulta para pegar os eventos da semana
			if (role === 'doctor') {
				const events = await Event.find({
					clinicId,
					doctor: _id,
					start: { $gte: startOfWeek, $lt: endOfWeek },
				}).select('-userId -clinicId -__v -atendStart -confirm');
				res.status(200).json(events);
				return;
			} else {
				const events = await Event.find({
					clinicId,
					start: { $gte: startOfWeek, $lt: endOfWeek },
				}).select('-userId -clinicId -__v -atendStart -confirm');
				res.status(200).json(events);
				return;
			}
		}
		// const events = await Event.find({ clinicId });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const getWaitEvents = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId, role, _id } = req.tokenValue as IToken;
		const waitEvents = await Event.find({
			clinicId,
			status: { $in: ['atendimento', 'chegada'] },
			...(role === 'doctor' ? { doctor: _id } : {}),
		}).select('doctor status type plan start patientNasc title _id patientId');
		res.status(200).json(waitEvents);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const getHistoryEvents = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId, _id, role } = req.tokenValue as IToken;

		if (role === 'doctor') {
			const [historyEvents, doctors, plans] = await Promise.all([
				Event.find({ clinicId, doctor: _id, status: 'atendido' })
					.select('patientId title atendStart type doctor plan patientNasc')
					.limit(15)
					.sort({ atendStart: -1 }),
				User.find({ role: 'doctor', clinicId }).select('_id name').sort({ name: 1 }),
				Plan.find({ clinicId }).sort({ name: 1 }),
			]);
			res.status(200).json({ historyEvents, doctors, plans });
			return;
		}
		if (role !== 'doctor') {
			const [historyEvents, doctors, plans] = await Promise.all([
				Event.find({ clinicId, status: 'atendido' })
					.select('patientId title atendStart typ doctor type plan patientNasc')
					.limit(15)
					.sort({ atendStart: -1 }),
				User.find({ role: 'doctor', clinicId }).select('_id name').sort({ name: 1 }),
				Plan.find({ clinicId }).sort({ name: 1 }),
			]);
			res.status(200).json({ historyEvents, doctors, plans });
			return;
		}
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const getDoctorEvents = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId, _id } = req.tokenValue as IToken;
		const events = await Event.find({ clinicId, doctor: _id });
		res.status(200).json(events);
		return;
	} catch (error) {
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const dropEvent = async (req: CustomRequest, res: Response) => {
	try {
		const clinicId = req.tokenValue?.clinicId;
		const userId = req.tokenValue?._id;
		const { _id, start, end } = req.body;
		if (!_id) {
			res.status(400).json({ message: 'O id do evento é obrigatório.' });
			return;
		}

		const exist = await Event.findOne({ _id, clinicId });

		if (exist?.status != 'agendado' && exist?.status != 'bloqueado') {
			res.status(400).json({
				message: 'Nao é possivel alterar o status da consulta. Paciente com chegada, em atendimento ou já atendido.',
			});
			return;
		}

		if (new Date(start).toString().split(' ')[0] === 'Sat' || new Date(start).toString().split(' ')[0] === 'Sun') {
			res.status(400).json({ message: 'Não é possível agendar nos finais de semana.' });
			return;
		}

		if (new Date(start).getTime() < new Date().getTime()) {
			res.status(400).json({ message: 'Data selecionada é inferior ao dia de hoje.' });
			return;
		}

		const event = await Event.findOneAndUpdate({ _id, clinicId }, { start, end, userId }, { new: true });
		if (!event) {
			res.status(404).json({ message: 'Evento não encontrado' });
			return;
		}
		res.status(200).json({ message: 'Evento alterado com sucesso!', event });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const updateEvent = async (req: CustomRequest, res: Response) => {
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
		const update = await Event.findOneAndUpdate(
			{ _id, clinicId },
			{ userId, patientId, patientNasc, title, phone, plan, doctor, start, end, type, blocked, status, planNumber, obs },
			{ new: true }
		);
		res.status(200).json({ message: 'Evento alterado com sucesso!', update });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const deleteEvent = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId } = req.tokenValue as IToken;
		const { id } = req.query;

		const event = await Event.findOne({ _id: id });

		if (event?.status === 'chegada' || event?.status === 'atendido' || event?.status === 'atendimento') {
			res.status(400).json({ message: 'Não é possivel excluir. Paciente em espera, atendimento ou atendido.' });
			return;
		}

		await Event.findByIdAndDelete({ _id: id, clinicId });

		res.status(200).json({ message: 'Evento removido com sucesso!' });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const changeStatus = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId } = req.tokenValue as IToken;
		const { _id, status, confirm } = req.body;
		const event = await Event.findOneAndUpdate({ _id, clinicId }, { status, confirm }, { new: true });
		res.status(200).json({ message: 'Status alterado com sucesso!', event });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const changeConfirmed = async (req: CustomRequest, res: Response) => {
	try {
		const { clinicId } = req.tokenValue as IToken;
		const { _id, confirmed } = req.body;
		const event = await Event.findOneAndUpdate({ _id, clinicId }, { confirmed }, { new: true });
		res.status(200).json({ message: 'Status de Whatsapp alterado com sucesso!', event });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};
