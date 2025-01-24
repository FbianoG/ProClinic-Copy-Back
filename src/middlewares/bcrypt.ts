import bcrypt from 'bcrypt';

const saltRounds = 10; // Número de rounds de salt - quanto maior, mais seguro, mas também mais lento.

export const hashPassword = async (password: string) => {
	try {
		const salt = await bcrypt.genSalt(saltRounds); // aleatoriza mais ainda os "salt"
		const hash = await bcrypt.hash(password, salt); // cria o hash - (senhaDigitada, salt)
		return hash;
	} catch (error) {
		throw error;
	}
};

// Exemplo de função para verificar uma senha
export const comparePassword = async (plainPassword: string, hashedPassword: string) => {
	try {
		const match = await bcrypt.compare(plainPassword, hashedPassword); 
		return match;
	} catch (error) {
		throw error;
	}
};
