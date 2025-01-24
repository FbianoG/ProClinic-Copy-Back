import { Request, Response } from 'express';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import storage from '../firebase';
import { IToken } from '../interfaces/token';
import { Document } from '../models/model';

// Estender o tipo Request para incluir 'file'
declare global {
	namespace Express {
		interface Request {
			file?: Express.Multer.File; // Para arquivos únicos
			files?: Express.Multer.File[]; // Para múltiplos arquivos (caso necessário)
		}
	}
}

interface CustonRequest extends Request {
	tokenValue?: IToken;
}

export const createDocument = async (req: CustonRequest, res: Response) => {
	try {
		const { clinicId } = req.tokenValue as IToken;
		const { name, category } = req.body;
		if (!name || name.trim() === '' || !category || category.trim() === '') {
			res.status(400).json({ message: 'Preencha todos os dados.' });
			return;
		}

		const exist = await Document.findOne({ name, clinicId });
		if (exist) {
			res.status(400).json({ message: 'Já possui um documento com esse nome.' });
			return;
		}

		let file = req.file;
		if (!file) {
			res.status(400).json({ message: 'Nenhum arquivo enviado.' });
			return;
		}

		const mimetype = file.mimetype.split('/')[1];
		if (mimetype !== 'pdf') {
			res.status(400).json({ message: 'Somente arquivos PDF são permitidos.' });
			return;
		}

		file.filename = name.toUpperCase();

		const docName = new Date().getTime();

		const auth = getAuth();
		await signInWithEmailAndPassword(auth, 'fabiano@gmail.com', '123456');
		const storageRef = ref(storage, `ProClinic/${clinicId}/${docName}.pdf`);
		const snapshot = await uploadBytes(storageRef, file.buffer, {
			contentType: file.mimetype,
		});
		const url = await getDownloadURL(snapshot.ref); // cria o link do arquivo para visualizar

		const document = {
			name,
			category,
			clinicId,
			src: url,
			size: file.size,
			docName,
		};

		const create = await Document.create(document);

		res.status(201).json({ message: 'Documento criado com sucesso!', create });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const getDocuments = async (req: CustonRequest, res: Response) => {
	try {
		const { clinicId } = req.tokenValue as IToken;
		const documents = await Document.find({ clinicId });
		res.status(200).json(documents);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const updateDocument = async (req: CustonRequest, res: Response) => {
	try {
		const { clinicId } = req.tokenValue as IToken;
		const { _id, name, category } = req.body;

		if (!name || name.trim() === '' || !category || category.trim() === '') {
			res.status(400).json({ message: 'Preencha todos os dados.' });
			return;
		}

		const findDoc = await Document.findById({ _id });
		if (!findDoc) {
			res.status(400).json({ message: 'Documento nao encontrado. Tente novamente!' });
			return;
		}

		const exist = await Document.findOne({ name, clinicId });
		if (exist && exist._id.toString() !== _id) {
			res.status(400).json({ message: 'Já possui um documento com esse nome.' });
			return;
		}

		let file = req.file;
		if (!file) {
			const document = await Document.findOneAndUpdate({ _id, clinicId }, { name, category }, { new: true });
			res.status(200).json(document);
			return;
		}
		if (file) {
			const mimetype = file.mimetype.split('/')[1];
			if (mimetype !== 'pdf') {
				res.status(400).json({ message: 'Somente arquivos PDF são permitidos.' });
				return;
			}
			const auth = getAuth();
			await signInWithEmailAndPassword(auth, 'fabiano@gmail.com', '123456');
			const storageRef = ref(storage, `ProClinic/${clinicId}/${findDoc.docName}.pdf`);
			await deleteObject(storageRef);
			const snapshot = await uploadBytes(storageRef, file.buffer, {
				contentType: file.mimetype,
			});
			const url = await getDownloadURL(snapshot.ref); // cria o link do arquivo para visualizar
			
			await Document.findOneAndUpdate({ _id, clinicId }, { name, category, src: url, size: file.size }, { new: true });
		}

		res.status(200).json(_id);
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};

export const deleteDocument = async (req: CustonRequest, res: Response) => {
	try {
		const { clinicId } = req.tokenValue as IToken;
		let { id, docName } = req.query;
		if (!id || !docName) {
			res.status(400).json({ message: 'Dados não fornecidos para exclusão do documento' });
			return;
		}

		const auth = getAuth();
		await signInWithEmailAndPassword(auth, 'fabiano@gmail.com', '123456');
		const storageRef = ref(storage, `ProClinic/${clinicId}/${docName}.pdf`);
		await Promise.all([Document.findByIdAndDelete({ _id: id, clinicId }), deleteObject(storageRef)]);
		res.status(200).json({ message: 'Documento removido com sucesso!' });
		return;
	} catch (error) {
		console.log(error);
		res.status(500).json({ message: 'Erro interno de servidor' });
		return;
	}
};
