import { Router } from 'express';
import { getClinic, updateClinic } from '../controllers/clinicController';
// next-line é combo e req para evitar muitas reqs
import { getAgenda, getAtend, getDashboard, getReports, updateEditEvent } from '../controllers/comboController';
import { createDocument, deleteDocument, getDocuments, updateDocument } from '../controllers/documentsController';
import {
	changeConfirmed,
	changeStatus,
	createEvent,
	deleteEvent,
	dropEvent,
	getDoctorEvents,
	getEvents,
	getHistoryEvents,
	getWaitEvents,
	updateEvent,
} from '../controllers/eventsController';
import { createMedicalRecord, getMedicalRecord, initAtend } from '../controllers/medicalRecordController';
import { createPatient, getPatient, searchPatients, searchPatientsList, updatePatient } from '../controllers/patientsController';
import { createPlan, editPlan, editTussPlan, getPlans } from '../controllers/planController';
import { createUser, getDoctors, getUsers, login, updateUser } from '../controllers/userController';
import { verifyToken } from '../middlewares/jwt';
import upload from '../middlewares/multer';

const router = Router();

// Usuários --->
router.post('/login', login);
router.put('/createUser', verifyToken, createUser);
router.get('/getDoctors', verifyToken, getDoctors);
router.get('/getUsers', verifyToken, getUsers);
router.post('/updateUser', verifyToken, updateUser);

// ! COMBO --->
router.get('/getDashboard', verifyToken, getDashboard);
router.get('/getAgenda', verifyToken, getAgenda);
router.post('/updateEditEvent', verifyToken, updateEditEvent);
router.get('/getAtend', verifyToken, getAtend);
router.get('/getReports', verifyToken, getReports);

// Eventos --->
router.get('/getEvents', verifyToken, getEvents);
router.get('/getWaitEvents', verifyToken, getWaitEvents);
router.get('/getDoctorEvents', verifyToken, getDoctorEvents);
router.get('/getHistoryEvents', verifyToken, getHistoryEvents);
router.put('/createEvent', verifyToken, createEvent);
router.post('/updateEvent', verifyToken, updateEvent);
router.post('/dropEvent', verifyToken, dropEvent);
router.post('/changeConfirmed', verifyToken, changeConfirmed);
router.delete('/deleteEvent', verifyToken, deleteEvent);

// Registro Medico --->
router.put('/createMedicalRecord', verifyToken, createMedicalRecord);
router.get('/getMedicalRecord', verifyToken, getMedicalRecord);
router.post('/initAtend', verifyToken, initAtend);

// Planos --->
router.put('/createPlan', verifyToken, createPlan);
router.post('/editPlan', verifyToken, editPlan);
router.get('/getPlans', verifyToken, getPlans);
router.post('/editTussPlan', verifyToken, editTussPlan);

// Clinica --->
router.get('/getClinic', verifyToken, getClinic);
router.post('/updateClinic', verifyToken, updateClinic);
// Patcientes --->
router.put('/createPatient', verifyToken, createPatient);
router.get('/getPatient', verifyToken, getPatient);
router.get('/searchPatients', verifyToken, searchPatients);
router.post('/searchPatientsList', verifyToken, searchPatientsList);
router.post('/updatePatient', verifyToken, updatePatient);
router.post('/changeStatus', verifyToken, changeStatus);

// Documetos
router.get('/getDocuments', verifyToken, getDocuments);
router.put('/createDocument', verifyToken, upload.single('file'), createDocument);
router.post('/updateDocument', verifyToken, upload.single('file'), updateDocument);
router.delete('/deleteDocument', verifyToken, deleteDocument);

import { Request, Response } from 'express';
import fs from 'fs';
import { Event, MedicalRecord, Patient } from '../models/model';

// ! teste para incluir dados
// router.put('/addEvent', async (req: Request, res: Response) => {
// 	try {
// 		const json = fs.readFileSync('./public/events.json', 'utf-8');
// 		const data = JSON.parse(json);

// 		const selectDoctor = (id: any) => {
// 			switch (id) {
// 				case 292882:
// 					return '679060e1d347a2c32fa933bb';
// 				case 292883:
// 					return '679060c1d347a2c32fa933b8';
// 				case 292884:
// 					return '679060fbd347a2c32fa933be';
// 				case 292885:
// 					return '679062eed347a2c32fa93401';
// 			}
// 		};

// 		const newData = data.map((e: any) => {
// 			const procedure = e.procedure_pack.replace('json::', '');
// 			return {
// 				clinicId: '6707575a5bccd97e5cf0bc36',
// 				userId: '6757d3581cfb5a42ee75bb6d',
// 				title: e.patient_name
// 					? e.patient_name
// 							.normalize('NFD')
// 							.replace(/[\u0300-\u036f]/g, '')
// 							.toLowerCase()
// 					: 'nome',
// 				patientNasc: '2000-05-10T00:00:00.000+00:00',
// 				start: new Date(`${e.date}T${e.start_time}.000-03:00`),
// 				end: new Date(`${e.date}T${e.end_time}.000-03:00`),
// 				plan: '675686ddc0917fc8878c7f08',
// 				planNumber: '214124',
// 				doctor: selectDoctor(e.physician_id),
// 				phone: e.patient_mobile_phone ? e.patient_mobile_phone.replace(/[()\s-]/g, '') : '0000000000',
// 				type: procedure ? JSON.parse(procedure)[0]?.name?.toLowerCase() || 'consulta' : 'consulta',
// 				status: 'agendado',
// 			};
// 		});

