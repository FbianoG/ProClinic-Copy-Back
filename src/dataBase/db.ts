import mongoose from 'mongoose';
import 'dotenv/config';

const ConnectDataBase = async () => {
	try {
		await mongoose.connect(
			`mongodb+srv://${process.env.USER_DB}:${process.env.PASSWORD_DB}@cluster0.hkuw4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
		);
		console.log('Database connected!');
	} catch (error) {
		console.log(error);
	}
};

export default ConnectDataBase;
