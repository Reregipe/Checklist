export type Setor = 'STC' | 'OBRAS';
export type ModalidadeObras = 'LV' | 'LM' | null;

export type Equipe = {
  codigo: string;
  descricao: string;
  setor: Setor;
  modalidadeObras: ModalidadeObras;
};

const stcCodigos = [
  'ECBSN01',
  'ECBSN02',
  'ECBSN03',
  'ECBSN04',
  'ECBSN05',
  'ECBSN06',
  'ECBSN07',
  'ECBSN08',
  'ECBSN09',
  'ECBSN10',
  'ECBSN11',
  'ECBSN12',
  'ECBSN13',
  'ECBSN14',
  'ECBSN15',
  'ECBSN16',
  'ECBSN17',
  'ECHSN04',
  'ECHSN05',
  'EJANS02',
  'EMSSN01',
  'EMSSN02',
  'EMSSN03',
  'EMSSN04',
  'EMSSN05',
  'EMSSN06',
  'EMSSN07',
  'EMSSN08',
  'ENOBS01',
  'ENOBS03',
  'ENOBS04',
  'EROSS01',
  'EROSS02',
  'EROSS04',
  'MANSN01',
];

const stcEquipes: Equipe[] = stcCodigos.map((codigo) => ({
  codigo,
  descricao: codigo,
  setor: 'STC',
  modalidadeObras: null,
}));

const obrasEquipes: Equipe[] = [
  { codigo: 'E-08', descricao: 'E-08 (LM)', setor: 'OBRAS', modalidadeObras: 'LM' },
  { codigo: 'E-14', descricao: 'E-14 (LM)', setor: 'OBRAS', modalidadeObras: 'LM' },
  { codigo: 'E-20', descricao: 'E-20 (LM)', setor: 'OBRAS', modalidadeObras: 'LM' },
  { codigo: 'E-24', descricao: 'E-24 (LM)', setor: 'OBRAS', modalidadeObras: 'LM' },
  { codigo: 'E-25', descricao: 'E-25 (LM)', setor: 'OBRAS', modalidadeObras: 'LM' },
  { codigo: 'E-29', descricao: 'E-29 (LM)', setor: 'OBRAS', modalidadeObras: 'LM' },
  { codigo: 'E-34', descricao: 'E-34 (LM)', setor: 'OBRAS', modalidadeObras: 'LM' },
  { codigo: 'E-35', descricao: 'E-35 (LM)', setor: 'OBRAS', modalidadeObras: 'LM' },
  { codigo: 'E-67', descricao: 'E-67 (LM)', setor: 'OBRAS', modalidadeObras: 'LM' },
  { codigo: 'E-91', descricao: 'E-91 (LM)', setor: 'OBRAS', modalidadeObras: 'LM' },
  { codigo: 'E-92', descricao: 'E-92 (LM)', setor: 'OBRAS', modalidadeObras: 'LM' },
  { codigo: 'E-100', descricao: 'E-100 (LM)', setor: 'OBRAS', modalidadeObras: 'LM' },
  { codigo: 'E-10', descricao: 'E-10 (LV)', setor: 'OBRAS', modalidadeObras: 'LV' },
  { codigo: 'E-36', descricao: 'E-36 (LV)', setor: 'OBRAS', modalidadeObras: 'LV' },
  { codigo: 'E-68', descricao: 'E-68 (LV)', setor: 'OBRAS', modalidadeObras: 'LV' },
  { codigo: 'E-99', descricao: 'E-99 (LV)', setor: 'OBRAS', modalidadeObras: 'LV' },
];

export const equipes: Equipe[] = [...stcEquipes, ...obrasEquipes];
