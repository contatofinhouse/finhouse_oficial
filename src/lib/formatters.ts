export const formatCPF = (value: string) => {
  let v = value.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 9) v = v.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/^(\d{3})(\d{3})(\d{3}).*/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/^(\d{3})(\d{3}).*/, '$1.$2');
  return v;
};

export const formatTelefone = (value: string) => {
  let v = value.replace(/\D/g, '');
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 10) v = v.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
  else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5}).*/, '($1) $2');
  return v;
};

export const formatCEP = (value: string) => {
  let v = value.replace(/\D/g, '');
  if (v.length > 8) v = v.slice(0, 8);
  if (v.length > 5) v = v.replace(/^(\d{5})(\d{1,3}).*/, '$1-$2');
  return v;
};

export const formatCurrency = (value: string) => {
  let v = value.replace(/\D/g, '');
  if (!v) return '';
  v = (parseInt(v) / 100).toFixed(2) + '';
  v = v.replace('.', ',');
  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  return `R$ ${v}`;
};

export const formatDate = (value: string) => {
  let v = value.replace(/\D/g, '');
  if (v.length > 8) v = v.slice(0, 8);
  if (v.length > 4) v = v.replace(/^(\d{2})(\d{2})(\d{4}).*/, '$1/$2/$3');
  else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,2}).*/, '$1/$2');
  return v;
};

// Validations
export const isValidCPF = (cpf: string) => {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.length === 11;
};

export const isValidCEP = (cep: string) => {
  return cep.replace(/\D/g, '').length === 8;
};
