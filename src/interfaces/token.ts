export interface IToken {
	_id: string;
	name: string;
	login: string;
	role: string;
	clinicId: string;
	iat: number;
	exp: number;
}
