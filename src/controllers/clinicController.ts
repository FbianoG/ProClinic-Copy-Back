import { Request, Response } from 'express';
import { Clinic } from '../models/model';
import { IToken } from '../interfaces/token';

interface CustonRequest extends Request {
	tokenValue?: IToken;
}

export const getClinic = async (req: CustonRequest, res: Response) => {
	try {
		const clinicId = req.tokenValue?.clinicId;
		const clinic = await Clinic.findOne({ _id: clinicId });
		res.status(200).json(clinic);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const updateClinic = async (req: CustonRequest, res: Response) => {
	try {
		const { clinicId } = req.tokenValue as IToken;
		const { name, cnpj, phone, address } = req.body;

		const clinic = await Clinic.findByIdAndUpdate({ _id: clinicId }, { name, cnpj, phone, address }, { new: true });

		res.status(200).json({ message: 'Clínica atualizada com sucesso!', clinic });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};
