import re

def validate_cpf(cpf):
    cpf = re.sub(r'[^0-9]', '', str(cpf))
    if len(cpf) != 11:
        return False
    
    if cpf == cpf[0] * 11:
        return False
        
    for i in range(9, 11):
        value = sum((int(cpf[num]) * ((i + 1) - num) for num in range(0, i)))
        digit = ((value * 10) % 11) % 10
        if digit != int(cpf[i]):
            return False
    return True

def validate_cnpj(cnpj):
    cnpj = re.sub(r'[^0-9]', '', str(cnpj))
    if len(cnpj) != 14:
        return False
        
    if cnpj == cnpj[0] * 14:
        return False
        
    def calc_digit(cnpj_base, pesos):
        soma = sum(int(digito) * peso for digito, peso in zip(cnpj_base, pesos))
        resto = soma % 11
        return 0 if resto < 2 else 11 - resto
        
    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    
    digito1 = calc_digit(cnpj[:12], pesos1)
    if digito1 != int(cnpj[12]):
        return False
        
    digito2 = calc_digit(cnpj[:13], pesos2)
    if digito2 != int(cnpj[13]):
        return False
        
    return True
