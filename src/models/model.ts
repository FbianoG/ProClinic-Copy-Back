import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		lowercase: true,
		trim: true,
	},
	clinicId: {
		type: String,
		required: true,
		trim: true,
	},
	login: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
	},
	password: {
		type: String,
		required: true,
		trim: true,
	},
	role: {
		type: String,
		required: true,
		trim: true,
		enum: ['recep', 'admin', 'doctor'],
	},
	crm: {
		type: String,
		trim: true,
	},
	cbo: {
		type: String,
		trim: true,
	},
});

const EventSchema = new mongoose.Schema({
	userId: {
		type: String,
		trim: true,
		required: true,
	},
	patientId: {
		type: String,
		trim: true,
	},
	clinicId: {
		type: String,
		trim: true,
		required: true,
	},
	patientNasc: {
		type: Date,
		trim: true,
	},
	title: {
		type: String,
		required: true,
		trim: true,
		lowercase: true,
	},
	phone: {
		type: String,
		trim: true,
	},
	plan: {
		type: String,
		trim: true,
		lowercase: true,
	},
	planNumber: {
		type: String,
		trim: true,
		lowercase: true,
	},
	doctor: {
		type: String,
		trim: true,
	},
	start: {
		type: Date,
		trim: true,
		required: true,
	},
	end: {
		type: Date,
		trim: true,
		required: true,
	},
	atendStart: {
		type: Date,
		trim: true,
	},
	type: {
		type: String,
		trim: true,
		lowecase: true,
		required: true,
	},
	status: {
		type: String,
		enum: ['cancelado', 'agendado', 'atendido', 'chegada', 'atendimento', 'bloqueado'],
		trim: true,
		lowecase: true,
		required: true,
	},
	blocked: {
		type: Boolean,
		trim: true,
		lowecase: true,
	},
	confirm: {
		type: Date,
	},
	confirmed: {
		type: String,
		enum: ['0', '1', '3'],
	},
	obs: {
		type: String,
		trim: true,
	},
});

const PatientSchema = new mongoose.Schema({
	clinicId: {
		type: String,
		trim: true,
		// required: true,
	},
	name: {
		type: String,
		required: true,
		lowercase: true,
		trim: true,
	},
	nasc: {
		type: Date,
		required: true,
	},
	cpf: {
		type: String,
		trim: true,
		length: 11,
	},
	mother: {
		type: String,
		trim: true,
		required: true,
		lowercase: true,
	},
	phone: {
		type: String,
		trim: true,
	},
	email: {
		type: String,
		trim: true,
		lowercase: true,
	},
	plan: {
		type: String,
		trim: true,
		lowercase: true,
	},
	planNumber: {
		type: String,
		trim: true,
	},
	gender: {
		type: String,
		enum: ['mas', 'fem'],
		trim: true,
		lowercase: true,
		required: true,
	},
	address: {
		type: String,
		trim: true,
	},
	addressNumber: {
		type: String,
		trim: true,
	},
	neighborhood: {
		type: String,
		trim: true,
	},
	city: {
		type: String,
		trim: true,
	},
	state: {
		type: String,
		trim: true,
	},
	cep: {
		type: String,
		trim: true,
	},
	tempId: {
		type: Number,
		trim: true,
	},
});

const ClinicSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		lowercase: true,
		trim: true,
	},
	address: {
		type: String,
		required: true,
		trim: true,
	},
	phone: {
		type: String,
		trim: true,
	},
	cnpj: {
		type: String,
		trim: true,
		unique: true,
		required: true,
	},
	start: {
		type: String,
		trim: true,
		required: true,
	},
	end: {
		type: String,
		trim: true,
		required: true,
	},
	src: {
		type: String,
		trim: true,
	},
});

const MedicalRecordSchema = new mongoose.Schema({
	patientId: {
		type: String,
		trim: true,
		required: true,
	},
	doctorId: {
		type: String,
		required: true,
	},
	clinicId: {
		type: String,
		required: true,
	},
	date: {
		type: Date,
		trim: true,
		required: true,
	},
	dateStart: {
		type: Date,
		trim: true,
		required: true,
	},
	dateEnd: {
		type: Date,
		trim: true,
		required: true,
	},
	dateConfirm: {
		type: Date,
		trim: true,
		required: true,
	},
	complaint: String,
	currentHistory: String,
	medicalHistory: String,
	physicalExam: String,
	diagnostic: String,
	conduct: String,
	prescription: String,
});

const PlanSchema = new mongoose.Schema({
	clinicId: {
		type: String,
		// required: true,
	},
	name: {
		type: String,
		// required: true,
		lowercase: true,
		trim: true,
	},
	login: {
		type: String,
		trim: true,
	},
	password: {
		type: String,
		trim: true,
	},
	web: {
		type: String,
		trim: true,
	},
	src: {
		type: String,
		trim: true,
	},
	cod: {
		type: String,
		trim: true,
	},
	tel: {
		type: String,
		trim: true,
	},
	email: {
		type: String,
		trim: true,
		lowercase: true,
	},
	obs: String,
	tuss: {
		type: Array,
	},
});

const DocumentSchema = new mongoose.Schema(
	{
		clinicId: {
			type: String,
			required: true,
			trim: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		src: {
			type: String,
			trim: true,
			required: true,
		},
		size: {
			type: Number,
			required: true,
		},
		category: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
		},
		docName: {
			type: String,
			trim: true,
			required: true,
			lowercase: true,
			unique: true,
		},
	},
	{ timestamps: true }
);

export const Plan = mongoose.model('Plan', PlanSchema);

export const User = mongoose.model('User', UserSchema);

export const Event = mongoose.model('Event', EventSchema);

export const Patient = mongoose.model('Patient', PatientSchema);

export const Clinic = mongoose.model('Clinic', ClinicSchema);

export const MedicalRecord = mongoose.model('MedicalRecord', MedicalRecordSchema);

export const Document = mongoose.model('document', DocumentSchema);
