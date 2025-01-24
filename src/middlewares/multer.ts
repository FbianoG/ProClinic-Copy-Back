import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = function (req: any, file: any, cb: any) {
	// "fileFilter" são as configuraçãoes do documento
	const allowedFileTypes = /pdf/; // Aceitar apenas arquivos com extensões específicas
	const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
	const mimetype = allowedFileTypes.test(file.mimetype);

	if (extname && mimetype) {
		return cb(null, true);
	} else {
		cb('Erro: Tipos de arquivos permitidos são png, jpg, jpeg, pdf, doc!');
	}
};
const limits = {
	// Ajusta o tamanho máximo do arquivo permitido
	fileSize: 4 * 1024 * 1024, // 4 MB
    
};
const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: limits,
    
});

export default upload;