// 		// const update = await Event.updateMany(
// 		// 	{ data: { $exists: false } },
// 		// 	{ $set: { data: '2000-05-10T00:00:00.000+00:00' } }
// 		// );

// 		const create = await Event.insertMany(newData);

// 		res.status(200).json(newData);
// 		return;
// 	} catch (error) {
// 		console.log(error);
// 		res.status(400).json({ message: error });
// 		return;
// 	}
// });

// router.put('/addPatient', async (req: Request, res: Response) => {
// 	try {
// 		const json = fs.readFileSync('./public/patients.json', 'utf-8');
// 		const j = JSON.parse(json);
// 		const n = j.map((e: any) => {
// 			const p = {
// 				clinicId: '6707575a5bccd97e5cf0bc36',
// 				tempId: e.patient_id,
// 				name: e.name
// 					? e.name
// 							.normalize('NFD')
// 							.replace(/[\u0300-\u036f]/g, '')
// 							.toLowerCase()
// 					: 'nome',
// 				nasc: `${e.birthdate || '2000-05-10'}T00:00:00.000+00:00`,
// 				phone: e.mobile_phone?.replace(/[()\s-]/g, '') || e.home_phone?.replace(/[()\s-]/g, ''),
// 				mother: 's/n',
// 				email: e.email,
// 				state: e.state,
// 				city: e.city,
// 				address: e.address,
// 				addressNumber: e.number.toString(),
// 				neighborhood: e.neighborhood,
// 				cep: e.zip_code.toString().replace(/[-\s]/g, ''),
// 				plan: '676268cb095cad37986acada',
// 				gender: e.gender === 'm' ? 'mas' : 'fem',
// 				planNumber: '12312312',
// 				cpf: e.cpf?.toString().replace(/[.\s-]/g, ''),
// 			};
// 			return p;
// 		});

// 		await Patient.insertMany(n);

// 		res.status(200).json({ message: 'Incluido paciente com sucesso!' });
// 		return;
// 	} catch (error: any) {
// 		console.log(error);
// 		res.status(500).json({ message: 'Erro interno de servidor.' });
// 		return;
// 	}
// });

// router.put('/addPront', async (req: Request, res: Response) => {
// 	try {
// 		const json = fs.readFileSync('./public/prontuario.json', 'utf-8');
// 		const data = JSON.parse(json);

// 		const selectDoctor = (id: any) => {
// 			switch (id) {
// 				case 292882:
// 					return '679060e1d347a2c32fa933bb';
// 				case 292883:
// 					return '679060c1d347a2c32fa933b8';
// 				case 292884:
// 					return '679060fbd347a2c32fa933be';
// 				case 292885:
// 					return '679062eed347a2c32fa93401';
// 			}
// 		};

// 		const editedData = data.map((item: any) => {
// 			// Conversão da data de início
// 			const startDate = new Date(item.date);
// 			const [hours, minutes] = item.start_time.split(':').map(Number);
// 			startDate.setHours(hours + 3, minutes, 0, 0); // Adiciona 3 horas ao start_time
// 			const eventBlock = item.eventblock_pack ? JSON.parse(item.eventblock_pack.replace('json::', '')) : [];
// 			return {
// 				tempId: item.patient_id,
// 				date: new Date(item.date + 'T' + item.start_time + '-03:00'),
// 				dateConfirm: new Date(item.dateStart),
// 				dateStart: new Date(item.dateStart),
// 				dateEnd: new Date(item.dateEnd),
// 				doctorId: selectDoctor(item.physician_id),
// 				complaint:
// 					eventBlock.block?.find((block: any) => block.name === 'Queixa principal:')?.value.replace(/<\/?p>|<br\s*\/?>/g, '') ||
// 					'',
// 				conduct: eventBlock.block?.find((block: any) => block.name === 'Condutas:')?.value.replace(/<\/?p>|<br\s*\/?>/g, '') || '',
// 				currentHistory:
// 					eventBlock.block
// 						?.find((block: any) => block.name === 'História da moléstia atual:')
// 						?.value.replace(/<\/?p>|<br\s*\/?>/g, '') || '',
// 				physicalExam:
// 					eventBlock.block?.find((block: any) => block.name === 'Exame fisico:')?.value.replace(/<\/?p>|<br\s*\/?>/g, '') || '',
// 			};
// 		});

// 		for (const element of editedData) {
// 			const patientt = await Patient.findOne({ tempId: element.tempId });
// 			if (patientt) {
// 				await MedicalRecord.create({
// 					...element,
// 					patientId: patientt._id.toString(),
// 					clinicId: '6707575a5bccd97e5cf0bc36',
// 				});
// 			} else {
// 				console.log(element);
// 			}
// 		}
// 		res.status(200).json({ message: 'Prontuários incluídos.' });
// 		return;
// 	} catch (error) {
// 		console.log(error);
// 		res.status(500).json({ message: 'Erro interno de servidor.' });
// 		return;
// 	}
// });

export default router;
